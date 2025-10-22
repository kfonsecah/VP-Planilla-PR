import { useState, useCallback } from 'react';
import { AuditLogsService } from '@/services/auditLogsService';
import { AuditLog, AuditLogFilters } from '@/types/auditLog';

/**
 * Hook for managing audit logs
 */
export const useAuditLogs = () => {
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch audit logs with optional filters
   */
  const fetchAuditLogs = useCallback(async (filters?: AuditLogFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuditLogsService.getAuditLogs(filters);
      setData(response.data || []);
      setTotal(response.total || 0);
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al cargar logs de auditoría';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch audit logs with current filters
   */
  const refetch = useCallback(async (filters?: AuditLogFilters) => {
    return fetchAuditLogs(filters);
  }, [fetchAuditLogs]);

  return {
    data,
    total,
    isLoading,
    error,
    fetchAuditLogs,
    refetch,
  };
};
