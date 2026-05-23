import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { integrityService, IntegrityDashboardStatus } from '@/services/integrityService';

/**
 * Hook to manage the Data Integrity Dashboard state and actions.
 */
export const useIntegrityDashboard = () => {
  const [data, setData] = useState<IntegrityDashboardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await integrityService.getDashboardStatus();
      setData(status);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el dashboard de integridad';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runAudit = useCallback(async () => {
    setIsAuditing(true);
    try {
      await integrityService.runAudit();
      toast.success('Auditoría completada exitosamente');
      await fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al ejecutar la auditoría';
      toast.error(msg);
    } finally {
      setIsAuditing(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    isLoading,
    isAuditing,
    runAudit,
    error,
    refetch: fetchStatus
  };
};
