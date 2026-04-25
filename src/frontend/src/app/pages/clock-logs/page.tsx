'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDownIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useEffectiveMarks } from '@/hooks/useEffectiveMarks';
import { useClockAudit } from '@/hooks/useClockAudit';
import { useTimeWindows } from '@/hooks/useTimeWindows';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import BranchGroup from '@/components/BranchGroup';
import EmployeeCard from '@/components/EmployeeCard';
import DatePicker from '@/components/DatePicker';
import { AuditDayRow } from '@/components/AuditDayRow';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import AddClockLogModal from '@/components/AddClockLogModal';
import EditClockLogModal from '@/components/EditClockLogModal';
import VoidClockLogModal from '@/components/VoidClockLogModal';
import { ClockImportModal } from '@/components/ClockImportModal';
import { ClockLog as AdjustmentClockLog } from '@/services/clockLogAdjustmentService';
import { classifyByTimeWindow } from '@/features/clock-logs/parser/timeWindowClassifier';
import type { TimeWindow } from '@/services/timeWindowService';
import {
  STATUS_OPTIONS,
  STATUS_CARD_COLORS,
  STATUS_NAMES,
  STATUS_TOGGLE_COLORS,
  isoToDisplay,
  parseDisplayToISO,
} from '@/features/clock-logs/presenters/clockLogPresenter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface AuditMark {
  id: number;
  timestamp: string;
  type: 'IN' | 'OUT';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AuditDay {
  date: string;
  marks: AuditMark[];
  calculated_hours: number | null;
}

interface AuditEmployee {
  employee_id: string;
  employee_name: string;
  days: AuditDay[];
  has_issues: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAuditMarksForLog(
  log: EffectiveClockLog,
  windows: TimeWindow[],
  dayMarks: AuditMark[]
): void {
  // Use adjusted time if available, otherwise original
  const effectiveInTime = log.adjusted?.in_time || log.original.in_time;
  const effectiveOutTime = log.adjusted?.out_time || log.original.out_time;

  if (effectiveInTime && log.original.in_log_id != null) {
    const c = classifyByTimeWindow(effectiveInTime, windows);
    dayMarks.push({ 
      id: log.original.in_log_id, 
      timestamp: effectiveInTime, 
      type: 'IN', 
      confidence: c.confidence 
    });
  }
  if (effectiveOutTime && log.original.out_log_id != null) {
    const c = classifyByTimeWindow(effectiveOutTime, windows);
    dayMarks.push({ 
      id: log.original.out_log_id, 
      timestamp: effectiveOutTime, 
      type: 'OUT', 
      confidence: c.confidence 
    });
  }
}

function buildAuditData(
  data: EffectiveClockLog[],
  windows: import('@/services/timeWindowService').TimeWindow[]
): AuditEmployee[] {
  const empMap = new Map<string, { name: string; dayMap: Map<string, AuditMark[]>; logs: EffectiveClockLog[] }>();

  data.forEach((log) => {
    if (!empMap.has(log.employee_id)) {
      empMap.set(log.employee_id, { name: log.employee_name, dayMap: new Map(), logs: [] });
    }
    const emp = empMap.get(log.employee_id)!;
    emp.logs.push(log);
    if (!emp.dayMap.has(log.log_date)) emp.dayMap.set(log.log_date, []);
    buildAuditMarksForLog(log, windows, emp.dayMap.get(log.log_date)!);
  });

  const result: AuditEmployee[] = [];
  empMap.forEach((empData, empId) => {
    const days: AuditDay[] = [];
    empData.dayMap.forEach((marks, date) => {
      const calculatedHours = empData.logs
        .filter((l) => l.log_date === date)
        .reduce((sum, l) => sum + (l.calculated_hours ?? 0), 0);
      days.push({ date, marks, calculated_hours: calculatedHours });
    });
    days.sort((a, b) => a.date.localeCompare(b.date));
    const has_issues =
      days.some((d) => d.marks.some((m) => m.confidence !== 'HIGH')) ||
      empData.logs.some((l) => l.original.status !== 'valid');
    result.push({ employee_id: empId, employee_name: empData.name, days, has_issues });
  });

  result.sort((a, b) => {
    if (a.has_issues !== b.has_issues) return a.has_issues ? -1 : 1;
    return a.employee_name.localeCompare(b.employee_name, 'es');
  });
  return result;
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

/**
 * Build an AdjustmentClockLog from an EffectiveClockLog entry.
 * Uses in_log_id/in_time for IN marks; falls back to out_log_id/out_time for OUT-only orphans.
 */
function toAdjustmentClockLog(entry: EffectiveClockLog): AdjustmentClockLog {
  const hasIn = entry.original.in_log_id != null;
  const logId = hasIn ? entry.original.in_log_id! : (entry.original.out_log_id ?? 0);
  const logType: 'IN' | 'OUT' = hasIn ? 'IN' : 'OUT';
  const logTimestamp = (hasIn ? entry.original.in_time : entry.original.out_time)
    ?? (entry.log_date + 'T00:00:00');

  return {
    id: String(logId),
    employeeId: entry.employee_id,
    timestamp: logTimestamp,
    type: logType,
    source: entry.original.source as 'DEVICE' | 'MANUAL',
    createdAt: '',
    createdBy: '',
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type PageTab = 'dashboard' | 'audit';

// eslint-disable-next-line sonarjs/cognitive-complexity
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

  const { 
    confirmDay, 
    fetchConfirmations, 
    confirmedDays,
    addMarkInline,
    changeMarkTypeInline,
    voidMarkInline
  } = useClockAudit(refresh);
  const { windows: timeWindows } = useTimeWindows();

  const [activeTab, setActiveTab] = useState<PageTab>('dashboard');

  // Load confirmations when date range changes
  useEffect(() => {
    fetchConfirmations(filters.initDate, filters.endDate);
  }, [filters.initDate, filters.endDate, fetchConfirmations]);
  const [modalOpen, setModalOpen] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);  // D-12: collapsed by default
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const toggleEmployee = useCallback((id: string) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Correction modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeForAdd, setSelectedEmployeeForAdd] = useState<{id: string; name: string} | null>(null);
  const [initialDateForAdd, setInitialDateForAdd] = useState<string | undefined>(undefined);
  const [initialTypeForAdd, setInitialTypeForAdd] = useState<'IN' | 'OUT' | undefined>(undefined);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<AdjustmentClockLog | null>(null);
  const [selectedEntryForVoid, setSelectedEntryForVoid] = useState<AdjustmentClockLog | null>(null);

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

  // Build audit view data — group EffectiveClockLog[] by employee then by day
  const auditEmployees = useCallback(
    () => buildAuditData(data, timeWindows),
    [data, timeWindows]
  );

  const groupedBranches = groupDataByBranch(data);

  const statsMap = data.reduce<Record<string, number>>((acc, log) => {
    const s = log.original.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const displayedAuditEmployees = showOnlyIssues
    ? auditEmployees().filter((e) => e.has_issues)
    : auditEmployees();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">

        {/* B. Page header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Marcas / Dashboard</p>
            <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Panel de Control de Marcas</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Revise y corrija marcas de reloj antes de calcular planilla. Grupos por sucursal, empleado y día.
            </p>
          </div>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm mb-1">
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Importar marcas (.xlsx, .csv)
          </button>
        </div>

        {/* TAB BAR */}
        <div className="flex gap-1 mb-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Auditoría por Jornada
          </button>
        </div>

        {/* C. Date range controls — shared across both tabs */}
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

        {/* G. Error banner */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">Error al cargar las marcas. {error}</p>
            <button onClick={refresh} className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline mt-2">Reintentar</button>
          </div>
        )}

        {/* ================================================================
            TAB: DASHBOARD (existing view)
        ================================================================ */}
        {activeTab === 'dashboard' && (
          <>
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

            {/* F. ImportSessionsPanel — collapsed by default */}
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
                          setSelectedEntryForEdit(toAdjustmentClockLog(entry));
                        }}
                        onVoidEntry={(entry) => {
                          setSelectedEntryForVoid(toAdjustmentClockLog(entry));
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
          </>
        )}

        {/* ================================================================
            TAB: AUDIT VIEW (Phase 46 — D-08, D-09, D-10, D-11)
        ================================================================ */}
        {activeTab === 'audit' && (
          <>
            {/* Audit filters bar — D-09 */}
            <div className="flex flex-wrap items-center gap-4 mb-5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Filtros:</span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span
                  role="checkbox"
                  aria-checked={showOnlyIssues}
                  tabIndex={0}
                  onClick={() => setShowOnlyIssues((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' && setShowOnlyIssues((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center ${showOnlyIssues ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${showOnlyIssues ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Solo con problemas</span>
              </label>
              <span className="text-xs text-zinc-400 ml-auto">
                {displayedAuditEmployees.length} empleado{displayedAuditEmployees.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Audit content */}
            {isLoading && data.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : displayedAuditEmployees.length === 0 ? (
              <div className="p-12 text-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900">
                <p className="text-base font-semibold text-zinc-600 dark:text-zinc-400">
                  {showOnlyIssues ? 'No hay empleados con problemas en este período' : 'No hay marcas en este período'}
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                  {showOnlyIssues
                    ? 'Todas las marcas tienen confianza alta y estado válido.'
                    : 'Importe marcas o ajuste el rango de fechas.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedAuditEmployees.map((emp) => {
                  const isExpanded = expandedEmployees.has(emp.employee_id);
                  return (
                    <div
                      key={emp.employee_id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
                    >
                      {/* Employee header — collapsible */}
                      <button
                        onClick={() => toggleEmployee(emp.employee_id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          {emp.has_issues && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Tiene marcas con problemas" />
                          )}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">
                            {emp.employee_name}
                          </span>
                          <span className="text-xs text-zinc-400">#{emp.employee_id}</span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {emp.days.length} día{emp.days.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Days — D-08: Empleado → Día → Marcas */}
                      {isExpanded && (
                        <div className="p-3 space-y-1 border-t border-zinc-100 dark:border-zinc-800">
                          {emp.days.map((day) => (
                            <AuditDayRow
                              key={day.date}
                              employeeId={emp.employee_id}
                              date={day.date}
                              marks={day.marks}
                              isConfirmed={confirmedDays.has(`${emp.employee_id}_${day.date}`)}
                              calculatedHours={day.calculated_hours}
                              onConfirm={() => confirmDay(Number(emp.employee_id), day.date)}
                              onAddInline={(time, type) => addMarkInline(emp.employee_id, day.date, time, type)}
                              onChangeTypeInline={(eid, logId, ts, type) => changeMarkTypeInline(eid, logId, ts, type)}
                              onVoidInline={(eid, logId, type) => voidMarkInline(eid, logId, type)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Correction Modals */}
      <AddClockLogModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployeeForAdd(null);
          setInitialDateForAdd(undefined);
          setInitialTypeForAdd(undefined);
        }}
        employeeId={selectedEmployeeForAdd?.id}
        employeeName={selectedEmployeeForAdd?.name}
        initialDate={initialDateForAdd}
        initialType={initialTypeForAdd}
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

      <ClockImportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
