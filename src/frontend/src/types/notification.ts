export interface Notification {
  notifications_id: number;
  notifications_user_id: number;
  notifications_title: string;
  notifications_message: string;
  notifications_type: string;
  notifications_is_read: boolean;
  notifications_created_at: string;
  notifications_version: number;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
}
