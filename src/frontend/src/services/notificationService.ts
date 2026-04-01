import { http } from '@/services/http';
import { Notification, NotificationListResponse } from '@/types/notification';

/**
 * Service for managing notifications via the backend API.
 * All calls go through http.ts (never raw fetch).
 */
export const NotificationService = {
  /**
   * Get paginated list of notifications for the current user.
   */
  async getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
    return http.get(`/notifications?page=${page}&limit=${limit}`) as Promise<NotificationListResponse>;
  },

  /**
   * Get the count of unread notifications for the current user.
   */
  async getUnreadCount(): Promise<number> {
    const result = await http.get('/notifications/unread-count');
    return (result as { count: number }).count;
  },

  /**
   * Mark a single notification as read (ownership verified by backend).
   */
  async markAsRead(id: number): Promise<Notification> {
    return http.put(`/notifications/${id}/read`) as Promise<Notification>;
  },

  /**
   * Mark all notifications as read for the current user.
   */
  async markAllAsRead(): Promise<number> {
    const result = await http.put('/notifications/read-all');
    return (result as { count: number }).count;
  },

  /**
   * Delete a notification (ownership verified by backend).
   */
  async deleteNotification(id: number): Promise<void> {
    await http.delete(`/notifications/${id}`);
  },
};
