import { useEffect, useState, useCallback } from 'react';
import { BonusesService, Bonus } from '@/services/bonusesService';

export const useBonuses = () => {
  const [data, setData] = useState<Bonus[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await BonusesService.getAllBonuses();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error cargando bonificaciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Bonus>) => {
    setIsLoading(true);
    try {
      const created = await BonusesService.createBonus(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Bonus>) => {
    setIsLoading(true);
    try {
      const updated = await BonusesService.updateBonus(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      await BonusesService.deleteBonus(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
