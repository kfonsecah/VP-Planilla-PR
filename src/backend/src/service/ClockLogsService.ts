import { prisma } from '../lib/prisma';
import { ClockLogs } from "../model/clockLog";
import { normalizeLogType, CanonicalLogType } from '../utils/clockLogNormalization';

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
      if (params.initDate && params.endDate) {
        where.clock_logs_timestamp = {
          gte: params.initDate,
          lte: params.endDate
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
      if (params.initDate && params.endDate) {
        where.clock_logs_timestamp = {
          gte: params.initDate,
          lte: params.endDate
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
  }