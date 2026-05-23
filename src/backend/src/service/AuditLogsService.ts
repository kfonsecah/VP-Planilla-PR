import { prisma } from '../lib/prisma';
import { AuditLog } from "../model/auditLog";

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
   * Get audit logs with optional filters.
   * Includes associated user information (id, username, email).
   * 
   * @param filters - Optional filters: userId, action, entity, date range, pagination (limit/offset)
   * @returns Promise with data array and total count for pagination
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
   * Create an audit log record
   * @param params - Audit log parameters
   * @param tx - Optional Prisma transaction client
   * @returns Promise<void>
   */
  static async createAuditLog(params: {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    details?: string;
  }, tx?: any): Promise<void> {
    const prismaClient = tx || prisma;
    await prismaClient.vpg_audit_logs.create({
      data: {
        audit_logs_user_id: params.userId,
        audit_logs_action: params.action,
        audit_logs_entity: params.entity,
        audit_logs_entity_id: params.entityId,
        audit_logs_timestamp: new Date(),
        audit_logs_details: params.details || null,
      },
    });
  }

  /**
   * Get a single audit log by its ID.
   * Includes associated user information.
   * 
   * @param id - The audit log ID
   * @returns Promise with the audit log data or null if not found
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
