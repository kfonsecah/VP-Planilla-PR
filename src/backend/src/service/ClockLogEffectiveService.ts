import { prisma } from '../lib/prisma';
import {
  ClockLogAdjustmentType,
  ClockLogAdjustmentStatus,
  ClockLogType,
  ClockLogSource,
  Prisma
} from '@prisma/client';

export interface EffectiveMark {
  id: number;
  employeeId: number;
  originalTimestamp: Date;
  effectiveTimestamp: Date;
  logType: ClockLogType;
  adjustmentType: 'EDIT' | 'VOID' | 'NONE';
  source: ClockLogSource;
}

export interface PairedMark {
  in?: EffectiveMark;
  out?: EffectiveMark;
  durationHours: number;
  status: 'valid' | 'orphan' | 'anomaly';
}

export interface DailyPairedMarks {
  date: string; // YYYY-MM-DD
  employeeId: number;
  pairs: PairedMark[];
}

export interface EffectiveClockLog {
  id: string;
  employee_id: string;
  employee_name: string;
  branch_name: string;
  log_date: string;
  original: {
    in_time: string | null;
    out_time: string | null;
    /** Database ID of the IN clock log record — used by VOID/EDIT actions */
    in_log_id: number | null;
    /** Database ID of the OUT clock log record — used by VOID/EDIT actions */
    out_log_id: number | null;
    status: 'valid' | 'anomaly' | 'orphan' | 'pending' | 'corrected';
    source: ClockLogSource;
  };
  adjusted?: {
    in_time: string | null;
    out_time: string | null;
    adjustment_id: string;
    reason: string;
  };
  calculated_hours: number | null;
}

// Internal query result types — used to avoid `any` in raw SQL and Prisma Map results
interface EmployeeRow {
  employee_id: number;
  employee_first_name: string;
  employee_last_name: string;
  employee_middle_name: string | null;
  branch_name: string;
}

interface BranchRow {
  employee_id: number;
  branch_name: string;
}

interface CountRow {
  count: string;
}

type AdjustmentRecord = NonNullable<Awaited<ReturnType<typeof prisma.vpg_clock_log_adjustments.findFirst>>>;
type ClockLogRecord = NonNullable<Awaited<ReturnType<typeof prisma.vpg_clock_logs.findFirst>>>;

interface EffectiveMarkWithAdj extends EffectiveMark {
  _adjustment?: AdjustmentRecord;
}

/**
 * Service to calculate "Effective Marks" by applying active adjustments to original clock logs.
 * Provides the system's "current state of truth" for attendance.
 */
export class ClockLogEffectiveService {
  /**
   * Helper to pair IN/OUT logs for one or more employees.
   */
  public static pairLogs(effectiveLogs: EffectiveMark[]): PairedMark[] {
    // 1. Sort by effectiveTimestamp ASC
    const sortedLogs = [...effectiveLogs].sort((a, b) => a.effectiveTimestamp.getTime() - b.effectiveTimestamp.getTime());

    const pairs: PairedMark[] = [];
    const usedIds = new Set<number>();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedLogs.length; i++) {
      const current = sortedLogs[i];
      if (usedIds.has(current.id)) continue;

      if (current.logType === ClockLogType.IN) {
        // Look for the next OUT log for the same employee within 24 hours
        let foundOut = false;
        for (let j = i + 1; j < sortedLogs.length; j++) {
          const next = sortedLogs[j];

          // Safety: ensure we only pair logs for the same employee
          if (next.employeeId !== current.employeeId) continue;

          if (next.logType === ClockLogType.OUT) {
            const durationMs = next.effectiveTimestamp.getTime() - current.effectiveTimestamp.getTime();

            if (durationMs >= 0 && durationMs <= TWENTY_FOUR_HOURS_MS) {
              // Pair found
              pairs.push({
                in: current,
                out: next,
                durationHours: durationMs / (1000 * 60 * 60),
                status: 'valid'
              });
              usedIds.add(current.id);
              usedIds.add(next.id);
              foundOut = true;
              break;
            }
          } else if (next.logType === ClockLogType.IN) {
            // Found another IN before an OUT -> Anomaly
            pairs.push({
              in: current,
              durationHours: 0,
              status: 'anomaly'
            });
            usedIds.add(current.id);
            foundOut = true; // Not really found OUT, but processed
            break;
          }
        }

        if (!foundOut) {
          // No OUT found within 24 hours -> Orphan
          pairs.push({
            in: current,
            durationHours: 0,
            status: 'orphan'
          });
          usedIds.add(current.id);
        }
      } else {
        // Current is an OUT but not used by any previous IN -> Orphan
        pairs.push({
          out: current,
          durationHours: 0,
          status: 'orphan'
        });
        usedIds.add(current.id);
      }
    }

    return pairs;
  }

  /**
   * Fetches effective logs for a specific employee within a date range and pairs them.
   *
   * @param employeeId - The ID of the employee
   * @param startDate - Start of the range
   * @param endDate - End of the range
   * @returns Array of daily paired marks
   */
  static async getPairedEffectiveMarks(employeeId: number, startDate: Date, endDate: Date): Promise<DailyPairedMarks[]> {
    const effectiveLogs = await this.getEffectiveLogs(employeeId, startDate, endDate);
    const pairs = this.pairLogs(effectiveLogs);

    // Group by date (using local timezone)
    const groupedByDate = new Map<string, PairedMark[]>();
    for (const pair of pairs) {
      const timestamp = (pair.in?.effectiveTimestamp || pair.out?.effectiveTimestamp || new Date());
      // 'en-CA' locale returns YYYY-MM-DD which is safe for local dates
      const dateKey = timestamp.toLocaleDateString('en-CA');
      const existing = groupedByDate.get(dateKey) || [];
      existing.push(pair);
      groupedByDate.set(dateKey, existing);
    }

    const result: DailyPairedMarks[] = [];
    groupedByDate.forEach((dayPairs, date) => {
      result.push({
        date,
        employeeId,
        pairs: dayPairs
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Fetches effective marks for multiple employees with pagination and branch metadata.
   */
  static async getPaginatedEffectiveMarks(params: {
    initDate: Date;
    endDate: Date;
    page: number;
    pageSize: number;
    branchId?: number;
    employeeId?: number;
    status?: string[];
  }): Promise<{ data: EffectiveClockLog[]; total: number }> {
    let { initDate, endDate, page, pageSize, branchId, employeeId, status: statusFilter } = params;

    // Mitigate DoS: Enforce maximum pageSize
    if (pageSize > 100) pageSize = 100;
    const offset = (page - 1) * pageSize;

    // 1. Get employees with pagination and branch info
    let employees: EmployeeRow[] = [];
    let totalCount = 0;

    try {
      if (branchId) {
        // If branchId is filtered, we need the join. Use raw SQL but with better parameter handling.
        const countRes = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(DISTINCT e.employee_id)::text as count
          FROM verdepradera.vpg_employees e
          JOIN verdepradera.vpg_branch_employee be ON e.employee_id = be.employee_branch_employee_id
          WHERE be.employee_branch_branch_id = ${branchId}
          ${employeeId ? Prisma.sql`AND e.employee_id = ${employeeId}` : Prisma.empty}
        `);
        totalCount = parseInt(countRes[0]?.count || "0", 10);

        if (totalCount > 0) {
          employees = await prisma.$queryRaw<EmployeeRow[]>(Prisma.sql`
            SELECT DISTINCT
              e.employee_id,
              e.employee_first_name,
              e.employee_last_name,
              e.employee_middle_name,
              b.branch_name
            FROM verdepradera.vpg_employees e
            JOIN verdepradera.vpg_branch_employee be ON e.employee_id = be.employee_branch_employee_id
            LEFT JOIN verdepradera.vpg_branches b ON be.employee_branch_branch_id = b.branch_id
            WHERE be.employee_branch_branch_id = ${branchId}
            ${employeeId ? Prisma.sql`AND e.employee_id = ${employeeId}` : Prisma.empty}
            ORDER BY e.employee_id ASC
            LIMIT ${pageSize} OFFSET ${offset}
          `);
        }
      } else {
        // No branch filter -> Use standard Prisma query for employees
        totalCount = await prisma.vpg_employees.count({
          where: employeeId ? { employee_id: employeeId } : {},
        });

        if (totalCount > 0) {
          const prismaEmployees = await prisma.vpg_employees.findMany({
            where: employeeId ? { employee_id: employeeId } : {},
            orderBy: { employee_id: 'asc' },
            take: pageSize,
            skip: offset,
          });

          // Fetch branch names for these employees
          const employeeIds = prismaEmployees.map(e => e.employee_id);
          const branchData = await prisma.$queryRaw<BranchRow[]>(Prisma.sql`
            SELECT be.employee_branch_employee_id as employee_id, b.branch_name
            FROM verdepradera.vpg_branch_employee be
            JOIN verdepradera.vpg_branches b ON be.employee_branch_branch_id = b.branch_id
            WHERE be.employee_branch_employee_id IN (${Prisma.join(employeeIds)})
          `);

          const branchMap = new Map<number, string>();
          branchData.forEach(row => branchMap.set(row.employee_id, row.branch_name));

          employees = prismaEmployees.map(e => ({
            ...e,
            branch_name: branchMap.get(e.employee_id) || 'Sin Sucursal'
          }));
        }
      }

      if (totalCount === 0 || employees.length === 0) {
        return { data: [], total: totalCount };
      }

      const employeeIds = employees.map(e => e.employee_id);


      // 3. Fetch all logs for these employees in range
      const logs = await prisma.vpg_clock_logs.findMany({
        where: {
          clock_logs_employee_id: { in: employeeIds },
          clock_logs_timestamp: {
            gte: initDate,
            lte: endDate,
          },
        },
        orderBy: {
          clock_logs_timestamp: 'asc',
        },
      });

      if (logs.length === 0) {
        return { data: [], total: totalCount };
      }

      const logIds = logs.map(l => l.clock_logs_id);

      // 4. Fetch all active adjustments for these logs
      const adjustments = await prisma.vpg_clock_log_adjustments.findMany({
        where: {
          adjustment_clock_log_id: { in: logIds },
          adjustment_status: ClockLogAdjustmentStatus.ACTIVE,
        },
        orderBy: {
          adjustment_created_at: 'desc',
        },
      });

      const latestAdjustmentsMap = new Map<number, AdjustmentRecord>();
      for (const adj of adjustments) {
        if (adj.adjustment_clock_log_id && !latestAdjustmentsMap.has(adj.adjustment_clock_log_id)) {
          latestAdjustmentsMap.set(adj.adjustment_clock_log_id, adj);
        }
      }

      // 5. Group logs by employee and apply pairing
      const employeesMap = new Map<number, EmployeeRow>();
      for (const emp of employees) {
        employeesMap.set(emp.employee_id, emp);
      }

      const logsByEmployee = new Map<number, ClockLogRecord[]>();
      for (const log of logs) {
        const empLogs = logsByEmployee.get(log.clock_logs_employee_id) || [];
        empLogs.push(log);
        logsByEmployee.set(log.clock_logs_employee_id, empLogs);
      }

      const allEffectiveLogs: EffectiveClockLog[] = [];

      for (const [empId, empLogs] of logsByEmployee.entries()) {
        const empInfo = employeesMap.get(empId);
        if (!empInfo) continue;

        // Map to EffectiveMark
        const effectiveMarks: EffectiveMarkWithAdj[] = [];
        for (const log of empLogs) {
          const adj = latestAdjustmentsMap.get(log.clock_logs_id);
          if (adj) {
            if (adj.adjustment_type === ClockLogAdjustmentType.VOID) continue;
            if (adj.adjustment_type === ClockLogAdjustmentType.EDIT) {
              effectiveMarks.push({
                id: log.clock_logs_id,
                employeeId: log.clock_logs_employee_id,
                originalTimestamp: log.clock_logs_timestamp,
                effectiveTimestamp: adj.adjustment_new_timestamp!,
                logType: adj.adjustment_log_type || log.clock_logs_log_type,
                adjustmentType: 'EDIT',
                source: log.clock_logs_source,
                _adjustment: adj
              });
              continue;
            }
          }
          effectiveMarks.push({
            id: log.clock_logs_id,
            employeeId: log.clock_logs_employee_id,
            originalTimestamp: log.clock_logs_timestamp,
            effectiveTimestamp: log.clock_logs_timestamp,
            logType: log.clock_logs_log_type,
            adjustmentType: 'NONE',
            source: log.clock_logs_source,
          });
        }

        // Pair them
        const pairs = this.pairLogs(effectiveMarks);

        // Map to EffectiveClockLog (frontend shape)
        for (const pair of pairs) {
          const inMark = pair.in as EffectiveMarkWithAdj | undefined;
          const outMark = pair.out as EffectiveMarkWithAdj | undefined;

          const timestamp = (inMark?.effectiveTimestamp || outMark?.effectiveTimestamp || new Date());
          const dateKey = timestamp.toLocaleDateString('en-CA');

          let status: EffectiveClockLog['original']['status'] = pair.status;
          if (pair.status === 'valid' && (inMark?.adjustmentType === 'EDIT' || outMark?.adjustmentType === 'EDIT')) {
            status = 'corrected';
          }

          const fullName = [empInfo.employee_first_name, empInfo.employee_middle_name, empInfo.employee_last_name]
            .filter(Boolean)
            .join(' ');

          const effectiveLog: EffectiveClockLog = {
            id: `${empId}-${dateKey}-${inMark?.id || 'null'}-${outMark?.id || 'null'}`,
            employee_id: String(empId),
            employee_name: fullName || `Empleado ${empId}`,
            branch_name: empInfo.branch_name || 'Sin Sucursal',
            log_date: dateKey,
            original: {
              in_time: inMark ? inMark.originalTimestamp.toISOString() : null,
              out_time: outMark ? outMark.originalTimestamp.toISOString() : null,
              in_log_id: inMark?.id ?? null,
              out_log_id: outMark?.id ?? null,
              status,
              source: inMark?.source || outMark?.source || ClockLogSource.manual,
            },
            calculated_hours: pair.durationHours > 0 ? pair.durationHours : null,
          };

          const anyAdj = inMark?._adjustment || outMark?._adjustment;
          if (anyAdj) {
            effectiveLog.adjusted = {
              in_time: inMark?.adjustmentType === 'EDIT' ? inMark.effectiveTimestamp.toISOString() :
                      (inMark ? inMark.effectiveTimestamp.toISOString() : null),
              out_time: outMark?.adjustmentType === 'EDIT' ? outMark.effectiveTimestamp.toISOString() :
                       (outMark ? outMark.effectiveTimestamp.toISOString() : null),
              adjustment_id: String(anyAdj.adjustment_id),
              reason: anyAdj.adjustment_justification,
            };
          }

          // Apply status filter if provided
          if (statusFilter && statusFilter.length > 0) {
            if (!statusFilter.includes(status)) continue;
          }

          allEffectiveLogs.push(effectiveLog);
        }
      }

      return {
        data: allEffectiveLogs,
        total: totalCount
      };
    } catch (error: any) {
      console.error('[ClockLogEffectiveService] Error in getPaginatedEffectiveMarks:', error);
      throw error;
    }
  }

  /**
   * Fetches effective logs for a specific employee within a date range.
   *
   * @param employeeId - The ID of the employee
   * @param startDate - Start of the range
   * @param endDate - End of the range
   * @returns Array of effective marks
   */
  static async getEffectiveLogs(employeeId: number, startDate: Date, endDate: Date): Promise<EffectiveMark[]> {
    // 1. Fetch all vpg_clock_logs for employee/range
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_employee_id: employeeId,
        clock_logs_timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        clock_logs_timestamp: 'asc',
      },
    });

    if (logs.length === 0) {
      return [];
    }

    const logIds = logs.map(l => l.clock_logs_id);

    // 2. Fetch all ACTIVE adjustments (EDIT/VOID only) for these log IDs
    const adjustments = await prisma.vpg_clock_log_adjustments.findMany({
      where: {
        adjustment_clock_log_id: { in: logIds },
        adjustment_status: ClockLogAdjustmentStatus.ACTIVE,
      },
      orderBy: {
        adjustment_created_at: 'desc',
      },
    });

    // 3. Reduce adjustments to the latest one per log_id
    const latestAdjustmentsMap = new Map<number, AdjustmentRecord>();
    for (const adj of adjustments) {
      if (adj.adjustment_clock_log_id && !latestAdjustmentsMap.has(adj.adjustment_clock_log_id)) {
        latestAdjustmentsMap.set(adj.adjustment_clock_log_id, adj);
      }
    }

    // 4. Apply adjustments
    const effectiveMarks: EffectiveMark[] = [];

    for (const log of logs) {
      const adjustment = latestAdjustmentsMap.get(log.clock_logs_id);

      if (adjustment) {
        if (adjustment.adjustment_type === ClockLogAdjustmentType.VOID) {
          // VOIDed marks are filtered out
          continue;
        }

        if (adjustment.adjustment_type === ClockLogAdjustmentType.EDIT) {
          effectiveMarks.push({
            id: log.clock_logs_id,
            employeeId: log.clock_logs_employee_id,
            originalTimestamp: log.clock_logs_timestamp,
            effectiveTimestamp: adjustment.adjustment_new_timestamp!,
            logType: adjustment.adjustment_log_type || log.clock_logs_log_type,
            adjustmentType: 'EDIT',
            source: log.clock_logs_source,
          });
          continue;
        }
      }

      // No active adjustment or unknown type
      effectiveMarks.push({
        id: log.clock_logs_id,
        employeeId: log.clock_logs_employee_id,
        originalTimestamp: log.clock_logs_timestamp,
        effectiveTimestamp: log.clock_logs_timestamp,
        logType: log.clock_logs_log_type,
        adjustmentType: 'NONE',
        source: log.clock_logs_source,
      });
    }

    return effectiveMarks;
  }

  /**
   * Batch version for payroll: fetches all logs in range, all active adjustments in one query,
   * and groups the results by employeeId.
   *
   * @param startDate - Start of the range
   * @param endDate - End of the range
   * @returns Map keyed by employeeId with arrays of effective marks
   */
  static async getEffectiveMarksForAllEmployees(startDate: Date, endDate: Date): Promise<Map<number, EffectiveMark[]>> {
    // 1. Fetch all logs in range
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        clock_logs_timestamp: 'asc',
      },
    });

    if (logs.length === 0) {
      return new Map();
    }

    const logIds = logs.map(l => l.clock_logs_id);

    // 2. Fetch all active adjustments in one query
    const adjustments = await prisma.vpg_clock_log_adjustments.findMany({
      where: {
        adjustment_clock_log_id: { in: logIds },
        adjustment_status: ClockLogAdjustmentStatus.ACTIVE,
      },
      orderBy: {
        adjustment_created_at: 'desc',
      },
    });

    // 3. Reduce adjustments to the latest one per log_id
    const latestAdjustmentsMap = new Map<number, AdjustmentRecord>();
    for (const adj of adjustments) {
      if (adj.adjustment_clock_log_id && !latestAdjustmentsMap.has(adj.adjustment_clock_log_id)) {
        latestAdjustmentsMap.set(adj.adjustment_clock_log_id, adj);
      }
    }

    // 4. Apply adjustments and group by employeeId
    const resultMap = new Map<number, EffectiveMark[]>();

    for (const log of logs) {
      const adjustment = latestAdjustmentsMap.get(log.clock_logs_id);
      let effectiveMark: EffectiveMark | null = null;

      if (adjustment) {
        if (adjustment.adjustment_type === ClockLogAdjustmentType.VOID) {
          continue;
        }

        if (adjustment.adjustment_type === ClockLogAdjustmentType.EDIT) {
          effectiveMark = {
            id: log.clock_logs_id,
            employeeId: log.clock_logs_employee_id,
            originalTimestamp: log.clock_logs_timestamp,
            effectiveTimestamp: adjustment.adjustment_new_timestamp!,
            logType: adjustment.adjustment_log_type || log.clock_logs_log_type,
            adjustmentType: 'EDIT',
            source: log.clock_logs_source,
          };
        }
      }

      if (!effectiveMark) {
        effectiveMark = {
          id: log.clock_logs_id,
          employeeId: log.clock_logs_employee_id,
          originalTimestamp: log.clock_logs_timestamp,
          effectiveTimestamp: log.clock_logs_timestamp,
          logType: log.clock_logs_log_type,
          adjustmentType: 'NONE',
          source: log.clock_logs_source,
        };
      }

      const employeeMarks = resultMap.get(log.clock_logs_employee_id) || [];
      employeeMarks.push(effectiveMark);
      resultMap.set(log.clock_logs_employee_id, employeeMarks);
    }

    return resultMap;
  }
}
