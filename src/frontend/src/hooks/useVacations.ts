import { useEffect, useState, useCallback } from 'react';
import { VacationsService, Vacation } from '@/services/vacationsService';

export const useVacations = () => {
  const [data, setData] = useState<Vacation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await VacationsService.getAll();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error cargando vacaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Vacation>) => {
    setIsLoading(true);
    try {
      const created = await VacationsService.create(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Vacation>) => {
    setIsLoading(true);
    try {
      const updated = await VacationsService.update(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      await VacationsService.delete(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
