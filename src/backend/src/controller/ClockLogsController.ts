import { Request, Response } from "express";
import { ClockLogsService, ClockLogSource } from "../service/ClockLogsService";
import { ClockLogAnalysisService } from "../service/ClockLogAnalysisService";
import { ImportSessionService } from "../service/ImportSessionService";
import { prisma } from "../lib/prisma";
import { normalizeLogType } from "../utils/clockLogNormalization";

function normalizeName(value: string) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function resolveEmployeeId(
    employee_id: unknown,
    employee_name: unknown
): Promise<number | null> {
    if (employee_id != null) {
        const n = Number(employee_id);
        if (!isNaN(n)) return n;
    }

    if (!employee_name) return null;

    const normalized = normalizeName(String(employee_name));
    if (!normalized) return null;

    const employees = await prisma.vpg_employees.findMany({
        select: {
            employee_id: true,
            employee_first_name: true,
            employee_middle_name: true,
            employee_last_name: true
        },
        where: { employee_fired: false },
        orderBy: { employee_id: 'asc' }
    });

    for (const emp of employees) {
        const fullWithMiddle = normalizeName(
            `${emp.employee_first_name} ${emp.employee_middle_name ?? ''} ${emp.employee_last_name}`
        );
        const fullWithout = normalizeName(
            `${emp.employee_first_name} ${emp.employee_last_name}`
        );
        if (fullWithMiddle === normalized || fullWithout === normalized) {
            return emp.employee_id;
        }
    }
    return null;
}

export class ClockLogsController {
    /**
     * Get clock logs within a specified date range
     * GET /clock-logs?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with clock logs data or error
     */
    async getClockLogs(req: Request, res: Response): Promise<Response> {
        const { initDate, endDate } = req.query;

        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }

        const service = new ClockLogsService();
        try {
            const logs = await service.getClockLogs({
                initDate: new Date(initDate as string),
                endDate: new Date(endDate as string)
            });
            return res.json(logs);
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get aggregated stats grouped by status and source for a date range
     * GET /clock-logs/stats?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with stats data or error
     */
    async getStats(req: Request, res: Response): Promise<Response> {
        const { initDate, endDate } = req.query;

        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }

        const service = new ClockLogsService();
        try {
            const stats = await service.getStats(
                new Date(initDate as string),
                new Date(endDate as string)
            );

            const byStatus: Record<string, number> = {};
            const bySource: Record<string, number> = {};
            let total = 0;

            for (const s of stats) {
                byStatus[s.status] = (byStatus[s.status] || 0) + s.count;
                bySource[s.source] = (bySource[s.source] || 0) + s.count;
                total += s.count;
            }

            return res.json({
                success: true,
                data: { byStatus, bySource, total }
            });
        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Import clock logs with full session lifecycle tracking
     * POST /clock-logs/import
     * @param req - Express request containing logs array and optional source string
     * @param res - Express response with session summary
     * @returns Promise<Response> - HTTP 201 with { session_id, status, created, skipped, anomalies, errors[] }
     * @swagger
     * /api/clock-logs/import:
     *   post:
     *     tags:
     *       - Clock Logs
     *     summary: Import clock logs with session tracking
     *     description: Creates an import session, bulk-creates clock logs with session reference, and returns session summary with created/skipped/anomaly counts
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - logs
     *             properties:
     *               logs:
     *                 type: array
     *                 description: Array of clock log records to import
     *                 items:
     *                   type: object
     *                   properties:
     *                     employee_id:
     *                       type: integer
     *                     employee_name:
     *                       type: string
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     log_type:
     *                       type: string
     *                       enum: [IN, OUT, ENTRADA, SALIDA]
     *                     remarks:
     *                       type: string
     *               source:
     *                 type: string
     *                 enum: [java_import, excel_import, manual]
     *                 default: excel_import
     *     responses:
     *       '201':
     *         description: Import completed — returns session summary
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 session_id:
     *                   type: integer
     *                 status:
     *                   type: string
     *                   enum: [completed, partial, failed]
     *                 created:
     *                   type: integer
     *                 skipped:
     *                   type: integer
     *                 anomalies:
     *                   type: integer
     *                 errors:
     *                   type: array
     *                   items:
     *                     type: string
     *       '400':
     *         description: Invalid input — logs array missing or empty
     *       '500':
     *         description: Internal server error
     */
    async import(req: Request, res: Response): Promise<Response> {
        const { logs, source: rawSource } = req.body;

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de logs no vacío'
            });
        }

        const source: ClockLogSource = (['java_import', 'excel_import', 'manual'].includes(rawSource)
            ? rawSource
            : 'excel_import') as ClockLogSource;

        // Extract userId from JWT payload set by AuthMiddleware.verifyToken
        const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;

        let sessionId: number | undefined;

        try {
            // Create session
            const session = await ImportSessionService.createSession(source, logs.length, userId);
            sessionId = session.id;

            // Mark as running
            await ImportSessionService.updateSession(sessionId, { status: 'running' });

            // Resolve employees and normalize log types
            const resolved: Array<{
                employee_id: number;
                timestamp: Date;
                log_type: string;
                remarks: string | null;
            }> = [];
            const skipped: string[] = [];

            for (const l of logs) {
                if (!l.timestamp || !l.log_type) {
                    skipped.push(`Fila sin timestamp o log_type`);
                    continue;
                }

                const timestamp = new Date(l.timestamp);
                if (isNaN(timestamp.getTime())) {
                    skipped.push(`Timestamp inválido: ${l.timestamp}`);
                    continue;
                }

                const employeeId = await resolveEmployeeId(l.employee_id, l.employee_name);
                if (!employeeId) {
                    skipped.push(`No se encontró empleado: id=${l.employee_id} nombre="${l.employee_name}"`);
                    continue;
                }

                try {
                    const normalizedType = normalizeLogType(String(l.log_type));
                    resolved.push({
                        employee_id: employeeId,
                        timestamp,
                        log_type: normalizedType,
                        remarks: l.remarks ?? null
                    });
                } catch {
                    skipped.push(`Tipo de marca desconocido: "${l.log_type}"`);
                    continue;
                }
            }

            // Bulk create with session reference
            const service = new ClockLogsService();
            const result = await service.bulkCreate(resolved, source, sessionId);

            // Run anomaly detection analysis
            const analysis = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

            // Update session with final results
            await ImportSessionService.updateSession(sessionId, {
                status: 'completed',
                createdCount: result.created,
                skippedCount: skipped.length,
                anomalyCount: analysis.total
            });

            return res.status(201).json({
                session_id: sessionId,
                status: skipped.length > 0 ? 'partial' : 'completed',
                created: result.created,
                skipped: skipped.length,
                anomalies: analysis.total,
                errors: skipped
            });
        } catch (error) {
            console.error('Error en import de clock logs:', error);

            // Mark session as failed if it was created
            if (sessionId !== undefined) {
                try {
                    await ImportSessionService.updateSession(sessionId, { status: 'failed' });
                } catch (updateError) {
                    console.error('Error al marcar sesión como fallida:', updateError);
                }
            }

            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                detail: String(error)
            });
        }
    }

    async bulkCreate(req: Request, res: Response): Promise<Response> {
        const { logs } = req.body;

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de logs no vacío' });
        }

        const resolved: Array<{
            employee_id: number;
            timestamp: Date;
            log_type: string;
            remarks: string | null;
        }> = [];
        const skipped: string[] = [];

        for (const l of logs) {
            if (!l.timestamp || !l.log_type) {
                skipped.push(`Fila sin timestamp o log_type`);
                continue;
            }

            const timestamp = new Date(l.timestamp);
            if (isNaN(timestamp.getTime())) {
                skipped.push(`Timestamp inválido: ${l.timestamp}`);
                continue;
            }

            const employeeId = await resolveEmployeeId(l.employee_id, l.employee_name);
            if (!employeeId) {
                skipped.push(`No se encontró empleado: id=${l.employee_id} nombre="${l.employee_name}"`);
                continue;
            }

            try {
                const normalizedType = normalizeLogType(String(l.log_type));
                resolved.push({
                    employee_id: employeeId,
                    timestamp,
                    log_type: normalizedType,
                    remarks: l.remarks ?? null
                });
            } catch (error) {
                skipped.push(`Tipo de marca desconocido: "${l.log_type}"`);
                continue;
            }
        }

        if (!resolved.length) {
            return res.status(400).json({
                error: 'No se pudieron resolver empleados para ningún log',
                skipped
            });
        }

        const service = new ClockLogsService();
        try {
            const source: ClockLogSource = 'manual';
            const result = await service.bulkCreate(resolved, source);
            return res.status(201).json({
                success: true,
                created: result.created,
                skipped,
                skipped_count: skipped.length,
                matched_count: resolved.length
            });
        } catch (error) {
            console.error('Error en bulkCreate de clock logs:', error);
            return res.status(500).json({ error: 'Error interno del servidor', detail: String(error) });
        }
    }

    /**
     * Get orphan clock logs with employee info, paginated
     * GET /clock-logs/orphans?page=1&pageSize=20&initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request with query parameters
     * @param res - Express response
     * @returns Promise<Response>
     */
    async getOrphans(req: Request, res: Response): Promise<Response> {
        try {
            const rawPage = parseInt(req.query.page as string);
            const rawPageSize = parseInt(req.query.pageSize as string);
            let page = isNaN(rawPage) ? 1 : rawPage;
            let pageSize = isNaN(rawPageSize) ? 20 : rawPageSize;

            // Clamp page to minimum 1
            const safePage = page < 1 ? 1 : page;

            // Validate pageSize bounds
            if (pageSize < 1) {
              return res.status(400).json({ error: 'pageSize must be >= 1' });
            }
            const MAX_PAGE_SIZE = 200;
            if (pageSize > MAX_PAGE_SIZE) {
              return res.status(400).json({ error: `pageSize cannot exceed ${MAX_PAGE_SIZE}` });
            }

            const initDate = req.query.initDate ? new Date(req.query.initDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            if (initDate && isNaN(initDate.getTime())) {
                return res.status(400).json({ error: 'Invalid initDate format' });
            }
            if (endDate && isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Invalid endDate format' });
            }

            const service = new ClockLogsService();
            const result = await service.getOrphans({ page: safePage, pageSize, initDate, endDate });

            return res.json({
                success: true,
                data: result.data,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get anomaly clock logs with employee info, paginated
     * GET /clock-logs/anomalies?page=1&pageSize=20&initDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=string
     * @param req - Express request with query parameters
     * @param res - Express response
     * @returns Promise<Response>
     */
    async getAnomalies(req: Request, res: Response): Promise<Response> {
        try {
            const rawPage = parseInt(req.query.page as string);
            const rawPageSize = parseInt(req.query.pageSize as string);
            let page = isNaN(rawPage) ? 1 : rawPage;
            let pageSize = isNaN(rawPageSize) ? 20 : rawPageSize;

            // Clamp page to minimum 1
            const safePage = page < 1 ? 1 : page;

            // Validate pageSize bounds
            if (pageSize < 1) {
              return res.status(400).json({ error: 'pageSize must be >= 1' });
            }
            const MAX_PAGE_SIZE = 200;
            if (pageSize > MAX_PAGE_SIZE) {
              return res.status(400).json({ error: `pageSize cannot exceed ${MAX_PAGE_SIZE}` });
            }

            const initDate = req.query.initDate ? new Date(req.query.initDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
            const type = req.query.type as string | undefined;

            if (initDate && isNaN(initDate.getTime())) {
                return res.status(400).json({ error: 'Invalid initDate format' });
            }
            if (endDate && isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Invalid endDate format' });
            }

            const service = new ClockLogsService();
            const result = await service.getAnomalies({ page: safePage, pageSize, initDate, endDate, type });

            return res.json({
                success: true,
                data: result.data,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Resolve an orphan clock log
     * POST /clock-logs/orphans/:id/resolve
     * @param req - Express request with params and body
     * @param res - Express response
     * @returns Promise<Response>
     */
    async resolveOrphan(req: Request, res: Response): Promise<Response> {
        try {
            const idParam = req.params.id;
            const orphanId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

            if (isNaN(orphanId) || orphanId <= 0) {
                return res.status(400).json({ error: 'ID de marca inválido' });
            }

            const { action, justification, complementTimestamp, complementLogType } = req.body as any;

            let complementData: { timestamp: Date; logType: 'IN' | 'OUT' } | undefined;
            if (action === 'assign_complement') {
                if (!complementTimestamp || !complementLogType) {
                    return res.status(400).json({ error: 'complementTimestamp y complementLogType son requeridos para assign_complement' });
                }
                const ts = new Date(complementTimestamp);
                if (isNaN(ts.getTime())) {
                    return res.status(400).json({ error: 'Timestamp de complemento inválido' });
                }
                complementData = { timestamp: ts, logType: complementLogType };
            }

            const service = new ClockLogsService();
            const result = await service.resolveOrphan(orphanId, action, justification, complementData);

            return res.json({ success: true, message: result.message });
        } catch (error: any) {
            if (error.message === 'Marca no encontrada') {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            if (error.message === 'La marca no tiene status orphan') {
                return res.status(400).json({ error: 'La marca no tiene status orphan' });
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    /**
     * Create a manual clock log entry
     * POST /clock-logs/correct
     * @param req - Express request with body containing manual log data
     * @param res - Express response
     * @returns Promise<Response> - HTTP 201 with { success: true, clockLogId }
     * @throws Error if validation fails or database operation fails
     */
    async createManualLog(req: Request, res: Response): Promise<Response> {
        const { employee_id, timestamp, log_type, remarks, justification } = req.body;

        // Extract userId from JWT payload set by AuthMiddleware.verifyToken
        const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;

        // Validate timestamp
        const ts = new Date(timestamp);
        if (isNaN(ts.getTime())) {
            return res.status(400).json({ error: 'Timestamp inválido' });
        }

        const service = new ClockLogsService();
        try {
            const result = await service.createManualLog({
                employee_id,
                timestamp: ts,
                log_type,
                remarks: remarks ?? null,
                created_by: userId,
                justification,
            });

            return res.status(201).json({ success: true, clockLogId: result.clockLogId });
        } catch (error: any) {
            if (error.message.includes('not found') || error.message.includes('no encontrado')) {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    /**
     * Get clock logs with pagination, status filter, and employee filter
     * GET /clock-logs/paginated?page=1&pageSize=20&initDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=orphan,anomaly&employee_id=1
     * @param req - Express request with query parameters
     * @param res - Express response
     * @returns Promise<Response> - HTTP response with paginated clock logs
     */
    async getClockLogsPaginated(req: Request, res: Response): Promise<Response> {
        try {
            const rawPage = parseInt(req.query.page as string);
            const rawPageSize = parseInt(req.query.pageSize as string);
            const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
            const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 20 : rawPageSize;

            const initDate = req.query.initDate ? new Date(req.query.initDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            if (initDate && isNaN(initDate.getTime())) {
                return res.status(400).json({ error: 'Invalid initDate format' });
            }
            if (endDate && isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Invalid endDate format' });
            }

            const statusRaw = req.query.status as string | undefined;
            const status = statusRaw ? statusRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined;

            const rawEmployeeId = parseInt(req.query.employee_id as string);
            const employee_id = isNaN(rawEmployeeId) ? undefined : rawEmployeeId;

            const service = new ClockLogsService();
            const result = await service.getClockLogsPaginated({ page, pageSize, initDate, endDate, status, employee_id });

            return res.json({ success: true, ...result });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get the most recent import sessions
     * GET /clock-logs/import-sessions?limit=5
     * @param req - Express request with optional limit query parameter
     * @param res - Express response
     * @returns Promise<Response> - HTTP response with array of recent import sessions
     */
    async getImportSessions(req: Request, res: Response): Promise<Response> {
        try {
            const rawLimit = parseInt(req.query.limit as string);
            const limit = isNaN(rawLimit) || rawLimit < 1 ? 5 : rawLimit;

            const sessions = await ImportSessionService.getRecentSessions(limit);
            return res.json({ success: true, data: sessions });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update a clock log's status with justification
     * PATCH /clock-logs/:id/status
     * @param req - Express request with params and body
     * @param res - Express response
     * @returns Promise<Response> - HTTP 200 with { success: true }
     * @throws Error if validation fails or database operation fails
     */
    async updateClockLogStatus(req: Request, res: Response): Promise<Response> {
        const idParam = req.params.id;
        const clockLogId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

        if (isNaN(clockLogId) || clockLogId <= 0) {
            return res.status(400).json({ error: 'ID de marca inválido' });
        }

        const { status, justification } = req.body;
        const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;

        const service = new ClockLogsService();
        try {
            await service.updateClockLogStatus({
                clockLogId,
                newStatus: status,
                justification,
                changed_by: userId,
            });

            return res.json({ success: true });
        } catch (error: any) {
            if (error.message === 'Marca no encontrada') {
                return res.status(404).json({ error: 'Marca no encontrada' });
            }
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}
