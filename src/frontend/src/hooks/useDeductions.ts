import { useEffect, useState, useCallback } from 'react';
import { DeductionsService, Deduction } from '@/services/deductionsService';

export const useDeductions = () => {
  const [data, setData] = useState<Deduction[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await DeductionsService.getAllDeductions();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error cargando deducciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Deduction>) => {
    setIsLoading(true);
    try {
      const created = await DeductionsService.createDeduction(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Deduction>) => {
    setIsLoading(true);
    try {
      const updated = await DeductionsService.updateDeduction(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      await DeductionsService.deleteDeduction(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
