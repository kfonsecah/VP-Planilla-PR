import { Request, Response } from 'express';
import { NotificationService } from '../service/NotificationService';
import { CreateNotificationInput } from '../model/Notification';

const VALID_NOTIFICATION_TYPES = [
  'LEGAL_PARAM_CHANGE', 'payroll_generated', 'payment_processed',
  'employee_action', 'system', 'report_generated',
] as const;

export class NotificationController {
  /**
   * Creates a new notification.
   * POST /notifications
   */
  static async createNotification(req: Request, res: Response): Promise<void> {
    const { userId, title, message, type }: CreateNotificationInput = req.body;

    if (!userId || !title || !message || !type) {
      res.status(400).json({
        success: false,
        error: 'userId, title, message, and type are required',
      });
      return;
    }

    const notification = await NotificationService.createNotification({
      userId,
      title,
      message,
      type,
    });

    res.status(201).json({ success: true, data: notification });
  }

  /**
   * Gets paginated notifications for the authenticated user.
   * GET /notifications?page=1&limit=20
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { id: number }).id;
    const typeFilter = req.query.type as string | undefined;
    const unacknowledged = req.query.unacknowledged === 'true';

    // Validate type filter if provided
    if (typeFilter && !VALID_NOTIFICATION_TYPES.includes(typeFilter as typeof VALID_NOTIFICATION_TYPES[number])) {
      res.status(400).json({ success: false, error: 'Invalid notification type filter' });
      return;
    }

    // Special case: legal param alerts filter
    if (typeFilter === 'LEGAL_PARAM_CHANGE' && unacknowledged) {
      const alerts = await NotificationService.getUnacknowledgedLegalParamAlerts(userId);
      res.status(200).json({ success: true, data: alerts, total: alerts.length });
      return;
    }

    // Default: paginated notifications (existing behavior)
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const result = await NotificationService.getNotificationsByUserId(userId, page, limit);
    res.status(200).json({ success: true, data: result.data, total: result.total, page, limit });
  }

  /**
   * Gets the count of unread notifications for the authenticated user.
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { id: number }).id;

    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({ success: true, data: { count } });
  }

  /**
   * Marks a single notification as read.
   * PUT /notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id as string, 10);
    const userId = (req.user as { id: number }).id;

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    const notification = await NotificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      });
      return;
    }

    res.status(200).json({ success: true, data: notification });
  }

  /**
   * Marks all notifications as read for the authenticated user.
   * PUT /notifications/read-all
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { id: number }).id;

    const count = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  }

  /**
   * Deletes a notification.
   * DELETE /notifications/:id
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id as string, 10);
    const userId = (req.user as { id: number }).id;

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    try {
      await NotificationService.deleteNotification(notificationId, userId);
      res.status(204).send();
    } catch {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      });
    }
  }

  /**
   * Marks a legal param alert notification as acknowledged.
   * Accessible by admin and payroll_manager roles.
   * PATCH /notifications/:id/acknowledge
   */
  static async acknowledgeNotification(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id as string, 10);
    const userRole = (req.user as { id: number; role: string }).role;
    const userId = (req.user as { id: number; role: string }).id;

    if (userRole !== 'admin' && userRole !== 'payroll_manager') {
      res.status(403).json({ success: false, error: 'Sin permisos para marcar alertas como revisadas' });
      return;
    }
    if (isNaN(notificationId)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    try {
      await NotificationService.acknowledgeNotification(notificationId, userId);
      res.status(200).json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al marcar notificación como revisada';
      res.status(404).json({ success: false, error: message });
    }
  }
}
