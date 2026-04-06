import { prisma } from '../lib/prisma';
import { ClockLogSource } from './ClockLogsService';
import { ImportSession } from '../model/ImportSession';

export class ImportSessionService {
  /**
   * Create a new import session in pending status
   * @param source - Origin of the import (java_import, excel_import, manual)
   * @param totalRecords - Expected number of records to process
   * @param userId - User ID who initiated the import
   * @returns Created session with id and started_at
   * @throws Error if database operation fails
   */
  static async createSession(
    source: ClockLogSource,
    totalRecords: number,
    userId: number
  ): Promise<{ id: number; started_at: Date }> {
    const session = await prisma.vpg_clock_import_sessions.create({
      data: {
        import_sessions_source: source,
        import_sessions_status: 'pending',
        import_sessions_total_records: totalRecords,
        import_sessions_created_by: userId,
      },
      select: {
        import_sessions_id: true,
        import_sessions_started_at: true,
      },
    });
    return {
      id: session.import_sessions_id,
      started_at: session.import_sessions_started_at,
    };
  }

  /**
   * Update an import session with results and optionally mark as completed or failed
   * @param sessionId - ID of the session to update
   * @param updates - Fields to update: status, createdCount, skippedCount, anomalyCount
   * @returns Promise that resolves when update completes
   * @throws Error if database operation fails
   */
  static async updateSession(
    sessionId: number,
    updates: {
      status?: 'pending' | 'running' | 'completed' | 'failed';
      createdCount?: number;
      skippedCount?: number;
      anomalyCount?: number;
    }
  ): Promise<void> {
    const isTerminalStatus =
      updates.status === 'completed' || updates.status === 'failed';

    await prisma.vpg_clock_import_sessions.update({
      where: { import_sessions_id: sessionId },
      data: {
        ...(updates.status !== undefined && {
          import_sessions_status: updates.status,
        }),
        ...(updates.createdCount !== undefined && {
          import_sessions_created_count: updates.createdCount,
        }),
        ...(updates.skippedCount !== undefined && {
          import_sessions_skipped_count: updates.skippedCount,
        }),
        ...(updates.anomalyCount !== undefined && {
          import_sessions_anomaly_count: updates.anomalyCount,
        }),
        ...(isTerminalStatus && {
          import_sessions_completed_at: new Date(),
        }),
      },
    });
  }

  /**
   * Get a full import session by ID
   * @param sessionId - ID of the session to retrieve
   * @returns Full session record or null if not found
   * @throws Error if database operation fails
   */
  static async getSession(sessionId: number) {
    return await prisma.vpg_clock_import_sessions.findUnique({
      where: { import_sessions_id: sessionId },
    });
  }

  /**
   * Get the most recent import sessions ordered by start date descending
   * @param limit - Maximum number of sessions to return (default 5)
   * @returns Array of ImportSession objects ordered by most recent
   * @throws Error if database operation fails
   */
  static async getRecentSessions(limit: number = 5): Promise<ImportSession[]> {
    const rows = await prisma.vpg_clock_import_sessions.findMany({
      take: limit,
      orderBy: { import_sessions_started_at: 'desc' }
    });

    return rows.map(row => ({
      id: row.import_sessions_id,
      started_at: row.import_sessions_started_at,
      completed_at: row.import_sessions_completed_at ?? undefined,
      source: row.import_sessions_source as ImportSession['source'],
      status: row.import_sessions_status as ImportSession['status'],
      total_records: row.import_sessions_total_records,
      created_count: row.import_sessions_created_count,
      skipped_count: row.import_sessions_skipped_count,
      anomaly_count: row.import_sessions_anomaly_count,
      created_by: row.import_sessions_created_by
    }));
  }
}
