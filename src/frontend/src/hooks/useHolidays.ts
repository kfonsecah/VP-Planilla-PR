import { useEffect, useState, useCallback } from 'react';
import { holidaysService, CompanyHoliday } from '@/services/holidaysService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_holidays_cache';

export const useHolidays = (year?: number) => {
  const [data, setData] = useState<CompanyHoliday[] | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const dynamicKey = year ? `${CACHE_KEY}_${year}` : CACHE_KEY;
    const cached = readCache<CompanyHoliday[]>(dynamicKey);
    if (cached) { setData(cached); return; }
    setIsFetching(true);
    setError(null);
    try {
      const res = await holidaysService.getAll(year);
      setData(res);
      writeCache(dynamicKey, res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando feriados');
    } finally {
      setIsFetching(false);
    }
  }, [year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<CompanyHoliday>) => {
    setIsMutating(true);
    try {
      const created = await holidaysService.create(payload);
      invalidateCache(CACHE_KEY);
      if (year) invalidateCache(`${CACHE_KEY}_${year}`);
      setData(prev => prev ? [...prev, created].sort((a,b) => new Date(a.company_holidays_date).getTime() - new Date(b.company_holidays_date).getTime()) : [created]);
      return created;
    } finally { setIsMutating(false); }
  };

  const createMany = async (payload: Partial<CompanyHoliday>[]) => {
    setIsMutating(true);
    try {
      await holidaysService.createMany(payload);
      invalidateCache(CACHE_KEY);
      if (year) invalidateCache(`${CACHE_KEY}_${year}`);
      await fetchAll();
      return true;
    } finally { setIsMutating(false); }
  };

  const update = async (id: number, payload: Partial<CompanyHoliday>) => {
    setIsMutating(true);
    try {
      const updated = await holidaysService.update(id, payload);
      invalidateCache(CACHE_KEY);
      if (year) invalidateCache(`${CACHE_KEY}_${year}`);
      setData(prev => prev ? prev.map(p => p.company_holidays_id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsMutating(false); }
  };

  const remove = async (id: number) => {
    setIsMutating(true);
    try {
      await holidaysService.delete(id);
      invalidateCache(CACHE_KEY);
      if (year) invalidateCache(`${CACHE_KEY}_${year}`);
      setData(prev => prev ? prev.filter(p => p.company_holidays_id !== id) : null);
    } finally { setIsMutating(false); }
  };

  return { data, isLoading: isFetching, isMutating, error, refetch: fetchAll, create, createMany, update, remove };
};
