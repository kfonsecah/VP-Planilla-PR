import { useEffect, useState, useCallback } from 'react';
import { PositionsService, Position } from '@/services/positionsService';
import { readCache, writeCache, invalidateCache } from '@/utils/sessionCache';

const CACHE_KEY = 'vp_positions_cache';

export const usePositions = () => {
  const [data, setData] = useState<Position[] | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const cached = readCache<Position[]>(CACHE_KEY);
    if (cached) {
      setData(cached);
      return;
    }
    setIsFetching(true);
    setError(null);
    try {
      const res = await PositionsService.getAllPositions();
      writeCache(CACHE_KEY, res);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando posiciones');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Position>) => {
    setIsMutating(true);
    try {
      invalidateCache(CACHE_KEY);
      const created = await PositionsService.createPosition(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsMutating(false); }
  };

  const update = async (id: number, payload: Partial<Position>) => {
    setIsMutating(true);
    try {
      invalidateCache(CACHE_KEY);
      const updated = await PositionsService.updatePosition(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsMutating(false); }
  };

  const remove = async (id: number) => {
    setIsMutating(true);
    try {
      invalidateCache(CACHE_KEY);
      await PositionsService.deletePosition(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsMutating(false); }
  };

  // Wrapper that ensures cache bypass on manual refetch
  const refetch = useCallback(async () => {
    invalidateCache(CACHE_KEY);
    await fetchAll();
  }, [fetchAll]);

  return { data, isLoading: isFetching, isMutating, error, refetch, create, update, remove };
};
