import { useState, useCallback, useMemo } from 'react';
import { dayConfirmationService } from '../services/dayConfirmationService';
import { clockLogAdjustmentService } from '../services/clockLogAdjustmentService';
import { toast } from 'sonner';

export function useClockAudit(onRefresh?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedData, setConfirmedData] = useState<any[]>([]);

  const fetchConfirmations = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      const res = await dayConfirmationService.get(undefined, startDate, endDate);
      if (res.success && Array.isArray(res.data)) {
        setConfirmedData(res.data);
      }
    } catch (e) {
      console.error('Error fetching confirmations:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmedDays = useMemo(() => {
    const set = new Set<string>();
    confirmedData.forEach(c => {
      const date = new Date(c.confirmation_date).toISOString().split('T')[0];
      set.add(`${c.employee_id}_${date}`);
    });
    return set;
  }, [confirmedData]);

  const confirmDay = useCallback(async (employeeId: number, date: string) => {
    const key = `${employeeId}_${date}`;
    setConfirmedData(prev => [...prev, { employee_id: employeeId, confirmation_date: date }]);

    setIsLoading(true);
    try {
      await dayConfirmationService.upsert(employeeId, date);
      toast.success('Día confirmado');
    } catch (e) {
      setConfirmedData(prev => prev.filter(c => {
        const d = new Date(c.confirmation_date).toISOString().split('T')[0];
        return `${c.employee_id}_${d}` !== key;
      }));
      toast.error('Error al confirmar día');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- NUEVAS FUNCIONES INLINE ---

  const addMarkInline = useCallback(async (employeeId: string, date: string, time: string, type: 'IN' | 'OUT') => {
    setIsLoading(true);
    try {
      // Ensure strict ISO format with Z
      const timestamp = new Date(`${date}T${time}:00`).toISOString();
      await clockLogAdjustmentService.addClockLog({
        employeeId,
        timestamp,
        type,
        justification: 'Ajuste rápido desde auditoría'
      });
      toast.success('Marca añadida');
      onRefresh?.();
    } catch (e) {
      toast.error('Error al añadir marca');
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  const changeMarkTypeInline = useCallback(async (employeeId: string, logId: number, currentTimestamp: string, newType: 'IN' | 'OUT') => {
    setIsLoading(true);
    try {
      // Normalize existing timestamp to strict ISO
      const normalizedTs = new Date(currentTimestamp).toISOString();
      await clockLogAdjustmentService.editClockLog(
        String(logId),
        employeeId,
        normalizedTs,
        newType,
        'Corrección de tipo (IN/OUT) desde auditoría'
      );
      toast.success('Tipo actualizado');
      onRefresh?.();
    } catch (e) {
      toast.error('Error al actualizar tipo');
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  const voidMarkInline = useCallback(async (employeeId: string, logId: number, type: 'IN' | 'OUT') => {
    setIsLoading(true);
    try {
      await clockLogAdjustmentService.voidClockLog(
        String(logId),
        employeeId,
        type,
        'Anulación rápida desde auditoría'
      );
      toast.success('Marca eliminada');
      onRefresh?.();
    } catch (e) {
      toast.error('Error al eliminar marca');
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  return { 
    isLoading, 
    confirmDay, 
    fetchConfirmations, 
    confirmedDays,
    addMarkInline,
    changeMarkTypeInline,
    voidMarkInline
  };
}
