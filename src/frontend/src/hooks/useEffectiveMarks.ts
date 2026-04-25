import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  EffectiveMarksService, 
  EffectiveClockLog, 
  EffectiveMarksFilters 
} from '@/services/effectiveMarksService';
import { ClockLogsService, ImportSession } from '@/services/clockLogsService';

const PAGE_SIZE = 20;
const STORAGE_KEY_FILTERS = 'clock_logs_filters';

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

export function useEffectiveMarks() {
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
      console.warn('[useEffectiveMarks] Error parsing saved filters:', e);
      return { ...defaultDates, status: [] };
    }
  });

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
  }, [filters]);

  // Track if initial sessions have been loaded
  const hasLoadedSessions = useRef(false);

  const hasMore = page * PAGE_SIZE < totalCount;

  const fetchImportSessions = useCallback(async () => {
    try {
      const result = await ClockLogsService.getImportSessions(5);
      setImportSessions(result);
    } catch (err: unknown) {
      console.warn('[useEffectiveMarks] Error fetching import sessions:', err instanceof Error ? err.message : err);
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
      console.error('[useEffectiveMarks] Fetch error:', message);
    } finally {
      if (lastRequestId.current === requestId) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Track the latest request to avoid race conditions
  const lastRequestId = useRef<number>(0);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    fetchPage(1, filters, false);
    
    if (!hasLoadedSessions.current) {
      fetchImportSessions();
      hasLoadedSessions.current = true;
    }
  }, [filters, fetchPage, fetchImportSessions]);

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

  return {
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
  };
}
