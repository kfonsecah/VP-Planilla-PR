'use client';

import React, { useState, useMemo } from 'react';
import { useClockLogs } from '@/hooks/useClockLogs';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';
import ImportSessionsPanel from '@/components/ImportSessionsPanel';
import ClockLogDetailModal from '@/components/ClockLogDetailModal';
import { ClockLogPaginated } from '@/services/clockLogsService';
import DatePicker from '@/components/DatePicker';

const SOURCE_LABELS: Record<string, string> = {
  java_import: 'Java',
  excel_import: 'Excel',
  manual: 'Manual',
};

const STATUS_OPTIONS = ['pending', 'valid', 'anomaly', 'orphan', 'corrected'] as const;

const STATUS_CARD_COLORS: Record<string, { border: string; bg: string; text: string; count: string }> = {
  pending: {
    border: 'border-l-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    text: 'text-gray-600 dark:text-gray-400',
    count: 'text-gray-800 dark:text-gray-200',
  },
  valid: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    count: 'text-green-800 dark:text-green-200',
  },
  anomaly: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    count: 'text-amber-800 dark:text-amber-200',
  },
  orphan: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    count: 'text-red-800 dark:text-red-200',
  },
  corrected: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    count: 'text-blue-800 dark:text-blue-200',
  },
};

const STATUS_NAMES: Record<string, string> = {
  pending: 'Pendiente',
  valid: 'Valida',
  anomaly: 'Anomalia',
  orphan: 'Huerfana',
  corrected: 'Corregida',
};

const STATUS_TOGGLE_COLORS: Record<string, { active: string; inactive: string }> = {
  pending: {
    active: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-400',
    inactive: 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700',
  },
  valid: {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  anomaly: {
    active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  orphan: {
    active: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  corrected: {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
};

// Helpers para conversión de fechas ISO (backend) <-> display dd/mm/yy (DatePicker)
const isoToDisplay = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const parseDisplayToISO = (display: string): string => {
  if (!display || display.length < 8) return '';
  const [day, month, year] = display.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  const d = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ClockLogsDashboardPage() {
  const {
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
  } = useClockLogs();

  const [selectedLog, setSelectedLog] = useState<ClockLogPaginated | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalLogs);
  const totalPages = Math.ceil(totalLogs / pageSize);

  const toggleStatus = (status: string) => {
    const current = filters.status;
    if (current.includes(status)) {
      setFilters({ status: current.filter((s) => s !== status) });
    } else {
      setFilters({ status: [...current, status] });
    }
  };

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmployeeSearch(value);
    const match = employees.find(
      (emp) => emp.name.toLowerCase() === value.toLowerCase()
    );
    setFilters({ employee_id: match ? match.id : undefined });
  };

  const clearEmployeeFilter = () => {
    setEmployeeSearch('');
    setFilters({ employee_id: undefined });
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">

        {/* A. Page header */}
        <div className="mb-6">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
            Marcas / Dashboard
          </p>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Dashboard de Marcas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Monitoreo centralizado de marcas de reloj: estados, anomalias, huerfanas e importaciones
          </p>
        </div>

        {/* B. Date preset buttons + date range inputs */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <button
            onClick={() => applyDatePreset('today')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Hoy
          </button>
          <button
            onClick={() => applyDatePreset('last7days')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Ultimos 7 dias
          </button>
          <button
            onClick={() => applyDatePreset('thisMonth')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Este mes
          </button>
          <button
            onClick={() => applyDatePreset('threeMonths')}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
          >
            Ultimos 3 meses
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

        {/* C. Summary stats cards */}
        {isStatsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {STATUS_OPTIONS.map((status) => {
              const count = stats?.byStatus?.[status] ?? 0;
              if (count === 0) return null;
              const colors = STATUS_CARD_COLORS[status];
              return (
                <div
                  key={status}
                  className={`rounded-lg border border-l-4 p-4 ${colors.bg} ${colors.border} border-zinc-200 dark:border-zinc-700`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text}`}>
                    {STATUS_NAMES[status]}
                  </p>
                  <p className={`text-2xl font-bold ${colors.count}`}>{count}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* D. Filters toolbar */}
        <div className="flex flex-wrap gap-3 items-center mb-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          {/* Status multi-select toggles */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mr-1">
              Estado:
            </span>
            {STATUS_OPTIONS.map((status) => {
              const isActive = filters.status.includes(status);
              const colors = STATUS_TOGGLE_COLORS[status];
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isActive ? colors.active : colors.inactive
                  }`}
                >
                  {STATUS_NAMES[status]}
                </button>
              );
            })}
          </div>

          {/* Employee autocomplete */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Empleado:
            </span>
            <div className="relative">
              <input
                type="text"
                list="employees-datalist"
                value={employeeSearch}
                onChange={handleEmployeeSelect}
                placeholder="Buscar empleado..."
                className="border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
              <datalist id="employees-datalist">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name} />
                ))}
              </datalist>
            </div>
            {filters.employee_id && (
              <button
                onClick={clearEmployeeFilter}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* E. Import sessions panel */}
        <ImportSessionsPanel sessions={importSessions} isLoading={isLoading} />

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* F. Clock logs table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {isLoading && logs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando marcas...</p>
            </div>
          ) : !isLoading && logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-base font-semibold text-zinc-600 dark:text-zinc-400">
                No hay marcas para el periodo seleccionado
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                Ajusta el rango de fechas o los filtros de estado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 font-medium">
                        {log.employee_name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-CR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          log.log_type === 'IN'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                        }`}>
                          {log.log_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ClockLogStatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                        {SOURCE_LABELS[log.source] ?? log.source}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            log.status === 'anomaly' || log.status === 'orphan'
                              ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50'
                              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {log.status === 'anomaly' || log.status === 'orphan' ? 'Corregir' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* G. Pagination controls */}
        {totalLogs > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              Mostrando {start}–{end} de {totalLogs} marcas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                Pagina {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        <ClockLogDetailModal
          isOpen={selectedLog !== null}
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onCorrected={() => {
            setSelectedLog(null);
            refresh();
          }}
        />
      </div>
    </div>
  );
}
