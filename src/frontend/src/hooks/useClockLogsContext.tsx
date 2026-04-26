"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  EffectiveMarksService, 
  EffectiveClockLog, 
  EffectiveMarksFilters 
} from '@/services/effectiveMarksService';
import { ClockLogsService, ImportSession } from '@/services/clockLogsService';
import { dayConfirmationService } from '@/services/dayConfirmationService';
import { clockLogAdjustmentService } from '@/services/clockLogAdjustmentService';
import { toast } from 'sonner';

const PAGE_SIZE = 20;
const STORAGE_KEY_FILTERS = 'clock_logs_filters';

interface ClockLogsContextType {
  // Data from useEffectiveMarks
  data: EffectiveClockLog[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filters: EffectiveMarksFilters;
  importSessions: ImportSession[];
  setFilters: (newFilters: Partial<EffectiveMarksFilters>) => void;
  applyDatePreset: (preset: 'first_half' | 'second_half' | 'this_month') => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Data from useClockAudit
  confirmDay: (employeeId: number, date: string) => Promise<void>;
  fetchConfirmations: (startDate?: string, endDate?: string) => Promise<void>;
  confirmedDays: Set<string>;
  clearedDays: Set<string>;
  addMarkInline: (employeeId: string, date: string, time: string, type: 'IN' | 'OUT') => Promise<void>;
  changeMarkTypeInline: (employeeId: string, logId: number, currentTimestamp: string, newType: 'IN' | 'OUT') => Promise<void>;
  voidMarkInline: (employeeId: string, logId: number, type: 'IN' | 'OUT', date: string) => Promise<void>;
}

const ClockLogsContext = createContext<ClockLogsContextType | undefined>(undefined);

function getDefaultDates(): { initDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (day <= 15) {
    return {
      initDate: `${year}-${pad(month)}-01`,
      endDate: `${year}-${pad(month)}-15`,
    };
  }
  
  const lastDay = new Date(year, month, 0).getDate();
  return {
    initDate: `${year}-${pad(month)}-16`,
    endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function ClockLogsProvider({ children }: { children: React.ReactNode }) {
  // --- useEffectiveMarks State ---
  const [data, setData] = useState<EffectiveClockLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  
  const [filters, setFiltersState] = useState<EffectiveMarksFilters>(() => {
    const defaultDates = getDefaultDates();
    if (typeof window === 'undefined') return { ...defaultDates, status: [] };

    const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (!saved) return { ...defaultDates, status: [] };

    try {
      const parsed = JSON.parse(saved);
      return {
        initDate: parsed.initDate || defaultDates.initDate,
        endDate: parsed.endDate || defaultDates.endDate,
        status: parsed.status || [],
        employee_id: parsed.employee_id,
        branch_id: parsed.branch_id,
      };
    } catch (e) {
      console.warn('[ClockLogsContext] Error parsing saved filters:', e);
      return { ...defaultDates, status: [] };
    }
  });

  interface ConfirmationRecord {
    employee_id: number;
    confirmation_date: string;
  }

  // --- useClockAudit State ---
  const [confirmedData, setConfirmedData] = useState<ConfirmationRecord[]>([]);
  const [clearedDays, setClearedDays] = useState<Set<string>>(new Set());

  // Track if initial sessions have been loaded
  const hasLoadedSessions = useRef(false);
  const lastRequestId = useRef<number>(0);

  const hasMore = page * PAGE_SIZE < totalCount;

  // --- useEffectiveMarks Logic ---

  const fetchImportSessions = useCallback(async () => {
    try {
      const result = await ClockLogsService.getImportSessions(5);
      setImportSessions(result);
    } catch (err: unknown) {
      console.warn('[ClockLogsContext] Error fetching import sessions:', err instanceof Error ? err.message : err);
    }
  }, []);

  const fetchPage = useCallback(async (currentPage: number, currentFilters: EffectiveMarksFilters, append: boolean = false) => {
    const requestId = Date.now();
    lastRequestId.current = requestId;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await EffectiveMarksService.getEffectiveMarks({
        ...currentFilters,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      // Only apply results if this is still the most recent request
      if (lastRequestId.current !== requestId) return;

      if (result.success) {
        if (append) {
          setData(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const uniqueNew = result.data.filter(l => !existingIds.has(l.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setData(result.data);
        }
        setTotalCount(result.total);
      } else {
        setError('Error al cargar marcas efectivas');
      }
    } catch (err: unknown) {
      if (lastRequestId.current !== requestId) return;
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[ClockLogsContext] Fetch error:', message);
    } finally {
      if (lastRequestId.current === requestId) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<EffectiveMarksFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const applyDatePreset = useCallback((preset: 'first_half' | 'second_half' | 'this_month') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (preset === 'first_half') {
      setFilters({
        initDate: `${year}-${pad(month)}-01`,
        endDate: `${year}-${pad(month)}-15`,
      });
    } else if (preset === 'second_half') {
      const lastDay = new Date(year, month, 0).getDate();
      setFilters({
        initDate: `${year}-${pad(month)}-16`,
        endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
      });
    } else if (preset === 'this_month') {
      const day = now.getDate();
      setFilters({
        initDate: `${year}-${pad(month)}-01`,
        endDate: `${year}-${pad(month)}-${pad(day)}`,
      });
    }
  }, [setFilters]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    await fetchPage(nextPage, filters, true);
    setPage(nextPage);
  }, [isLoadingMore, hasMore, page, filters, fetchPage]);

  const refresh = useCallback(async () => {
    setPage(1);
    await Promise.all([
      fetchPage(1, filters, false),
      fetchImportSessions()
    ]);
  }, [filters, fetchPage, fetchImportSessions]);

  // --- useClockAudit Logic ---

  const fetchConfirmations = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      const res = await dayConfirmationService.get(undefined, startDate, endDate);
      if (res.success && Array.isArray(res.data)) {
        setConfirmedData(res.data);
      }
    } catch (e) {
      console.error('[ClockLogsContext] Error fetching confirmations:', e);
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
    } catch {
      setConfirmedData(prev => prev.filter(c => {
        const d = new Date(c.confirmation_date).toISOString().split('T')[0];
        return `${c.employee_id}_${d}` !== key;
      }));
      toast.error('Error al confirmar día');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMarkInline = useCallback(async (employeeId: string, date: string, time: string, type: 'IN' | 'OUT') => {
    const key = `${employeeId}_${date}`;
    setClearedDays(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    setIsLoading(true);
    try {
      // Combine date and time, interpret as local time, then convert to ISO
      const localDateTime = new Date(`${date}T${time}:00`);
      if (isNaN(localDateTime.getTime())) {
        toast.error('Fecha o hora inválida');
        return;
      }
      const timestamp = localDateTime.toISOString();

      await clockLogAdjustmentService.addClockLog({
        employeeId,
        timestamp,
        type,
        justification: 'Ajuste rápido desde auditoría'
      });
      toast.success('Marca añadida');
      refresh();
    } catch {
      setClearedDays(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toast.error('Error al añadir marca');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const changeMarkTypeInline = useCallback(async (employeeId: string, logId: number, currentTimestamp: string, newType: 'IN' | 'OUT') => {
    const date = new Date(currentTimestamp).toISOString().split('T')[0];
    const key = `${employeeId}_${date}`;
    setClearedDays(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    setIsLoading(true);
    try {
      const normalizedTs = new Date(currentTimestamp).toISOString();
      await clockLogAdjustmentService.editClockLog(
        String(logId),
        employeeId,
        normalizedTs,
        newType,
        'Corrección de tipo (IN/OUT) desde auditoría'
      );
      toast.success('Tipo actualizado');
      refresh();
    } catch {
      setClearedDays(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toast.error('Error al actualizar tipo');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const voidMarkInline = useCallback(async (employeeId: string, logId: number, type: 'IN' | 'OUT', date: string) => {
    const key = `${employeeId}_${date}`;
    setClearedDays(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    setIsLoading(true);
    try {
      await clockLogAdjustmentService.voidClockLog(
        String(logId),
        employeeId,
        type,
        'Anulación rápida desde auditoría'
      );
      toast.success('Marca eliminada');
      refresh();
    } catch {
      setClearedDays(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toast.error('Error al eliminar marca');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  // --- Effects ---

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
  }, [filters]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchPage(1, filters, false);
    
    if (!hasLoadedSessions.current) {
      fetchImportSessions();
      hasLoadedSessions.current = true;
    }
  }, [filters, fetchPage, fetchImportSessions]);

  // Load confirmations when date range changes
  useEffect(() => {
    fetchConfirmations(filters.initDate, filters.endDate);
  }, [filters.initDate, filters.endDate, fetchConfirmations]);

  const value = {
    data,
    totalCount,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    filters,
    importSessions,
    setFilters,
    applyDatePreset,
    loadMore,
    refresh,
    confirmDay,
    fetchConfirmations,
    confirmedDays,
    clearedDays,
    addMarkInline,
    changeMarkTypeInline,
    voidMarkInline,
  };

  return (
    <ClockLogsContext.Provider value={value}>
      {children}
    </ClockLogsContext.Provider>
  );
}

export function useClockLogsContext() {
  const context = useContext(ClockLogsContext);
  if (context === undefined) {
    throw new Error('useClockLogsContext must be used within a ClockLogsProvider');
  }
  return context;
}
