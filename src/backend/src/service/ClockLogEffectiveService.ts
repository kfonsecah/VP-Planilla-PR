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

/**
 * Service to calculate "Effective Marks" by applying active adjustments to original clock logs.
 * Provides the system's "current state of truth" for attendance.
 */
export class ClockLogEffectiveService {
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
