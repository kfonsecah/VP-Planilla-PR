import { useState, useCallback, useEffect } from 'react';
import { ClockAliasService, type ClockAlias } from '@/services/clockAliasService';
import { ApiError } from '@/services/http';

export interface UseClockAliasesReturn {
  aliases: ClockAlias[];
  isLoading: boolean;
  error: string | null;
  fetchAliases: () => Promise<void>;
  addAlias: (name: string) => Promise<boolean>;
  removeAlias: (aliasId: number) => Promise<boolean>;
}

/**
 * Hook para gestionar los aliases de marcas de reloj de un empleado.
 * Provee fetch, add y remove con UI optimista en removeAlias.
 * @param employeeId - ID del empleado (string o number)
 * @returns { aliases, isLoading, error, fetchAliases, addAlias, removeAlias }
 */
export const useClockAliases = (employeeId: string | number): UseClockAliasesReturn => {
  const [aliases, setAliases] = useState<ClockAlias[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAliases = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClockAliasService.getAliases(employeeId);
      setAliases(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar aliases');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const addAlias = useCallback(async (name: string): Promise<boolean> => {
    if (!employeeId || !name.trim()) return false;
    try {
      const newAlias = await ClockAliasService.createAlias(employeeId, name.trim());
      setAliases(prev => [...prev, newAlias]);
      return true;
    } catch (e) {
      // Handle 409 duplicate — ApiError.statusCode is authoritative
      if (e instanceof ApiError && e.statusCode === 409) {
        setError('Este alias ya está registrado para este empleado');
      } else {
        setError(e instanceof Error ? e.message : 'Error al agregar');
      }
      return false;
    }
  }, [employeeId]);

  const removeAlias = useCallback(async (aliasId: number): Promise<boolean> => {
    if (!employeeId) return false;
    // Optimistic update — remove immediately, rollback on error
    const previous = [...aliases];
    setAliases(prev => prev.filter(a => a.id !== aliasId));
    try {
      await ClockAliasService.deleteAlias(employeeId, aliasId);
      return true;
    } catch (e) {
      setAliases(previous); // Rollback on error
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      return false;
    }
  }, [employeeId, aliases]);

  useEffect(() => {
    if (employeeId) {
      fetchAliases();
    }
  }, [employeeId, fetchAliases]);

  return { aliases, isLoading, error, fetchAliases, addAlias, removeAlias };
};
