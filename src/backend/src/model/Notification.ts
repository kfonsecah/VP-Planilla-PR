import { Prisma } from '@prisma/client';

/**
 * Notification model interface matching the Prisma vpg_notifications model.
 */
export interface Notification {
  notifications_id: number;
  notifications_user_id: number;
  notifications_title: string;
  notifications_message: string;
  notifications_type: string;
  notifications_is_read: boolean;
  notifications_created_at: Date;
  notifications_version: number;
  notifications_requires_acknowledgment: boolean;
  notifications_acknowledged_by: number | null;
  notifications_acknowledged_at: Date | null;
  notifications_metadata: Prisma.JsonValue | null;
}

/**
 * Valid notification type values.
 */
export type NotificationType =
  | 'payroll_generated'
  | 'payment_processed'
  | 'employee_action'
  | 'system'
  | 'report_generated'
  | 'LEGAL_PARAM_CHANGE';

/**
 * Input for creating a new notification.
 */
export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
}

export interface LegalParamAlertNotification extends Notification {
  notifications_type: 'LEGAL_PARAM_CHANGE';
  notifications_requires_acknowledgment: true;
}
