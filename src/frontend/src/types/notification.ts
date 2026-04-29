export interface Notification {
  notifications_id: number;
  notifications_user_id: number;
  notifications_title: string;
  notifications_message: string;
  notifications_type: string;
  notifications_is_read: boolean;
  notifications_created_at: string;
  notifications_version: number;
  notifications_requires_acknowledgment?: boolean;
  notifications_acknowledged_by?: number | null;
  notifications_acknowledged_at?: string | null;
  notifications_metadata?: Record<string, unknown> | null;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
}

export interface LegalParamAlertNotification extends Notification {
  notifications_type: 'LEGAL_PARAM_CHANGE';
  notifications_requires_acknowledgment: true;
}
