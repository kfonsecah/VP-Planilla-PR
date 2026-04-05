import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type ClockLogRow = Prisma.vpg_clock_logsGetPayload<Record<string, never>>;

/**
 * Service for analyzing clock logs to detect anomalies and orphan records.
 * All methods are static and operate on logs within a specific import session.
 */
export class ClockLogAnalysisService {

  /**
   * Detect orphan clock logs (IN without matching OUT within 24h, or OUT without preceding IN within 24h)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as orphan
   * @throws Error if database query fails
   */
  static async detectOrphans(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: { clock_logs_import_session_id: sessionId, clock_logs_status: 'pending' },
      orderBy: { clock_logs_timestamp: 'asc' }
    });
    if (logs.length === 0) return 0;

    const ids = this.computeOrphanIds(logs);
    if (ids.size > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: Array.from(ids) } },
        data: { clock_logs_status: 'orphan' }
      });
    }
    return ids.size;
  }

  /**
   * Detect double entry anomalies (two consecutive IN logs for same employee without OUT between)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as anomaly
   * @throws Error if database query fails
   */
  static async detectDoubleEntry(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: { clock_logs_import_session_id: sessionId, clock_logs_status: 'pending' },
      orderBy: { clock_logs_timestamp: 'asc' }
    });
    if (logs.length === 0) return 0;

    const ids = this.computeDoubleEntryIds(logs);
    if (ids.size > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: Array.from(ids) } },
        data: { clock_logs_status: 'anomaly' }
      });
    }
    return ids.size;
  }

  /**
   * Detect double exit anomalies (two consecutive OUT logs for same employee without IN between)
   * @param sessionId - The import session ID to analyze
   * @returns Promise<number> - Count of logs marked as anomaly
   * @throws Error if database query fails
   */
  static async detectDoubleExit(sessionId: number): Promise<number> {
    const logs = await prisma.vpg_clock_logs.findMany({
      where: { clock_logs_import_session_id: sessionId, clock_logs_status: 'pending' },
      orderBy: { clock_logs_timestamp: 'asc' }
    });
    if (logs.length === 0) return 0;

    const ids = this.computeDoubleExitIds(logs);
    if (ids.size > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: Array.from(ids) } },
        data: { clock_logs_status: 'anomaly' }
      });
    }
    return ids.size;
  }

   /**
    * Detect long session anomalies (IN->OUT pairs with duration > 16 hours)
    * @param sessionId - The import session ID to analyze
    * @returns Promise<number> - Count of logs marked as anomaly
    * @throws Error if database query fails
    */
   static async detectLongSessions(sessionId: number): Promise<number> {
     const logs = await prisma.vpg_clock_logs.findMany({
       where: {
         clock_logs_import_session_id: sessionId,
         clock_logs_status: 'pending'
       },
       orderBy: {
         clock_logs_timestamp: 'asc'
       }
     });

     if (logs.length === 0) {
       return 0;
     }

     const ids = this.computeLongSessionIds(logs);

     if (ids.size > 0) {
       await prisma.vpg_clock_logs.updateMany({
         where: { clock_logs_id: { in: Array.from(ids) } },
         data: { clock_logs_status: 'anomaly' }
       });
     }

     return ids.size;
   }

   /**
    * Compute IDs of logs that are orphans (IN without matching OUT within 24h, or OUT without preceding IN within 24h)
    * @param logs - Array of pending logs (already filtered)
    * @returns Set of orphan log IDs
    */
   private static computeOrphanIds(logs: ClockLogRow[]): Set<number> {
    const orphanIds = new Set<number>();
    const logsByEmployee = new Map<number, ClockLogRow[]>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    for (const [, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());
      for (let i = 0; i < employeeLogs.length; i++) {
        const current = employeeLogs[i];
        if (current.clock_logs_log_type === 'IN') {
          const hasMatchingOut = employeeLogs.slice(i + 1).some(log =>
            log.clock_logs_log_type === 'OUT' && (log.clock_logs_timestamp.getTime() - current.clock_logs_timestamp.getTime()) <= TWENTY_FOUR_HOURS_MS
          );
          if (!hasMatchingOut) {
            orphanIds.add(current.clock_logs_id);
          }
        } else if (current.clock_logs_log_type === 'OUT') {
          const hasMatchingIn = employeeLogs.slice(0, i).some(log =>
            log.clock_logs_log_type === 'IN' && (current.clock_logs_timestamp.getTime() - log.clock_logs_timestamp.getTime()) <= TWENTY_FOUR_HOURS_MS
          );
          if (!hasMatchingIn) {
            orphanIds.add(current.clock_logs_id);
          }
        }
      }
    }
    return orphanIds;
  }

  /**
   * Compute IDs of logs that are double entry anomalies (two consecutive INs)
   * @param logs - Array of pending logs
   * @returns Set of log IDs to mark as anomaly
   */
  private static computeDoubleEntryIds(logs: ClockLogRow[]): Set<number> {
    const ids = new Set<number>();
    const logsByEmployee = new Map<number, ClockLogRow[]>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }
    for (const [employeeId, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());
      for (let i = 0; i < employeeLogs.length - 1; i++) {
        const current = employeeLogs[i];
        const next = employeeLogs[i + 1];
        if (current.clock_logs_log_type === 'IN' && next.clock_logs_log_type === 'IN') {
          ids.add(current.clock_logs_id);
          ids.add(next.clock_logs_id);
        }
      }
    }
    return ids;
  }

  /**
   * Compute IDs of logs that are double exit anomalies (two consecutive OUTs)
   * @param logs - Array of pending logs
   * @returns Set of log IDs to mark as anomaly
   */
  private static computeDoubleExitIds(logs: ClockLogRow[]): Set<number> {
    const ids = new Set<number>();
    const logsByEmployee = new Map<number, ClockLogRow[]>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }
    for (const [employeeId, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());
      for (let i = 0; i < employeeLogs.length - 1; i++) {
        const current = employeeLogs[i];
        const next = employeeLogs[i + 1];
        if (current.clock_logs_log_type === 'OUT' && next.clock_logs_log_type === 'OUT') {
          ids.add(current.clock_logs_id);
          ids.add(next.clock_logs_id);
        }
      }
    }
    return ids;
  }

  /**
   * Compute IDs of logs that belong to long sessions (>16 hours)
   * @param logs - Array of pending logs
   * @returns Set of log IDs (both IN and OUT) to mark as anomaly
   */
  private static computeLongSessionIds(logs: ClockLogRow[]): Set<number> {
    const ids = new Set<number>();
    const logsByEmployee = new Map<number, ClockLogRow[]>();
    for (const log of logs) {
      const employeeId = log.clock_logs_employee_id;
      if (!logsByEmployee.has(employeeId)) {
        logsByEmployee.set(employeeId, []);
      }
      logsByEmployee.get(employeeId)!.push(log);
    }
    const SIXTEEN_HOURS_MS = 16 * 60 * 60 * 1000;
    for (const [employeeId, employeeLogs] of logsByEmployee) {
      employeeLogs.sort((a, b) => a.clock_logs_timestamp.getTime() - b.clock_logs_timestamp.getTime());
      for (let i = 0; i < employeeLogs.length; i++) {
        if (employeeLogs[i].clock_logs_log_type === 'IN') {
          for (let j = i + 1; j < employeeLogs.length; j++) {
            if (employeeLogs[j].clock_logs_log_type === 'OUT') {
              const duration = employeeLogs[j].clock_logs_timestamp.getTime() - employeeLogs[i].clock_logs_timestamp.getTime();
              if (duration > SIXTEEN_HOURS_MS) {
                ids.add(employeeLogs[i].clock_logs_id);
                ids.add(employeeLogs[j].clock_logs_id);
              }
              break; // Only consider the first OUT after this IN
            }
          }
        }
      }
    }
    return ids;
  }

  /**
   * Run all post-import analyses and mark remaining pending logs as valid
   * Optimized: fetch pending logs once, run detectors in-memory, batch updates.
   * @param sessionId - The import session ID to analyze
   * @returns Object with counts of each anomaly type and total
   * @throws Error if any analysis fails
   */
  static async runPostImportAnalysis(sessionId: number): Promise<{
    orphans: number;
    doubleEntry: number;
    doubleExit: number;
    longSessions: number;
    total: number;
  }> {
    // Fetch all pending logs for this session once
    const logs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      orderBy: {
        clock_logs_timestamp: 'asc'
      }
    });

    if (logs.length === 0) {
      return { orphans: 0, doubleEntry: 0, doubleExit: 0, longSessions: 0, total: 0 };
    }

    // Compute IDs for each anomaly type in sequence, respecting precedence:
    // Orphans first, then double entry, then double exit, then long sessions.
    const orphanIds = this.computeOrphanIds(logs);
    let pending = logs.filter(log => !orphanIds.has(log.clock_logs_id));

    const doubleEntryIds = this.computeDoubleEntryIds(pending);
    pending = pending.filter(log => !doubleEntryIds.has(log.clock_logs_id));

    const doubleExitIds = this.computeDoubleExitIds(pending);
    pending = pending.filter(log => !doubleExitIds.has(log.clock_logs_id));

    const longSessionIds = this.computeLongSessionIds(pending);
    // Remaining pending logs are valid; we'll mark them via markValid().

    // Batch updates: orphan, then anomaly (doubleEntry + doubleExit + longSession), then valid.
    if (orphanIds.size > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: Array.from(orphanIds) } },
        data: { clock_logs_status: 'orphan' }
      });
    }

    const anomalyIds = new Set<number>([...doubleEntryIds, ...doubleExitIds, ...longSessionIds]);
    if (anomalyIds.size > 0) {
      await prisma.vpg_clock_logs.updateMany({
        where: { clock_logs_id: { in: Array.from(anomalyIds) } },
        data: { clock_logs_status: 'anomaly' }
      });
    }

    // Mark remaining pending logs as valid
    await this.markValid(sessionId);

    const total = orphanIds.size + doubleEntryIds.size + doubleExitIds.size + longSessionIds.size;

    return {
      orphans: orphanIds.size,
      doubleEntry: doubleEntryIds.size,
      doubleExit: doubleExitIds.size,
      longSessions: longSessionIds.size,
      total
    };
  }


  /**
   * Mark all remaining pending logs for a session as valid
   * @param sessionId - The import session ID
   * @returns Promise<number> - Count of logs marked as valid
   * @throws Error if database update fails
   */
  static async markValid(sessionId: number): Promise<number> {
    const result = await prisma.vpg_clock_logs.updateMany({
      where: {
        clock_logs_import_session_id: sessionId,
        clock_logs_status: 'pending'
      },
      data: { clock_logs_status: 'valid' }
    });

    return result.count;
  }
}
