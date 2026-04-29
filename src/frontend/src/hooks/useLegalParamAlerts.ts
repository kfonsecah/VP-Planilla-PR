import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';

/**
 * Hook for managing persistent legal parameter change alerts.
 * Polls GET /notifications?type=LEGAL_PARAM_CHANGE&unacknowledged=true every 60 seconds.
 * Distinct from useNotifications — separate state, separate poll interval.
 */
export const useLegalParamAlerts = () => {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await NotificationService.getLegalParamAlerts();
      setAlerts(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar alertas legales';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acknowledge = useCallback(async (id: number) => {
    setIsAcknowledging(id);
    try {
      await NotificationService.acknowledgeNotification(id);
      toast.success('Alerta marcada como revisada.');
      await fetchAlerts();
    } catch {
      toast.error('No se pudo marcar como revisado. Intenta de nuevo.');
    } finally {
      setIsAcknowledging(null);
    }
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    isAcknowledging,
    acknowledge,
    refetch: fetchAlerts,
  };
};
