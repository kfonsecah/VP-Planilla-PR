import { useEffect, useState, useCallback } from 'react';
import { PositionsService, Position } from '@/services/positionsService';

export const usePositions = () => {
  const [data, setData] = useState<Position[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await PositionsService.getAllPositions();
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Error cargando posiciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (payload: Partial<Position>) => {
    setIsLoading(true);
    try {
      const created = await PositionsService.createPosition(payload);
      setData(prev => prev ? [created, ...prev] : [created]);
      return created;
    } finally { setIsLoading(false); }
  };

  const update = async (id: number, payload: Partial<Position>) => {
    setIsLoading(true);
    try {
      const updated = await PositionsService.updatePosition(id, payload);
      setData(prev => prev ? prev.map(p => p.id === id ? updated : p) : [updated]);
      return updated;
    } finally { setIsLoading(false); }
  };

  const remove = async (id: number) => {
    setIsLoading(true);
    try {
      await PositionsService.deletePosition(id);
      setData(prev => prev ? prev.filter(p => p.id !== id) : null);
    } finally { setIsLoading(false); }
  };

  return { data, isLoading, error, refetch: fetchAll, create, update, remove };
};
