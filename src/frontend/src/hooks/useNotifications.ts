import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';

/**
 * Hook for managing notifications.
 * Provides data, loading state, unread count, and actions.
 * Polls unread count every 30 seconds.
 */
export const useNotifications = () => {
  const [data, setData] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Fetch paginated notifications.
   */
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await NotificationService.getNotifications(page, limit);
      setData(response.data || []);
      setTotal(response.total || 0);
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar notificaciones';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch unread notification count.
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail — unread count is non-critical
    }
  }, []);

  /**
   * Mark a single notification as read.
   */
  const markAsRead = useCallback(async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      // Update local state: mark as read
      setData(prev =>
        prev.map(n =>
          n.notifications_id === id
            ? { ...n, notifications_is_read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notificación marcada como leída');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar como leída';
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Mark all notifications as read.
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setData(prev => prev.map(n => ({ ...n, notifications_is_read: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar todas como leídas';
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Delete a notification.
   */
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await NotificationService.deleteNotification(id);
      setData(prev => prev.filter(n => n.notifications_id !== id));
      toast.success('Notificación eliminada');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar notificación';
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Poll unread count every 30 seconds.
   */
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    data,
    total,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
