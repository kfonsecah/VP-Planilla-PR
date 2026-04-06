import { prisma } from '../lib/prisma';
import { ClockLogs } from "../model/clockLog";
import { normalizeLogType, CanonicalLogType } from '../utils/clockLogNormalization';
import { AuditLogsService } from './AuditLogsService';

/**
 * Request parameters for filtering clock logs by date range
 */
export interface RequestParams {
    /** Start date for the clock logs query */
    initDate: Date;
    /** End date for the clock logs query */
    endDate: Date;
}

export type ClockLogSource = 'java_import' | 'excel_import' | 'manual';

interface ClockLogWithEmployee {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_social_code: string;
  timestamp: Date;
  log_type: 'IN' | 'OUT';
  remarks?: string;
  status: string;
  source: string;
  import_session_id?: number;
}

export class ClockLogsService {
    /**
     * Retrieve clock logs within a specified date range
     * @param params - Request parameters containing start and end dates
     * @returns Promise<ClockLogs[]> - Array of clock logs within the specified date range
     * @throws Error if database query fails
     */
    async getClockLogs(params: RequestParams): Promise<ClockLogs[]> {
        const logs = await prisma.vpg_clock_logs.findMany({
            where: {
                clock_logs_timestamp: {
                    gte: params.initDate,
                    lte: params.endDate
                }
            }
        });

        return logs.map(log => ({
            id: log.clock_logs_id,
            employee_id: log.clock_logs_employee_id,
            timestamp: log.clock_logs_timestamp,
            log_type: log.clock_logs_log_type as 'IN' | 'OUT',
            remarks: log.clock_logs_remarks ?? undefined,
            version: log.clock_logs_version,
            status: log.clock_logs_status,
            source: log.clock_logs_source
        }));

    }

    /**
     * Create multiple clock logs in bulk
     * @param logs - Array of clock log data with raw log_type strings
     * @param source - Origin of the clock logs (java_import, excel_import, manual)
     * @param sessionId - Optional import session ID to link logs to their import session
     * @returns Object with count of created records
     * @throws Error if database operation fails or log_type cannot be normalized
     */
    async bulkCreate(
        logs: Array<{
            employee_id: number;
            timestamp: Date;
            log_type: string;
            remarks?: string | null;
        }>,
        source: ClockLogSource = 'manual',
        sessionId?: number
    ): Promise<{ created: number }> {
        const result = await prisma.vpg_clock_logs.createMany({
            data: logs.map(l => ({
                clock_logs_employee_id: l.employee_id,
                clock_logs_timestamp: l.timestamp,
                clock_logs_log_type: normalizeLogType(l.log_type),
                clock_logs_remarks: l.remarks ?? null,
                clock_logs_version: 1,
                clock_logs_status: 'pending',
                clock_logs_source: source,
                clock_logs_import_session_id: sessionId ?? null
            })),
            skipDuplicates: true
        });
        return { created: result.count };
    }

    /**
     * Get aggregated stats grouped by status and source for a date range
     * @param initDate - Start date for the stats query
     * @param endDate - End date for the stats query
     * @returns Array of status/source/count groupings
     * @throws Error if database query fails
     */
    async getStats(initDate: Date, endDate: Date): Promise<
        Array<{ status: string; source: string; count: number }>
    > {
        const stats = await prisma.vpg_clock_logs.groupBy({
            by: ['clock_logs_status', 'clock_logs_source'],
            where: {
                clock_logs_timestamp: {
                    gte: initDate,
                    lte: endDate
                }
            },
            _count: true
        });

        return stats.map(s => ({
            status: s.clock_logs_status,
            source: s.clock_logs_source,
            count: s._count
        }));
    }

    /**
     * Get orphan clock logs (status = 'orphan') with employee information, paginated
     * @param params - Pagination and date filter parameters
     * @returns Promise with data, total count, page, pageSize
     * @throws Error if database query fails
     */
    async getOrphans(params: {
      page?: number;
      pageSize?: number;
      initDate?: Date;
      endDate?: Date;
    }): Promise<{
      data: ClockLogWithEmployee[];
      total: number;
      page: number;
      pageSize: number;
    }> {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = { clock_logs_status: 'orphan' };
      if (params.initDate || params.endDate) {
        where.clock_logs_timestamp = {
          ...(params.initDate ? { gte: params.initDate } : {}),
          ...(params.endDate ? { lte: params.endDate } : {})
        };
      }

      const [data, total] = await Promise.all([
        prisma.vpg_clock_logs.findMany({
          where,
          include: {
            vpg_employees: {
              select: {
                employee_id: true,
                employee_first_name: true,
                employee_last_name: true,
                employee_social_code: true
              }
            }
          },
          skip,
          take: pageSize,
          orderBy: { clock_logs_timestamp: 'desc' }
        }),
        prisma.vpg_clock_logs.count({ where })
      ]);

      const mapped = data.map(log => ({
        id: log.clock_logs_id,
        employee_id: log.clock_logs_employee_id,
        employee_name: `${log.vpg_employees.employee_first_name} ${log.vpg_employees.employee_last_name}`.trim(),
        employee_social_code: log.vpg_employees.employee_social_code,
        timestamp: log.clock_logs_timestamp,
        log_type: log.clock_logs_log_type as 'IN' | 'OUT',
        remarks: log.clock_logs_remarks ?? undefined,
        status: log.clock_logs_status,
        source: log.clock_logs_source,
        import_session_id: log.clock_logs_import_session_id ?? undefined
      }));

      return { data: mapped, total, page, pageSize };
    }

    /**
     * Get anomaly clock logs (status = 'anomaly') with employee information, paginated
     * @param params - Pagination, date filter, and optional type filter
     * @returns Promise with data, total count, page, pageSize
     * @throws Error if database query fails
     */
    async getAnomalies(params: {
      page?: number;
      pageSize?: number;
      initDate?: Date;
      endDate?: Date;
      type?: string;
    }): Promise<{
      data: ClockLogWithEmployee[];
      total: number;
      page: number;
      pageSize: number;
    }> {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const where: any = { clock_logs_status: 'anomaly' };
      if (params.initDate || params.endDate) {
        where.clock_logs_timestamp = {
          ...(params.initDate ? { gte: params.initDate } : {}),
          ...(params.endDate ? { lte: params.endDate } : {})
        };
      }
      // Future: filter by anomaly type when stored in DB

      const [data, total] = await Promise.all([
        prisma.vpg_clock_logs.findMany({
          where,
          include: {
            vpg_employees: {
              select: {
                employee_id: true,
                employee_first_name: true,
                employee_last_name: true,
                employee_social_code: true
              }
            }
          },
          skip,
          take: pageSize,
          orderBy: { clock_logs_timestamp: 'desc' }
        }),
        prisma.vpg_clock_logs.count({ where })
      ]);

      const mapped = data.map(log => ({
        id: log.clock_logs_id,
        employee_id: log.clock_logs_employee_id,
        employee_name: `${log.vpg_employees.employee_first_name} ${log.vpg_employees.employee_last_name}`.trim(),
        employee_social_code: log.vpg_employees.employee_social_code,
        timestamp: log.clock_logs_timestamp,
        log_type: log.clock_logs_log_type as 'IN' | 'OUT',
        remarks: log.clock_logs_remarks ?? undefined,
        status: log.clock_logs_status,
        source: log.clock_logs_source,
        import_session_id: log.clock_logs_import_session_id ?? undefined
      }));

      return { data: mapped, total, page, pageSize };
    }

    /**
     * Resolve an orphan clock log by either assigning a complementary manual log or discarding with justification
     * @param orphanId - The orphan clock log ID
     * @param action - 'assign_complement' or 'discard'
     * @param justification - Explanation for resolution
     * @param complementData - Optional complement data (timestamp, logType) required for assign_complement
     * @returns Promise with success flag and message
     * @throws Error if log not found, not orphan, or database operation fails
     */
    async resolveOrphan(
      orphanId: number,
      action: 'assign_complement' | 'discard',
      justification: string,
      complementData?: { timestamp: Date; logType: 'IN' | 'OUT' }
    ): Promise<{ success: boolean; message: string }> {
      // Fetch the orphan log
      const orphanLog = await prisma.vpg_clock_logs.findUnique({
        where: { clock_logs_id: orphanId }
      });

      if (!orphanLog) {
        throw new Error('Marca no encontrada');
      }

      if (orphanLog.clock_logs_status !== 'orphan') {
        throw new Error('La marca no tiene status orphan');
      }

      if (action === 'discard') {
        // Discard: mark as corrected with justification in remarks
        await prisma.vpg_clock_logs.update({
          where: { clock_logs_id: orphanId },
          data: {
            clock_logs_status: 'corrected',
            clock_logs_remarks: justification
          }
        });

        return { success: true, message: 'Huérfana descartada exitosamente' };
      }

      if (action === 'assign_complement') {
        if (!complementData || !complementData.timestamp || !complementData.logType) {
          throw new Error('Datos de complemento incompletos');
        }

        // Validate complement log type is opposite of orphan log type
        const orphanLogType = orphanLog.clock_logs_log_type as 'IN' | 'OUT';
        const complementLogType = complementData.logType as 'IN' | 'OUT';
        if (orphanLogType === complementLogType) {
          throw new Error('El tipo de marca complementaria debe ser opuesto al tipo de la marca huérfana');
        }

        // Create complementary manual log linked to same import session for trazabilidad
        await prisma.vpg_clock_logs.create({
          data: {
            clock_logs_employee_id: orphanLog.clock_logs_employee_id,
            clock_logs_timestamp: complementData.timestamp,
            clock_logs_log_type: complementData.logType,
            clock_logs_remarks: `Complemento asignado: ${justification}`,
            clock_logs_status: 'valid',
            clock_logs_source: 'manual',
            clock_logs_version: 1,
            clock_logs_import_session_id: orphanLog.clock_logs_import_session_id
          }
        });

        // Update original orphan to valid
        await prisma.vpg_clock_logs.update({
          where: { clock_logs_id: orphanId },
          data: {
            clock_logs_status: 'valid',
            clock_logs_remarks: `Resuelto: ${justification}`
          }
        });

        return { success: true, message: 'Huérfana resuelta con complemento exitosamente' };
      }

      // Should not reach here
      throw new Error('Acción no válida');
    }

    /**
     * Create a manual clock log entry with audit trail
     * @param params - Creation parameters
     * @returns Promise with success flag and created clock log ID
     * @throws Error if database operation fails
     */
    async createManualLog(params: {
        employee_id: number;
        timestamp: Date;
        log_type: 'IN' | 'OUT';
        remarks?: string | null;
        created_by: number;
        justification: string;
    }): Promise<{ success: boolean; clockLogId: number }> {
        // Atomic: clock log creation + audit entry succeed or fail together
        const createdLog = await prisma.$transaction(async (tx) => {
            const log = await tx.vpg_clock_logs.create({
                data: {
                    clock_logs_employee_id: params.employee_id,
                    clock_logs_timestamp: params.timestamp,
                    clock_logs_log_type: params.log_type,
                    clock_logs_remarks: params.remarks ?? null,
                    clock_logs_status: 'valid',
                    clock_logs_source: 'manual',
                    clock_logs_version: 1,
                    clock_logs_import_session_id: null,
                },
            });

            await tx.vpg_audit_logs.create({
                data: {
                    audit_logs_user_id: params.created_by,
                    audit_logs_action: 'manual_correction',
                    audit_logs_entity: 'clock_log',
                    audit_logs_entity_id: log.clock_logs_id,
                    audit_logs_timestamp: new Date(),
                    audit_logs_details: `Created manual ${params.log_type} for employee ${params.employee_id}. Justification: ${params.justification}`,
                },
            });

            return log;
        });

        return { success: true, clockLogId: createdLog.clock_logs_id };
    }

    /**
     * Get clock logs with optional status and employee filters, paginated
     * @param params - Pagination, date range, status array, and employee_id filters
     * @returns Promise with data array, total count, page, and pageSize
     * @throws Error if database query fails
     */
    async getClockLogsPaginated(params: {
        page?: number;
        pageSize?: number;
        initDate?: Date;
        endDate?: Date;
        status?: string[];
        employee_id?: number;
    }): Promise<{
        data: Array<{
            id: number;
            employee_id: number;
            employee_name: string;
            timestamp: Date;
            log_type: string;
            status: string;
            source: string;
            remarks?: string;
            import_session_id?: number;
        }>;
        total: number;
        page: number;
        pageSize: number;
    }> {
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const skip = (page - 1) * pageSize;

        const where: any = {};

        if (params.initDate || params.endDate) {
            where.clock_logs_timestamp = {
                ...(params.initDate ? { gte: params.initDate } : {}),
                ...(params.endDate ? { lte: params.endDate } : {})
            };
        }

        if (params.status && params.status.length > 0) {
            where.clock_logs_status = { in: params.status };
        }

        if (params.employee_id) {
            where.clock_logs_employee_id = params.employee_id;
        }

        const [data, total] = await Promise.all([
            prisma.vpg_clock_logs.findMany({
                where,
                include: {
                    vpg_employees: {
                        select: {
                            employee_id: true,
                            employee_first_name: true,
                            employee_last_name: true
                        }
                    }
                },
                skip,
                take: pageSize,
                orderBy: { clock_logs_timestamp: 'desc' }
            }),
            prisma.vpg_clock_logs.count({ where })
        ]);

        const mapped = data.map(log => ({
            id: log.clock_logs_id,
            employee_id: log.clock_logs_employee_id,
            employee_name: `${log.vpg_employees.employee_first_name} ${log.vpg_employees.employee_last_name}`.trim(),
            timestamp: log.clock_logs_timestamp,
            log_type: log.clock_logs_log_type,
            status: log.clock_logs_status,
            source: log.clock_logs_source,
            remarks: log.clock_logs_remarks ?? undefined,
            import_session_id: log.clock_logs_import_session_id ?? undefined
        }));

        return { data: mapped, total, page, pageSize };
    }

    /**
     * Update a clock log's status with justification and audit trail
     * @param params - Update parameters
     * @returns Promise with success flag
     * @throws Error if log not found or database operation fails
     */
    async updateClockLogStatus(params: {
        clockLogId: number;
        newStatus: 'corrected' | 'valid' | 'orphan' | 'anomaly';
        justification: string;
        changed_by: number;
    }): Promise<{ success: boolean }> {
        // Fetch existing log to capture old status
        const existing = await prisma.vpg_clock_logs.findUnique({
            where: { clock_logs_id: params.clockLogId },
        });

        if (!existing) {
            throw new Error('Marca no encontrada');
        }

        const oldStatus = existing.clock_logs_status;

        // Atomic: status update + audit entry succeed or fail together
        await prisma.$transaction(async (tx) => {
            await tx.vpg_clock_logs.update({
                where: { clock_logs_id: params.clockLogId },
                data: {
                    clock_logs_status: params.newStatus,
                    clock_logs_remarks: params.justification,
                },
            });

            await tx.vpg_audit_logs.create({
                data: {
                    audit_logs_user_id: params.changed_by,
                    audit_logs_action: 'manual_correction',
                    audit_logs_entity: 'clock_log',
                    audit_logs_entity_id: params.clockLogId,
                    audit_logs_timestamp: new Date(),
                    audit_logs_details: `Changed status from ${oldStatus} to ${params.newStatus}. Justification: ${params.justification}`,
                },
            });
        });

        return { success: true };
    }
}