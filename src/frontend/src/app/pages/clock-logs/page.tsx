'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import BranchGroup from '@/components/BranchGroup';
import EmployeeCard from '@/components/EmployeeCard';
import DatePicker from '@/components/DatePicker';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import AddClockLogModal from '@/components/AddClockLogModal';
import EditClockLogModal from '@/components/EditClockLogModal';
import VoidClockLogModal from '@/components/VoidClockLogModal';
import { ClockLog } from '@/services/clockLogsService';
import {
  STATUS_OPTIONS,
  STATUS_CARD_COLORS,
  STATUS_NAMES,
  STATUS_TOGGLE_COLORS,
  isoToDisplay,
  parseDisplayToISO,
} from '@/features/clock-logs/presenters/clockLogPresenter';

interface EmployeeGroup {
  employee_id: string;
  employee_name: string;
  logs: EffectiveClockLog[];
  total_hours: number;
  worked_days: number;
  anomaly_count: number;
}

interface BranchData {
  name: string;
  employees: EmployeeGroup[];
}

function groupDataByBranch(logs: EffectiveClockLog[]): BranchData[] {
  const branchMap = new Map<string, Map<string, EffectiveClockLog[]>>();

  logs.forEach((log) => {
    const branch = log.branch_name || 'Sin sucursal';
    const emp = log.employee_id;
    if (!branchMap.has(branch)) branchMap.set(branch, new Map());
    const empMap = branchMap.get(branch)!;
    if (!empMap.has(emp)) empMap.set(emp, []);
    empMap.get(emp)!.push(log);
  });

  const branches: BranchData[] = Array.from(branchMap.entries()).map(([branchName, empMap]) => {
    const employees: EmployeeGroup[] = Array.from(empMap.entries()).map(([empId, empLogs]) => {
      const anomalyCount = empLogs.filter(
        (l) => l.original.status !== 'valid'
      ).length;
      const totalHours = empLogs.reduce((sum, l) => sum + (l.calculated_hours ?? 0), 0);
      const workedDays = new Set(empLogs.map((l) => l.log_date)).size;
      return {
        employee_id: empId,
        employee_name: empLogs[0]?.employee_name ?? `Empleado ${empId}`,
        logs: empLogs,
        total_hours: totalHours,
        worked_days: workedDays,
        anomaly_count: anomalyCount,
      };
    });

    // Sort: anomaly count DESC, then name ASC (D-03)
    employees.sort((a, b) => {
      if (b.anomaly_count !== a.anomaly_count) return b.anomaly_count - a.anomaly_count;
      return a.employee_name.localeCompare(b.employee_name, 'es');
    });

    return { name: branchName, employees };
  });

  branches.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return branches;
}

export default function ClockLogsDashboardPage() {
  const {
    data,
    totalCount,
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
  } = useEffectiveMarks();

  const [showImportPanel, setShowImportPanel] = useState(false);  // D-12: collapsed by default
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Correction modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeForAdd, setSelectedEmployeeForAdd] = useState<{id: string; name: string} | null>(null);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<ClockLog | null>(null);
  const [selectedEntryForVoid, setSelectedEntryForVoid] = useState<ClockLog | null>(null);

  // IntersectionObserver for infinite scroll (D-05)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const toggleStatus = useCallback(
    (status: string) => {
      const current = filters.status ?? [];
      setFilters({
        status: current.includes(status)
          ? current.filter((s) => s !== status)
          : [...current, status],
      });
    },
    [filters.status, setFilters]
  );

  const groupedBranches = groupDataByBranch(data);

  const statsMap = data.reduce<Record<string, number>>((acc, log) => {
    const s = log.original.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* B. Page header (UX-03 — contextual guide subtitle) */}
        <div className="mb-6">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Marcas / Dashboard</p>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Panel de Control de Marcas</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Revise y corrija marcas de reloj antes de calcular planilla. Grupos por sucursal, empleado y día.
          </p>
        </div>

        {/* C. Biweekly preset buttons + date range (D-01) */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          {(['first_half', 'second_half', 'this_month'] as const).map((preset) => {
            const labels = {
              first_half: '1ra Quincena (1-15)',
              second_half: '2da Quincena (16-31)',
              this_month: 'Mes Actual',
            };
            return (
              <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                {labels[preset]}
              </button>
            );
          })}
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Desde</label>
            <DatePicker
              value={isoToDisplay(filters.initDate)}
              onChange={(display) => { const iso = parseDisplayToISO(display); if (iso) setFilters({ initDate: iso }); }}
              placeholder="dd/mm/yy"
              className="w-[120px] border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Hasta</label>
            <DatePicker
              value={isoToDisplay(filters.endDate)}
              onChange={(display) => { const iso = parseDisplayToISO(display); if (iso) setFilters({ endDate: iso }); }}
              placeholder="dd/mm/yy"
              className="w-[120px] border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        {/* D. Status filter toggles */}
        <div className="flex flex-wrap gap-3 items-center mb-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Estado:</span>
          {STATUS_OPTIONS.map((status) => {
            const isActive = (filters.status ?? []).includes(status);
            const colors = STATUS_TOGGLE_COLORS[status];
            return (
              <button key={status} onClick={() => toggleStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${isActive ? colors.active : colors.inactive}`}>
                {STATUS_NAMES[status]}
              </button>
            );
          })}
        </div>

        {/* E. Summary stats bar */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STATUS_OPTIONS.filter((s) => (statsMap[s] ?? 0) > 0).map((status) => {
              const colors = STATUS_CARD_COLORS[status];
              return (
                <div key={status} className={`rounded-lg border border-l-4 p-3 ${colors.bg} ${colors.border} border-zinc-200 dark:border-zinc-700`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${colors.text}`}>{STATUS_NAMES[status]}</p>
                  <p className={`text-xl font-bold ${colors.count}`}>{statsMap[status]}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* F. ImportSessionsPanel — collapsed by default (D-12) */}
        <div className="mb-4">
          <button
            onClick={() => setShowImportPanel((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-2"
            aria-expanded={showImportPanel}
          >
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${showImportPanel ? 'rotate-180' : ''}`} />
            Sesiones de Importación
          </button>
          {showImportPanel && (
            <ImportSessionsPanel sessions={importSessions} isLoading={isLoading} />
          )}
        </div>

        {/* G. Error banner */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">Error al cargar las marcas. {error}</p>
            <button onClick={refresh} className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline mt-2">Reintentar</button>
          </div>
        )}

        {/* H. Main content — loading / empty / grouped list */}
        {isLoading && data.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : !isLoading && data.length === 0 ? (
          <div className="p-12 text-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-600 dark:text-zinc-400">No hay marcas en este período</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-md mx-auto">
              Ajuste el rango de fechas o los filtros para ver datos. Si no hay marcas, verifique que se hayan importado sesiones.
            </p>
            <button
              onClick={() => setShowImportPanel(true)}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
            >
              Ver importaciones
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedBranches.map((branch) => (
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
                    onAddMark={(id, name) => {
                      setSelectedEmployeeForAdd({ id, name });
                      setIsAddModalOpen(true);
                    }}
                    onEditEntry={(entry) => {
                      // Convert EffectiveClockLog to ClockLog
                      const clockLog: ClockLog = {
                        id: String(entry.original.id),
                        employeeId: entry.employee_id,
                        timestamp: entry.original.timestamp || entry.log_date + 'T00:00:00',
                        type: entry.original.type as 'IN' | 'OUT',
                        source: entry.original.source as 'DEVICE' | 'MANUAL',
                        createdAt: entry.original.created_at || '',
                        createdBy: '',
                      };
                      setSelectedEntryForEdit(clockLog);
                    }}
                    onVoidEntry={(entry) => {
                      // Convert EffectiveClockLog to ClockLog
                      const clockLog: ClockLog = {
                        id: String(entry.original.id),
                        employeeId: entry.employee_id,
                        timestamp: entry.original.timestamp || entry.log_date + 'T00:00:00',
                        type: entry.original.type as 'IN' | 'OUT',
                        source: entry.original.source as 'DEVICE' | 'MANUAL',
                        createdAt: entry.original.created_at || '',
                        createdBy: '',
                      };
                      setSelectedEntryForVoid(clockLog);
                    }}
                  />
                ))}
              </BranchGroup>
            ))}
          </div>
        )}

        {/* I. Infinite scroll sentinel + loading-more indicator */}
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />

        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="w-4 h-4 border-2 border-zinc-300 border-t-green-600 rounded-full animate-spin" />
            Cargando más marcas...
          </div>
        )}

        {!hasMore && data.length > 0 && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 py-4">
            {totalCount} marcas cargadas — fin de la lista
          </p>
        )}

      </div>

      {/* Correction Modals */}
      <AddClockLogModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployeeForAdd(null);
        }}
        employeeId={selectedEmployeeForAdd?.id}
        employeeName={selectedEmployeeForAdd?.name}
        onSuccess={() => refresh()}
      />

      <EditClockLogModal
        isOpen={!!selectedEntryForEdit}
        onClose={() => setSelectedEntryForEdit(null)}
        clockLog={selectedEntryForEdit}
        onSuccess={() => refresh()}
      />

      <VoidClockLogModal
        isOpen={!!selectedEntryForVoid}
        onClose={() => setSelectedEntryForVoid(null)}
        clockLog={selectedEntryForVoid}
        onConfirm={() => refresh()}
      />
    </div>
  );
}
