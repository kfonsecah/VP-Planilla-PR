import { useState, useEffect, useCallback } from 'react';
import {
  ClockLogsService,
  ClockLogPaginated,
  ClockLogStats,
  ImportSession,
} from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';

interface ClockLogFilters {
  initDate: string;
  endDate: string;
  status: string[];
  employee_id: number | undefined;
}

interface EmployeeOption {
  id: number;
  name: string;
}

const getDefaultInitDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const getDefaultEndDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PAGE_SIZE = 20;

/**
 * Hook managing stats, logs, filters, pagination, and import sessions
 * for the clock-logs dashboard.
 */
export function useClockLogs() {
  const [stats, setStats] = useState<ClockLogStats | null>(null);
  const [logs, setLogs] = useState<ClockLogPaginated[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPageState] = useState(1);
  const pageSize = PAGE_SIZE;
  const [importSessions, setImportSessions] = useState<ImportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ClockLogFilters>({
    initDate: getDefaultInitDate(),
    endDate: getDefaultEndDate(),
    status: [],
    employee_id: undefined,
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Load employees once on mount for autocomplete
  useEffect(() => {
    getEmployees()
      .then((apiEmployees) => {
        const mapped: EmployeeOption[] = (apiEmployees as unknown as Array<Record<string, unknown>>).map((raw) => {
          const id = Number(raw.employee_id ?? raw.id ?? 0);
          const firstName = String(raw.employee_first_name ?? raw.first_name ?? raw.name ?? '');
          const middleName = String(raw.employee_middle_name ?? raw.middle_name ?? '');
          const lastName = String(raw.employee_last_name ?? raw.last_name ?? '');
          const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
          return { id, name: fullName || String(raw.name ?? `Empleado ${id}`) };
        });
        setEmployees(mapped);
      })
      .catch((err: unknown) => {
        console.warn('[useClockLogs] No se pudieron cargar empleados:', err instanceof Error ? err.message : err);
      });
  }, []);

  /**
   * Fetch stats for the current date range.
   */
  const fetchStats = useCallback(async (currentFilters: ClockLogFilters) => {
    setIsStatsLoading(true);
    try {
      const result = await ClockLogsService.getStats(currentFilters.initDate, currentFilters.endDate);
      setStats(result);
    } catch (err: unknown) {
      console.error('[useClockLogs] Error al cargar stats:', err instanceof Error ? err.message : err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  /**
   * Fetch paginated clock logs for the current filters and page.
   */
  const fetchLogs = useCallback(async (currentFilters: ClockLogFilters, currentPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClockLogsService.getClockLogsPaginated({
        ...currentFilters,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setLogs(result.data ?? []);
      setTotalLogs(result.total ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar marcas';
      setError(message);
      console.error('[useClockLogs] Error al cargar logs:', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch last 5 import sessions.
   */
  const fetchImportSessions = useCallback(async () => {
    try {
      const result = await ClockLogsService.getImportSessions(5);
      setImportSessions(result);
    } catch (err: unknown) {
      console.warn('[useClockLogs] Error al cargar sesiones de importacion:', err instanceof Error ? err.message : err);
    }
  }, []);

  /**
   * Fetch stats, logs, and import sessions together.
   */
  const fetchAll = useCallback(async (currentFilters: ClockLogFilters, currentPage: number) => {
    await Promise.all([
      fetchStats(currentFilters),
      fetchLogs(currentFilters, currentPage),
      fetchImportSessions(),
    ]);
  }, [fetchStats, fetchLogs, fetchImportSessions]);

  // Re-fetch everything when filters change (reset to page 1)
  useEffect(() => {
    setPageState(1);
    fetchAll(filters, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.initDate, filters.endDate, filters.status, filters.employee_id]);

  // Re-fetch only logs when page changes (stats and sessions don't change with page)
  useEffect(() => {
    fetchLogs(filters, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /**
   * Navigate to a specific page.
   */
  const setPage = useCallback((n: number) => {
    setPageState(n);
  }, []);

  /**
   * Merge partial filter updates and reset to page 1.
   */
  const setFilters = useCallback((newFilters: Partial<ClockLogFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPageState(1);
  }, []);

  /**
   * Refresh stats, logs, and sessions for the current filters and page.
   */
  const refresh = useCallback(() => {
    fetchAll(filters, page);
  }, [fetchAll, filters, page]);

  /**
   * Apply a date preset shortcut.
   */
  const applyDatePreset = useCallback((preset: 'today' | 'last7days' | 'thisMonth' | 'threeMonths') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const today = toDateStr(now);

    if (preset === 'today') {
      setFilters({ initDate: today, endDate: today });
    } else if (preset === 'last7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setFilters({ initDate: toDateStr(past), endDate: today });
    } else if (preset === 'thisMonth') {
      const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      setFilters({ initDate: firstDay, endDate: today });
    } else if (preset === 'threeMonths') {
      // Rango: primer día de hace 3 meses hasta hoy
      const init = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setFilters({ initDate: toDateStr(init), endDate: today });
    }
  }, [setFilters]);

  return {
    stats,
    logs,
    totalLogs,
    page,
    pageSize,
    importSessions,
    isLoading,
    isStatsLoading,
    error,
    filters,
    employees,
    setPage,
    setFilters,
    applyDatePreset,
    refresh,
  };
}
