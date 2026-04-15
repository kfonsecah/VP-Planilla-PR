# Phase 34: Frontend — Rediseño Clock Logs — Pattern Map

**Mapped:** 2026-04-14
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8 (100% coverage)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/frontend/src/hooks/useEffectiveMarks.ts` | hook | request-response | `src/frontend/src/hooks/useClockLogs.ts` | exact |
| `src/frontend/src/services/effectiveMarksService.ts` | service | request-response | `src/frontend/src/services/clockLogsService.ts` | exact |
| `src/frontend/src/components/BranchGroup.tsx` | component | request-response | `src/frontend/src/components/EmployeeProfileCard.tsx` | role-match |
| `src/frontend/src/components/EmployeeCard.tsx` | component | request-response | `src/frontend/src/components/EmployeeIncidenceCard.tsx` | role-match |
| `src/frontend/src/components/DailyRow.tsx` | component | request-response | `src/frontend/src/components/EmployeeProfileCard.tsx` | role-match |
| `src/frontend/src/components/ClockLogStatusBadge.tsx` | component | request-response | (existing) | preserve |
| `src/frontend/src/components/ImportSessionsPanel.tsx` | component | request-response | (existing) | preserve |
| `src/frontend/src/app/pages/clock-logs/page.tsx` | page | request-response | (existing) | replace |

---

## Pattern Assignments

### `src/frontend/src/hooks/useEffectiveMarks.ts` (hook, request-response)

**Analog:** `src/frontend/src/hooks/useClockLogs.ts`

**Pattern Overview:**
Hook manages state (filters, loading, data, pagination), integrates with service layer, provides actions for filter manipulation and data refresh.

**Imports pattern** (lines 1–8):
```typescript
import { useState, useEffect, useCallback } from 'react';
import { EffectiveMarksService } from '@/services/effectiveMarksService';
import { getEmployees } from '@/services/employeeService';

// Type imports from service
import type { EffectiveClockLog, FilterState } from '@/services/effectiveMarksService';
```

**Hook state structure** (analog lines 10–58):
```typescript
interface EffectiveMarksFilters {
  initDate: string;
  endDate: string;
  branch_id?: number | undefined;
  employee_id?: number | undefined;
  status?: string[];
}

export function useEffectiveMarks() {
  const [data, setData] = useState<EffectiveClockLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPageState] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EffectiveMarksFilters>({
    initDate: getDefaultInitDate(),
    endDate: getDefaultEndDate(),
    branch_id: undefined,
    employee_id: undefined,
    status: [],
  });
```

**Fetch pattern** (analog lines 83–116):
```typescript
const fetchData = useCallback(async (currentFilters: EffectiveMarksFilters, currentPage: number) => {
  setIsLoading(true);
  setError(null);
  try {
    const result = await EffectiveMarksService.getEffectiveMarks({
      ...currentFilters,
      page: currentPage,
      pageSize: PAGE_SIZE,
    });
    setData(result.data ?? []);
    setTotalCount(result.total ?? 0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar marcas efectivas';
    setError(message);
    console.error('[useEffectiveMarks] Error:', message);
  } finally {
    setIsLoading(false);
  }
}, []);
```

**Return shape** (analog lines 203–219):
```typescript
return {
  data,        // EffectiveClockLog[]
  totalCount,
  page,
  isLoading,
  error,
  filters,
  setFilters,  // (newFilters: Partial<EffectiveMarksFilters>) => void
  applyDatePreset,  // (preset: 'first_half' | 'second_half' | 'this_month') => void
  refresh,     // () => void
};
```

---

### `src/frontend/src/services/effectiveMarksService.ts` (service, request-response)

**Analog:** `src/frontend/src/services/clockLogsService.ts`

**Pattern Overview:**
Service exports a singleton object with typed async methods. Delegates HTTP to `http.ts`. Transforms backend response shapes.

**Imports pattern** (analog lines 1–2):
```typescript
import { http } from './http';

// Type definitions inline or imported
export interface EffectiveClockLog {
  id: string;
  employee_id: string;
  employee_name: string;
  branch_name: string;
  log_date: string;  // YYYY-MM-DD
  original: {
    in_time: string | null;
    out_time: string | null;
    status: 'valid' | 'anomaly' | 'orphan' | 'pending' | 'corrected';
    source: 'java_import' | 'excel_import' | 'manual' | 'device';
  };
  adjusted?: {
    in_time: string | null;
    out_time: string | null;
    adjustment_id: string;
    reason: string;
  };
  calculated_hours: number | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

**Service method pattern** (analog lines 72–91):
```typescript
export const EffectiveMarksService = {
  async getEffectiveMarks(params: {
    initDate: string;
    endDate: string;
    page?: number;
    pageSize?: number;
    branch_id?: number;
    employee_id?: number;
    status?: string[];
  }): Promise<PaginatedResponse<EffectiveClockLog>> {
    const searchParams = new URLSearchParams({
      initDate: params.initDate,
      endDate: params.endDate,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 20),
    });
    if (params.branch_id) searchParams.set('branch_id', String(params.branch_id));
    if (params.employee_id) searchParams.set('employee_id', String(params.employee_id));
    if (params.status?.length) searchParams.set('status', params.status.join(','));

    const raw = await http.raw(`/clock-logs/effective?${searchParams.toString()}`, { method: 'GET' });
    if (!raw.ok) return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
    try {
      const json = await raw.json();
      return json ?? { success: true, data: [], total: 0, page: 1, pageSize: 20 };
    } catch {
      return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
    }
  },
```

**Error handling pattern** (analog lines 87–90):
```typescript
  } catch (error: unknown) {
    console.warn('[EffectiveMarksService] Error:', error instanceof Error ? error.message : error);
    return [];
  }
```

---

### `src/frontend/src/components/BranchGroup.tsx` (component, request-response)

**Analog:** `src/frontend/src/components/EmployeeProfileCard.tsx`

**Pattern Overview:**
Card component with simple props interface, TypeScript typing, styled with Tailwind, no animations (branch is static header).

**Component structure** (analog lines 1–26):
```typescript
'use client';

import React from 'react';

interface BranchGroupProps {
  branchName: string;
  employeeCount: number;
  children?: React.ReactNode;  // Employee cards rendered here
}

const BranchGroup: React.FC<BranchGroupProps> = ({
  branchName,
  employeeCount,
  children,
}) => {
  return (
    <div className="mb-4">
      {/* Branch header — static, no animation */}
      <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 font-semibold text-sm border-l-4 border-green-600 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">
            {branchName} — {employeeCount} empleados
          </span>
        </div>
      </div>

      {/* Employee cards container */}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

export default BranchGroup;
```

---

### `src/frontend/src/components/EmployeeCard.tsx` (component, request-response)

**Analog:** `src/frontend/src/components/EmployeeIncidenceCard.tsx`

**Pattern Overview:**
Card component with collapsible expand/collapse behavior. Integrates with framer-motion for animations. Manages local `isExpanded` state. Uses `useCallback` for event handlers.

**Component structure** (base from analog + animations):
```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import DailyRow from './DailyRow';

interface EmployeeCardProps {
  employee_id: string;
  employee_name: string;
  daily_logs: EffectiveClockLog[];  // All logs for this employee in period
  total_hours: number;
  worked_days: number;
  anomaly_count: number;
  onExpandChange?: (isExpanded: boolean) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee_id,
  employee_name,
  daily_logs,
  total_hours,
  worked_days,
  anomaly_count,
  onExpandChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  }, [isExpanded, onExpandChange]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow">
      {/* Header (always visible) */}
      <div
        onClick={toggleExpand}
        className="px-4 py-3 cursor-pointer flex items-center justify-between"
      >
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {employee_name}
          </h3>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {total_hours} horas totales — {worked_days} días
          </div>
        </div>

        {/* Anomaly badge */}
        {anomaly_count > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 ml-2">
            {anomaly_count} problemas
          </span>
        )}

        {/* Chevron icon */}
        <div className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </div>
      </div>

      {/* Expanded content with animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-zinc-200 dark:border-zinc-700"
          >
            <div className="px-4 py-3 space-y-3">
              {daily_logs.map((log) => (
                <DailyRow key={log.id} log={log} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeCard;
```

**Animation pattern** (from ClockLogDetailModal lines 34–44):
```typescript
const containerVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.2 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};
```

---

### `src/frontend/src/components/DailyRow.tsx` (component, request-response)

**Analog:** `src/frontend/src/components/EmployeeProfileCard.tsx` (card pattern) + table row concepts

**Pattern Overview:**
Small component rendering a single day's IN/OUT pair. Shows timestamps, durations, status badges. Handles missing marks with inline alerts. No animation.

**Component structure**:
```typescript
'use client';

import React from 'react';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import ClockLogStatusBadge from './ClockLogStatusBadge';

interface DailyRowProps {
  log: EffectiveClockLog;
  onAddMissing?: (type: 'in' | 'out') => void;
  onCorrect?: () => void;
}

const DailyRow: React.FC<DailyRowProps> = ({ log, onAddMissing, onCorrect }) => {
  const original = log.original;
  const adjusted = log.adjusted;
  const inTime = adjusted?.in_time ?? original.in_time;
  const outTime = adjusted?.out_time ?? original.out_time;
  const hasComplete = inTime && outTime;
  const displayHours = log.calculated_hours ? log.calculated_hours.toFixed(2) : null;

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/30">
      {/* Date header */}
      <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
        {new Date(log.log_date).toLocaleDateString('es-CR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      {/* IN / OUT rows */}
      <div className="space-y-1.5">
        {/* IN mark */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            ENTRADA
          </span>
          {inTime ? (
            <>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">{inTime}</span>
              <ClockLogStatusBadge status={original.status} />
            </>
          ) : (
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Falta marca de entrada.{' '}
              <button
                onClick={() => onAddMissing?.('in')}
                className="underline hover:no-underline"
              >
                Agregar marca
              </button>
            </div>
          )}
        </div>

        {/* OUT mark */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
            SALIDA
          </span>
          {outTime ? (
            <>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">{outTime}</span>
              {hasComplete && displayHours && (
                <span className="text-zinc-600 dark:text-zinc-400">— {displayHours} horas</span>
              )}
              <ClockLogStatusBadge status={original.status} />
            </>
          ) : (
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Falta marca de salida.{' '}
              <button
                onClick={() => onAddMissing?.('out')}
                className="underline hover:no-underline"
              >
                Agregar marca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      {original.status !== 'valid' && (
        <button
          onClick={onCorrect}
          className="mt-2 px-3 py-1 text-xs font-medium rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
        >
          Corregir
        </button>
      )}
    </div>
  );
};

export default DailyRow;
```

---

### `src/frontend/src/components/ClockLogStatusBadge.tsx` (component, request-response)

**Status:** PRESERVE

**File:** `/c/Users/Administrador/Desktop/U-Local/Vp-Planilla/src/frontend/src/components/ClockLogStatusBadge.tsx` (lines 1–34)

**No changes required** for Phase 34. Reuse as-is. The badge already supports all required statuses: `valid`, `pending`, `anomaly`, `orphan`, `corrected`.

---

### `src/frontend/src/components/ImportSessionsPanel.tsx` (component, request-response)

**Status:** PRESERVE

**File:** `/c/Users/Administrador/Desktop/U-Local/Vp-Planilla/src/frontend/src/components/ImportSessionsPanel.tsx` (lines 1–102)

**Integration note (from CONTEXT.md D-12):**
Must be placed below the filters section in the redesigned page, collapsed by default. No code changes; only adjust positioning in page layout.

**Current component uses:**
- `ImportSession` type from `clockLogsService.ts`
- `SESSION_STATUS_COLORS`, `SESSION_STATUS_LABELS`, `SOURCE_LABELS` constants
- Table rendering pattern matching existing style

---

### `src/frontend/src/app/pages/clock-logs/page.tsx` (page, request-response)

**Analog:** Current implementation at `/c/Users/Administrador/Desktop/U-Local/Vp-Planilla/src/frontend/src/app/pages/clock-logs/page.tsx`

**Pattern Overview:**
Page component uses `'use client'` directive, consumes hook, manages modal state, renders hierarchical layout.

**Overall structure** (from current page.tsx):
```typescript
'use client';

import React, { useState } from 'react';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import BranchGroup from '@/components/BranchGroup';
import EmployeeCard from '@/components/EmployeeCard';
import DatePicker from '@/components/DatePicker';
import {
  isoToDisplay,
  parseDisplayToISO,
} from '@/features/clock-logs/presenters/clockLogPresenter';

export default function ClockLogsPage() {
  const {
    data,
    isLoading,
    error,
    filters,
    setFilters,
    applyDatePreset,
    refresh,
  } = useEffectiveMarks();

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Group data by branch, then by employee
  const groupedByBranch = groupDataByBranch(data);  // Helper function
  const sortedBranches = sortBranchesByAnomalies(groupedByBranch);  // Helper function

  const toggleStatus = (status: string) => {
    const current = filters.status ?? [];
    if (current.includes(status)) {
      setFilters({ status: current.filter((s) => s !== status) });
    } else {
      setFilters({ status: [...current, status] });
    }
  };

  const applyBiweeklyPreset = (preset: 'first_half' | 'second_half' | 'this_month') => {
    applyDatePreset(preset);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        {/* A. Page header */}
        <div className="mb-6">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
            Marcas / Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            Panel de Control de Marcas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Revise y corrija marcas de reloj antes de calcular planilla. Grupos por sucursal, empleado y día.
          </p>
        </div>

        {/* B. Biweekly presets + date range */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <button
            onClick={() => applyBiweeklyPreset('first_half')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            1ra Quincena (1-15)
          </button>
          <button
            onClick={() => applyBiweeklyPreset('second_half')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            2da Quincena (16-31)
          </button>
          <button
            onClick={() => applyBiweeklyPreset('this_month')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Mes Actual
          </button>

          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Desde</label>
            <DatePicker
              value={isoToDisplay(filters.initDate)}
              onChange={(display) => {
                const iso = parseDisplayToISO(display);
                if (iso) setFilters({ initDate: iso });
              }}
              placeholder="dd/mm/yy"
              className="w-[120px] border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
            />
            <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Hasta</label>
            <DatePicker
              value={isoToDisplay(filters.endDate)}
              onChange={(display) => {
                const iso = parseDisplayToISO(display);
                if (iso) setFilters({ endDate: iso });
              }}
              placeholder="dd/mm/yy"
              className="w-[120px] border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
            />
          </div>
        </div>

        {/* C. Status filter toggles (simplified for grouped view) */}
        <div className="flex flex-wrap gap-3 items-center mb-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Estado:
          </span>
          {/* Status toggles — same pattern as current page */}
        </div>

        {/* D. Import Sessions Panel — collapsed by default, placed below filters */}
        <ImportSessionsPanel sessions={importSessions} isLoading={isLoading} />

        {/* E. Error banner */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refresh}
              className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline mt-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* F. Main content area — grouped view */}
        {isLoading && data.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando marcas efectivas...</p>
          </div>
        ) : !isLoading && data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-zinc-600 dark:text-zinc-400">
              No hay marcas en este período
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Ajuste el rango de fechas o los filtros para ver datos. Si no hay marcas, verifique que se hayan importado sesiones.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBranches.map((branch) => (
              <BranchGroup key={branch.name} branchName={branch.name} employeeCount={branch.employees.length}>
                {branch.employees.map((emp) => (
                  <EmployeeCard
                    key={emp.employee_id}
                    employee_id={emp.employee_id}
                    employee_name={emp.employee_name}
                    daily_logs={emp.logs}
                    total_hours={emp.total_hours}
                    worked_days={emp.worked_days}
                    anomaly_count={emp.anomaly_count}
                  />
                ))}
              </BranchGroup>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function: group data by branch
function groupDataByBranch(logs: EffectiveClockLog[]) {
  const grouped = new Map<string, EffectiveClockLog[]>();
  logs.forEach((log) => {
    const branch = log.branch_name || 'Sin sucursal';
    if (!grouped.has(branch)) grouped.set(branch, []);
    grouped.get(branch)!.push(log);
  });
  return grouped;
}

// Helper function: sort branches by anomaly count (high to low)
function sortBranchesByAnomalies(grouped: Map<string, EffectiveClockLog[]>) {
  const branches = Array.from(grouped.entries()).map(([branchName, logs]) => {
    const byEmployee = new Map<string, EffectiveClockLog[]>();
    logs.forEach((log) => {
      const empId = log.employee_id;
      if (!byEmployee.has(empId)) byEmployee.set(empId, []);
      byEmployee.get(empId)!.push(log);
    });

    const employees = Array.from(byEmployee.entries()).map(([empId, empLogs]) => {
      const anomalyCount = empLogs.filter((log) => log.original.status !== 'valid').length;
      const totalHours = empLogs.reduce((sum, log) => sum + (log.calculated_hours ?? 0), 0);
      const workedDays = new Set(empLogs.map((log) => log.log_date)).size;

      return {
        employee_id: empId,
        employee_name: empLogs[0]?.employee_name || `Empleado ${empId}`,
        logs: empLogs,
        total_hours: totalHours,
        worked_days: workedDays,
        anomaly_count: anomalyCount,
      };
    });

    // Sort by anomaly count (descending) then by name
    employees.sort((a, b) => {
      if (b.anomaly_count !== a.anomaly_count) return b.anomaly_count - a.anomaly_count;
      return a.employee_name.localeCompare(b.employee_name);
    });

    return { name: branchName, employees };
  });

  // Sort branches alphabetically
  branches.sort((a, b) => a.name.localeCompare(b.name));
  return branches;
}
```

**Import statements** (from current page.tsx lines 1–18):
```typescript
'use client';

import React, { useState } from 'react';
import { useClockLogs } from '@/hooks/useClockLogs';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import ClockLogDetailModal from '@/components/ClockLogDetailModal';
import { ClockLogPaginated } from '@/services/clockLogsService';
import DatePicker from '@/components/DatePicker';
import {
  STATUS_OPTIONS,
  STATUS_CARD_COLORS,
  STATUS_NAMES,
  STATUS_TOGGLE_COLORS,
  isoToDisplay,
  parseDisplayToISO,
  getClockLogViewModel,
} from '@/features/clock-logs/presenters/clockLogPresenter';
```

**New imports for Phase 34 page:**
```typescript
'use client';

import React, { useState } from 'react';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import BranchGroup from '@/components/BranchGroup';
import EmployeeCard from '@/components/EmployeeCard';
import DatePicker from '@/components/DatePicker';
import {
  isoToDisplay,
  parseDisplayToISO,
  STATUS_OPTIONS,
  STATUS_TOGGLE_COLORS,
  STATUS_NAMES,
} from '@/features/clock-logs/presenters/clockLogPresenter';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
```

---

## Shared Patterns

### Date Preset Pattern
**Source:** `src/frontend/src/hooks/useClockLogs.ts` lines 179–201

**Apply to:** `useEffectiveMarks.ts` — implement `applyDatePreset()` with new presets:
```typescript
const applyDatePreset = useCallback(
  (preset: 'first_half' | 'second_half' | 'this_month') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (preset === 'first_half') {
      const initDate = `${year}-${pad(month)}-01`;
      const endDate = `${year}-${pad(month)}-15`;
      setFilters({ initDate, endDate });
    } else if (preset === 'second_half') {
      const initDate = `${year}-${pad(month)}-16`;
      const endDate = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
      setFilters({ initDate, endDate });
    } else if (preset === 'this_month') {
      const firstDay = `${year}-${pad(month)}-01`;
      const today = toDateStr(now);
      setFilters({ initDate: firstDay, endDate: today });
    }
  },
  [setFilters],
);
```

### Component Animation Pattern
**Source:** `src/frontend/src/components/ClockLogDetailModal.tsx` lines 9–44, and `src/frontend/src/components/EditEmployeeModal.tsx` lines 11–13

**Apply to:** `EmployeeCard.tsx` — use dynamic imports + AnimatePresence:
```typescript
import { AnimatePresence, motion } from 'framer-motion';

// OR (if SSR issues arise):
import dynamic from 'next/dynamic';
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

// Use in JSX:
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### Status Badge Usage
**Source:** `src/frontend/src/components/ClockLogStatusBadge.tsx` lines 1–34

**Apply to:** `DailyRow.tsx` — simple pass-through:
```typescript
<ClockLogStatusBadge status={log.original.status} />
```

No new patterns needed; reuse existing constants (`STATUS_COLORS`, `STATUS_LABELS`) from badge or from `clockLogPresenter.ts`.

### HTTP Service Pattern
**Source:** `src/frontend/src/services/http.ts` lines 1–5 (imports) + lines 150–158 (raw response handling)

**Apply to:** `effectiveMarksService.ts`:
```typescript
// For paginated endpoint with full response shape (data + pagination metadata):
const raw = await http.raw(`/clock-logs/effective?${searchParams.toString()}`, { method: 'GET' });
if (!raw.ok) return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
try {
  const json = await raw.json();
  return json ?? { success: true, data: [], total: 0, page: 1, pageSize: 20 };
} catch {
  return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
}
```

---

## No Analog Found

**None.** All files have clear analogs or are extensions of existing patterns.

---

## Metadata

**Analog search scope:** `src/frontend/src/hooks/`, `src/frontend/src/services/`, `src/frontend/src/components/`, `src/frontend/src/app/pages/clock-logs/`

**Files scanned:** 22 existing hooks, services, components, and pages

**Pattern extraction date:** 2026-04-14

**Key dependencies:**
- `/c/Users/Administrador/Desktop/U-Local/Vp-Planilla/src/frontend/src/services/http.ts` (all service methods delegate here)
- `/c/Users/Administrador/Desktop/U-Local/Vp-Planilla/src/frontend/src/features/clock-logs/presenters/clockLogPresenter.ts` (date conversion, status colors)
- `react-hook-form` + `framer-motion` (for advanced components)
- `@/` alias pattern (all imports use absolute paths via alias)
