import { prisma } from '../lib/prisma';
import { 
  ClockLogAdjustmentType, 
  ClockLogAdjustmentStatus, 
  ClockLogType,
  ClockLogSource
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

/**
 * Service to calculate "Effective Marks" by applying active adjustments to original clock logs.
 * Provides the system's "current state of truth" for attendance.
 */
export class ClockLogEffectiveService {
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
    
    // 1. Sort by effectiveTimestamp ASC
    effectiveLogs.sort((a, b) => a.effectiveTimestamp.getTime() - b.effectiveTimestamp.getTime());

    const pairs: PairedMark[] = [];
    const usedIds = new Set<number>();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (let i = 0; i < effectiveLogs.length; i++) {
      const current = effectiveLogs[i];
      if (usedIds.has(current.id)) continue;

      if (current.logType === ClockLogType.IN) {
        // Look for the next OUT log for the same employee within 24 hours
        let foundOut = false;
        for (let j = i + 1; j < effectiveLogs.length; j++) {
          const next = effectiveLogs[j];
          
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

    // Group by date
    const groupedByDate = new Map<string, PairedMark[]>();
    for (const pair of pairs) {
      const dateKey = (pair.in?.effectiveTimestamp || pair.out?.effectiveTimestamp || new Date()).toISOString().split('T')[0];
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
    const latestAdjustmentsMap = new Map<number, any>();
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
            logType: log.clock_logs_log_type,
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
    const latestAdjustmentsMap = new Map<number, any>();
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
            logType: log.clock_logs_log_type,
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
