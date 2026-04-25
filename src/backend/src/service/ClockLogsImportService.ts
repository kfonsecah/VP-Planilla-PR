import { prisma } from "../lib/prisma";
import { ImportSessionService } from "./ImportSessionService";
import { ClockLogsService, ClockLogSource } from "./ClockLogsService";
import { ClockLogAnalysisService } from "./ClockLogAnalysisService";
import { normalizeLogType, inferLogTypeByTimeWindow, TimeWindowConfig } from "../utils/clockLogNormalization";
import { ClockAliasService } from "./ClockAliasService";

/**
 * Normalizes a name string for comparison.
 */
function normalizeName(value: string) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Resolves an employee ID from either a numeric ID, alias, or name.
 */
async function resolveEmployeeId(
    employee_id: unknown,
    employee_name: unknown
): Promise<number | null> {
    // 1. Try numeric ID first
    if (employee_id != null) {
        const n = Number(employee_id);
        if (!isNaN(n)) {
            const existing = await prisma.vpg_employees.findFirst({
                where: { employee_id: n, employee_fired: false },
                select: { employee_id: true }
            });
            if (existing) return n;
        }
    }

    if (!employee_name) return null;

    const normalized = normalizeName(String(employee_name));
    if (!normalized) return null;

    // 2. Check aliases table (before full name scan - faster indexed lookup)
    const aliasMatch = await ClockAliasService.resolveEmployeeByAlias(normalized);
    if (aliasMatch) return aliasMatch;

    // 3. Fallback to full name scan
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

export interface ImportResult {
    session_id: number;
    status: 'completed' | 'partial' | 'failed';
    created: number;
    skipped: number;
    anomalies: number;
    errors: string[];
}

export class ClockLogsImportService {
    /**
     * Orchestrates the import process for clock logs.
     */
    async processImport(logs: any[], source: ClockLogSource, userId: number): Promise<ImportResult> {
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
            const noTypeRows: Array<{
                employee_id: number;
                timestamp: Date;
                remarks: string | null;
            }> = [];

            for (const l of logs) {
                // Timestamp is always required
                if (!l.timestamp) {
                    skipped.push(`Fila sin timestamp`);
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

                if (!l.log_type) {
                    // Collect for inference - type will be assigned by sequence
                    noTypeRows.push({
                        employee_id: employeeId,
                        timestamp,
                        remarks: l.remarks ?? null,
                    });
                } else {
                    // Row has explicit log_type - normalize via existing function
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
                    }
                }
            }

            // Infer IN/OUT for rows without explicit type, BEFORE bulk insert
            if (noTypeRows.length > 0) {
                // Fetch active time windows to guide inference
                const activeWindows = await prisma.vpgTimeWindow.findMany({
                    where: { time_window_active: true },
                    select: {
                        time_window_name: true,
                        time_window_type: true,
                        time_window_start_hour: true,
                        time_window_end_hour: true,
                    }
                });
                
                const inferred = inferLogTypeByTimeWindow(noTypeRows, activeWindows);
                for (const row of inferred) {
                    resolved.push({
                        employee_id: row.employee_id,
                        timestamp: row.timestamp,
                        log_type: row.log_type,
                        remarks: row.remarks ?? null,
                    });
                }
            }

            // Bulk create with session reference
            const clockLogsService = new ClockLogsService();
            const result = await clockLogsService.bulkCreate(resolved, source, sessionId);

            // Run anomaly detection analysis
            const analysis = await ClockLogAnalysisService.runPostImportAnalysis(sessionId);

            // Update session with final results
            await ImportSessionService.updateSession(sessionId, {
                status: 'completed',
                createdCount: result.created,
                skippedCount: skipped.length,
                anomalyCount: analysis.total
            });

            return {
                session_id: sessionId,
                status: skipped.length > 0 ? 'partial' : 'completed',
                created: result.created,
                skipped: skipped.length,
                anomalies: analysis.total,
                errors: skipped
            };
        } catch (error) {
            console.error('Error en processImport de clock logs:', error);

            // Mark session as failed if it was created
            if (sessionId !== undefined) {
                try {
                    await ImportSessionService.updateSession(sessionId, { status: 'failed' });
                } catch (updateError) {
                    console.error('Error al marcar sesión como fallida:', updateError);
                }
            }
            throw error;
        }
    }

    /**
     * Resolves employee ID for a batch of logs.
     * Exposing it for use in other methods if needed.
     */
    async resolveEmployeeId(id: unknown, name: unknown): Promise<number | null> {
        return resolveEmployeeId(id, name);
    }
}
