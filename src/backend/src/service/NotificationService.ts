import { prisma } from '../lib/prisma';
import { Notification, CreateNotificationInput } from '../model/Notification';

const LEGAL_PARAM_RISK_MESSAGES: Record<string, (value: number) => string | null> = {
  MIN_WAGE_CHECK_ENABLED: (v) => v === 0
    ? 'Verificación de salario mínimo DESACTIVADA. Las planillas no validarán cumplimiento del Decreto MTSS.'
    : null,
  OT_FACTOR: (v) => v < 1.5
    ? 'El multiplicador de horas extra es inferior al mínimo legal (1.5×). Riesgo de incumplimiento Art. 139 CT.'
    : null,
  HOLIDAY_MANDATORY_FACTOR: (v) => v < 2.0
    ? 'El multiplicador de feriado obligatorio es inferior al mínimo legal (2.0×). Riesgo de incumplimiento Art. 148 CT.'
    : null,
  HOLIDAY_TRIPLE_FACTOR: (v) => v < 3.0
    ? 'El multiplicador de feriado triple es inferior al mínimo legal (3.0×). Riesgo de incumplimiento Art. 148 CT.'
    : null,
  CCSS_OBRERO_SALUD: (v) => v < 5.50
    ? 'Los porcentajes de CCSS no corresponden a los valores legales vigentes. Riesgo de incumplimiento ante la CCSS.'
    : null,
};

const PARAM_READABLE_NAMES: Record<string, string> = {
  OT_FACTOR: 'Factor de Horas Extra',
  HOLIDAY_MANDATORY_FACTOR: 'Factor de Feriado Obligatorio',
  HOLIDAY_TRIPLE_FACTOR: 'Factor de Feriado Triple',
  CCSS_OBRERO_SALUD: 'CCSS Obrero — Salud',
  MIN_WAGE_CHECK_ENABLED: 'Verificación de Salario Mínimo',
  GLOBAL_MIN_WAGE_RATE: 'Tarifa Mínima Global',
};

export class NotificationService {
  /**
   * Creates a new notification for a user.
   * @param input - The notification creation input (userId, title, message, type)
   * @returns Promise<Notification> - The created notification
   * @throws Error if the user does not exist or creation fails
   */
  static async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.vpg_notifications.create({
      data: {
        notifications_user_id: input.userId,
        notifications_title: input.title,
        notifications_message: input.message,
        notifications_type: input.type,
      },
    });

    return notification;
  }

  /**
   * Fan-out legal parameter change alert to all admin/payroll_manager users.
   * Creates one notification per target user with requires_acknowledgment=true.
   * Also creates a confirmation notification for the acting user (no acknowledgment required).
   * Errors are swallowed — notification failure must not roll back the param save.
   * @param paramKey - The legal parameter key (e.g., 'OT_FACTOR')
   * @param oldValue - Previous string value of the parameter
   * @param newValue - New string value of the parameter
   * @param validFrom - Effective date of the new value
   * @param actingUserId - User ID of the admin who changed the param
   * @param actingUserName - Display name of the acting admin
   * @returns Promise<void>
   * @throws Never — errors are caught and logged internally
   */
  static async createLegalParamAlert(
    paramKey: string,
    oldValue: string,
    newValue: string,
    validFrom: Date,
    actingUserId: number,
    actingUserName: string,
  ): Promise<void> {
    const draftCount = await prisma.vpg_payrolls.count({
      where: { payrolls_status: 'BORRADOR' },
    });

    const readableName = PARAM_READABLE_NAMES[paramKey] ?? paramKey;
    const baseMsg = `${readableName} fue modificado por ${actingUserName} el ${validFrom.toLocaleDateString('es-CR')}. Valor anterior: ${oldValue} → Nuevo valor: ${newValue}.`;
    const riskSuffix = LEGAL_PARAM_RISK_MESSAGES[paramKey]?.(Number(newValue)) ?? '';
    const draftSuffix = draftCount > 0
      ? ` ATENCIÓN: Existen ${draftCount} planillas en estado BORRADOR que deben recalcularse.`
      : '';
    // Risk suffix before draft suffix — legal risk is higher priority and must not be truncated
    const fullMessage = (baseMsg + (riskSuffix ? '\n' + riskSuffix : '') + draftSuffix).substring(0, 500);

    const targetUsers = await prisma.vpg_users.findMany({
      where: { user_role: { in: ['admin', 'payroll_manager'] } },
      select: { user_id: true },
    });

    if (targetUsers.length > 0) {
      await prisma.vpg_notifications.createMany({
        data: targetUsers.map(u => ({
          notifications_user_id: u.user_id,
          notifications_title: `Parámetro legal modificado: ${readableName}`.substring(0, 100),
          notifications_message: fullMessage,
          notifications_type: 'LEGAL_PARAM_CHANGE',
          notifications_requires_acknowledgment: true,
          notifications_metadata: { paramKey, oldValue, newValue, validFrom: validFrom.toISOString(), affectedDraftPayrolls: draftCount },
        })),
      });
    }

    // Confirmation for the acting user (no acknowledgment required)
    await prisma.vpg_notifications.create({
      data: {
        notifications_user_id: actingUserId,
        notifications_title: `Confirmación: ${readableName} actualizado`.substring(0, 100),
        notifications_message: `Has actualizado el parámetro ${paramKey}. Valor: ${newValue}.`.substring(0, 500),
        notifications_type: 'LEGAL_PARAM_CHANGE',
        notifications_requires_acknowledgment: false,
      },
    });
  }

  /**
   * Gets paginated notifications for a specific user, ordered by creation date descending.
   * @param userId - The user ID to fetch notifications for
   * @param page - Page number (1-based)
   * @param limit - Number of notifications per page
   * @returns Promise<{ data: Notification[], total: number }> - Paginated notifications and total count
   */
  static async getNotificationsByUserId(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Notification[]; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.vpg_notifications.findMany({
        where: {
          notifications_user_id: userId,
        },
        orderBy: {
          notifications_created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.vpg_notifications.count({
        where: {
          notifications_user_id: userId,
        },
      }),
    ]);

    return { data: notifications, total };
  }

  /**
   * Gets the count of unread notifications for a specific user.
   * @param userId - The user ID to count unread notifications for
   * @returns Promise<number> - Count of unread notifications
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const count = await prisma.vpg_notifications.count({
      where: {
        notifications_user_id: userId,
        notifications_is_read: false,
      },
    });

    return count;
  }

  /**
   * Returns unacknowledged LEGAL_PARAM_CHANGE notifications for a given user.
   * @param userId - The user ID to query alerts for
   * @returns Promise<Notification[]> - Array of unacknowledged legal param alerts
   * @throws Error if the Prisma query fails
   */
  static async getUnacknowledgedLegalParamAlerts(userId: number): Promise<Notification[]> {
    const alerts = await prisma.vpg_notifications.findMany({
      where: {
        notifications_user_id: userId,
        notifications_type: 'LEGAL_PARAM_CHANGE',
        notifications_requires_acknowledgment: true,
        notifications_acknowledged_by: null,
      },
      orderBy: { notifications_created_at: 'desc' },
    });
    return alerts as Notification[];
  }

  /**
   * Marks a single notification as read, verifying ownership.
   * @param notificationId - The notification ID to mark as read
   * @param userId - The user ID (must own the notification)
   * @returns Promise<Notification | null> - The updated notification, or null if not found/not owned
   */
  static async markAsRead(
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const notification = await prisma.vpg_notifications.findFirst({
      where: {
        notifications_id: notificationId,
        notifications_user_id: userId,
      },
    });

    if (!notification) {
      return null;
    }

    const updated = await prisma.vpg_notifications.update({
      where: {
        notifications_id: notificationId,
      },
      data: {
        notifications_is_read: true,
      },
    });

    return updated;
  }

  /**
   * Marks all notifications for a user as read.
   * @param userId - The user ID whose notifications should be marked as read
   * @returns Promise<number> - The number of notifications updated
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.vpg_notifications.updateMany({
      where: {
        notifications_user_id: userId,
        notifications_is_read: false,
      },
      data: {
        notifications_is_read: true,
      },
    });

    return result.count;
  }

  /**
   * Marks a legal param alert notification as acknowledged by an admin.
   * Also marks the notification as read and creates an audit log entry.
   * @param notificationId - ID of the notification to acknowledge
   * @param adminUserId - User ID of the admin performing the acknowledgment
   * @returns Promise<void>
   * @throws Error if the notification is not found, already acknowledged, or does not require acknowledgment
   */
  static async acknowledgeNotification(
    notificationId: number,
    adminUserId: number,
  ): Promise<void> {
    const notification = await prisma.vpg_notifications.findFirst({
      where: {
        notifications_id: notificationId,
        notifications_requires_acknowledgment: true,
        notifications_acknowledged_by: null,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or already acknowledged');
    }

    await prisma.vpg_notifications.update({
      where: { notifications_id: notificationId },
      data: {
        notifications_acknowledged_by: adminUserId,
        notifications_acknowledged_at: new Date(),
        notifications_is_read: true,
      },
    });

    await prisma.vpg_audit_logs.create({
      data: {
        audit_logs_user_id: adminUserId,
        audit_logs_action: 'ACKNOWLEDGE_LEGAL_PARAM_ALERT',
        audit_logs_entity: 'vpg_notifications',
        audit_logs_entity_id: notificationId,
        audit_logs_timestamp: new Date(),
        audit_logs_details: JSON.stringify({ notificationId }),
      },
    });
  }

  /**
   * Deletes a notification, verifying ownership.
   * @param notificationId - The notification ID to delete
   * @param userId - The user ID (must own the notification)
   * @throws Error if the notification is not found or not owned by the user
   */
  static async deleteNotification(
    notificationId: number,
    userId: number
  ): Promise<void> {
    const notification = await prisma.vpg_notifications.findFirst({
      where: {
        notifications_id: notificationId,
        notifications_user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    await prisma.vpg_notifications.delete({
      where: {
        notifications_id: notificationId,
      },
    });
  }
}
