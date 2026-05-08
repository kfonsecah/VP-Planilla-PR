import { useState, useEffect, useCallback } from 'react';
import { aguinaldoService } from '@/services/aguinaldoService';
import type { AguinaldoProjectionResponse } from '@/types/aguinaldo';

/**
 * Hook to fetch the aguinaldo projection for all active employees.
 * @param fiscalYear Optional fiscal year anchor (defaults to current year)
 */
export function useAguinaldoProjection(fiscalYear?: number) {
  const [data, setData] = useState<AguinaldoProjectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aguinaldoService.getProjection(undefined, fiscalYear);
      setData(result);
    } catch (err) {
      console.error('Error fetching aguinaldo projection:', err);
      setError('Error al cargar la proyección de aguinaldo');
    } finally {
      setIsLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection]);

  return { data, isLoading, error, refresh: fetchProjection };
}
