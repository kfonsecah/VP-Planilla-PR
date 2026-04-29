import { http } from '@/services/http';
import { Notification, NotificationListResponse } from '@/types/notification';

/**
 * Service for managing notifications via the backend API.
 * All calls go through http.ts (never raw fetch).
 */
export const NotificationService = {
  /**
   * Get paginated list of notifications for the current user.
   * Note: http.get auto-unwraps { success, data } → returns data only.
   * We need total too, so we use http.raw to get the full response.
   */
  async getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
    const res = await http.raw(`/notifications?page=${page}&limit=${limit}`);
    const json = await res.json();
    return {
      data: json.data as Notification[],
      total: json.total as number,
    };
  },

  /**
   * Get the count of unread notifications for the current user.
   */
  async getUnreadCount(): Promise<number> {
    const res = await http.raw('/notifications/unread-count');
    const json = await res.json();
    return json.data?.count as number;
  },

  /**
   * Mark a single notification as read (ownership verified by backend).
   */
  async markAsRead(id: number): Promise<Notification> {
    const res = await http.raw(`/notifications/${id}/read`, { method: 'PUT' });
    const json = await res.json();
    return json.data as Notification;
  },

  /**
   * Mark all notifications as read for the current user.
   */
  async markAllAsRead(): Promise<number> {
    const res = await http.raw('/notifications/read-all', { method: 'PUT' });
    const json = await res.json();
    return json.data?.count as number;
  },

  /**
   * Delete a notification (ownership verified by backend).
   */
  async deleteNotification(id: number): Promise<void> {
    await http.raw(`/notifications/${id}`, { method: 'DELETE' });
  },

  /**
   * Fetch unacknowledged LEGAL_PARAM_CHANGE alerts for the current user.
   */
  async getLegalParamAlerts(): Promise<Notification[]> {
    const res = await http.raw('/notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true');
    const json = await res.json();
    return (json.data ?? []) as Notification[];
  },

  /**
   * Acknowledge a legal param alert notification (admin only).
   */
  async acknowledgeNotification(id: number): Promise<void> {
    await http.raw(`/notifications/${id}/acknowledge`, { method: 'PATCH' });
  },
};
