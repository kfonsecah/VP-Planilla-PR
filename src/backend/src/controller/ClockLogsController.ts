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

}
