import { PrismaClient } from "@prisma/client";
import { AuditLog } from "../model/auditLog";

const prisma = new PrismaClient();

/**
 * Query parameters for filtering audit logs
 */
export interface AuditLogFilters {
  userId?: number;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogsService {
  /**
   * Get audit logs with optional filters
   * @param filters - Optional filters for audit logs
   * @returns Promise<AuditLog[]> - Array of audit logs matching the filters
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<any> {
    const where: any = {};

    if (filters.userId) {
      where.audit_logs_user_id = filters.userId;
    }

    if (filters.action) {
      where.audit_logs_action = {
        contains: filters.action,
        mode: 'insensitive',
      };
    }

    if (filters.entity) {
      where.audit_logs_entity = {
        contains: filters.entity,
        mode: 'insensitive',
      };
    }

    if (filters.startDate || filters.endDate) {
      where.audit_logs_timestamp = {};
      if (filters.startDate) {
        where.audit_logs_timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.audit_logs_timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.vpg_audit_logs.findMany({
        where,
        include: {
          vpg_users: {
            select: {
              user_id: true,
              user_username: true,
              user_email: true,
            },
          },
        },
        orderBy: {
          audit_logs_timestamp: 'desc',
        },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.vpg_audit_logs.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.audit_logs_id,
        user_id: log.audit_logs_user_id,
        username: log.vpg_users.user_username,
        user_email: log.vpg_users.user_email,
        action: log.audit_logs_action,
        entity: log.audit_logs_entity,
        entity_id: log.audit_logs_entity_id,
        timestamp: log.audit_logs_timestamp,
        details: log.audit_logs_details,
      })),
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get a single audit log by ID
   * @param id - The ID of the audit log
   * @returns Promise<AuditLog | null> - The audit log or null if not found
   */
  static async getAuditLogById(id: number): Promise<any> {
    const log = await prisma.vpg_audit_logs.findUnique({
      where: { audit_logs_id: id },
      include: {
        vpg_users: {
          select: {
            user_id: true,
            user_username: true,
            user_email: true,
          },
        },
      },
    });

    if (!log) return null;

    return {
      id: log.audit_logs_id,
      user_id: log.audit_logs_user_id,
      username: log.vpg_users.user_username,
      user_email: log.vpg_users.user_email,
      action: log.audit_logs_action,
      entity: log.audit_logs_entity,
      entity_id: log.audit_logs_entity_id,
      timestamp: log.audit_logs_timestamp,
      details: log.audit_logs_details,
    };
  }
}
