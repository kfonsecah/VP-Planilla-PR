import { prisma } from "../lib/prisma";
import { ImportSessionService } from "./ImportSessionService";
import { ClockLogsService, ClockLogSource } from "./ClockLogsService";
import { ClockLogAnalysisService } from "./ClockLogAnalysisService";
import { normalizeLogType } from "../utils/clockLogNormalization";

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
 * Resolves an employee ID from either a numeric ID or a name.
 */
async function resolveEmployeeId(
    employee_id: unknown,
    employee_name: unknown
): Promise<number | null> {
    // Si hay employee_id, verificar que exista en la DB antes de usarlo
    if (employee_id != null) {
        const n = Number(employee_id);
        if (!isNaN(n)) {
            const existing = await prisma.vpg_employees.findFirst({
                where: { employee_id: n, employee_fired: false },
                select: { employee_id: true }
            });
            if (existing) return n;
            // Si no existe, caer a búsqueda por nombre
        }
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
