"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ClockLogsService, AttendanceSummary, ClockLog } from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';
import {
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';

const CR_TIMEZONE = 'America/Costa_Rica';

export default function AttendancePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingLog, setEditingLog] = useState<ClockLog | null>(null);
  const [employees, setEmployees] = useState<{ id: number | string; name: string }[]>([]);

  useEffect(() => {
    getEmployees()
      .then(emps => {
        setEmployees((emps as unknown as Array<Record<string, unknown>>).map(e => ({
          id: e.id as number | string,
          name: String(e.name || '')
        })));
      })
      .catch(() => {});
  }, []);

  const processLogs = (logs: ClockLog[], empList: { id: number | string; name: string }[]): AttendanceSummary[] => {
    const grouped: Record<string, AttendanceSummary> = {};

    for (const log of logs) {
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: CR_TIMEZONE }).format(new Date(log.timestamp));
      const empId = log.employee_id ?? 'unknown';
      const key = `${empId}_${date}`;
      const emp = empList.find(e => String(e.id) === String(empId));
      const empName = emp?.name || (empId !== 'unknown' ? `Empleado #${empId}` : 'Empleado sin identificar');

      if (!grouped[key]) {
        grouped[key] = { employee_id: empId, employee_name: empName, date, logs: [], hours_worked: 0, check_in: null, check_out: null, inconsistencies: [] };
      }
      grouped[key].logs.push(log);
    }

    return Object.values(grouped).map(entry => {
      const sorted = [...entry.logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const firstIn = sorted.find(l => l.log_type === 'IN');
      const lastOut = [...sorted].reverse().find(l => l.log_type === 'OUT');
      const checkIn = firstIn?.timestamp ?? null;
      const checkOut = lastOut?.timestamp ?? null;
      const hoursWorked = checkIn && checkOut
        ? (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3_600_000
        : 0;
      const inCount = sorted.filter(l => l.log_type === 'IN').length;
      const outCount = sorted.filter(l => l.log_type === 'OUT').length;
      const inconsistencies: string[] = [];
      if (!firstIn) inconsistencies.push('Sin entrada registrada');
      if (!lastOut) inconsistencies.push('Sin salida registrada');
      if (inCount !== outCount) inconsistencies.push(`Marcas desbalanceadas: ${inCount} entradas, ${outCount} salidas`);
      return { ...entry, logs: sorted, check_in: checkIn, check_out: checkOut, hours_worked: hoursWorked, inconsistencies };
    }).sort((a, b) => a.date.localeCompare(b.date) || a.employee_name.localeCompare(b.employee_name));
  };

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecciona fecha de inicio y fin');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let currentEmployees = employees;
      if (currentEmployees.length === 0) {
        const emps = (await getEmployees()) as unknown as Array<Record<string, unknown>>;
        currentEmployees = emps.map(e => ({ id: e.id as number | string, name: String(e.name || '') }));
        setEmployees(currentEmployees);
      }
      const logs = await ClockLogsService.getClockLogs(startDate, endDate);
      const processed = processLogs(logs, currentEmployees);
      setData(processed);
      toast.success(`Se encontraron ${processed.length} registros de asistencia`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al obtener registros');
      toast.error(err instanceof Error ? err.message : 'Error al obtener registros');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  // Convert UTC ISO → "YYYY-MM-DDTHH:MM" in Costa Rica time (for datetime-local input)
  const toLocalInputValue = (isoString: string): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CR_TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    }).formatToParts(new Date(isoString));
    const p: Record<string, string> = {};
    parts.forEach(({ type, value }) => { p[type] = value; });
    const h = p.hour === '24' ? '00' : p.hour;
    return `${p.year}-${p.month}-${p.day}T${h}:${p.minute}`;
  };

  // Convert "YYYY-MM-DDTHH:MM" in CR time → UTC ISO string (Costa Rica is always UTC-6)
  const crLocalToUTC = (localString: string): string => {
    const [date, time] = localString.split('T');
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h + 6, mi)).toISOString();
  };

  const handleEditLog = (log: ClockLog) => {
    setEditingLog({
      ...log,
      timestamp: toLocalInputValue(log.timestamp)
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      await ClockLogsService.updateClockLog(editingLog.id, {
        timestamp: crLocalToUTC(editingLog.timestamp),
        log_type: editingLog.log_type,
        remarks: editingLog.remarks
      });
      toast.success('Marca actualizada correctamente');
      setEditingLog(null);
      await handleFetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar marca');
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: CR_TIMEZONE
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: CR_TIMEZONE
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}hr`;
  };

  const getBalanceColor = (hours: number) => {
    if (hours >= 8) return 'text-green-600 dark:text-green-400';
    if (hours >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBalanceIcon = (inconsistencies: string[]) => {
    if (inconsistencies.length === 0) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">
            Asistencia / Registros
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Registro de Asistencia</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Gestiona las marcas de entrada y salida de los empleados
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3 text-red-500 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al obtener registros</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={handleFetch}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button
                onClick={handleFetch}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-5 h-5" />
                    Consultar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setData([]);
                }}
                className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Loading state - skeleton table */}
        {isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Empleado</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Horario</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Entrada</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Salida</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-14 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de asistencia */}
        {data.length > 0 && !isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Registros de Asistencia</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <UserGroupIcon className="w-5 h-5" />
                  <span className="font-semibold">{data.length} registros</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data.map((entry, idx) => {
                    const key = `${entry.employee_id}_${entry.date}`;
                    const isExpanded = expandedRows.has(key);
                    const balance = entry.hours_worked - 8;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => toggleRow(key)}
                          className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                            idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-green-600" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-green-600" />
                              )}
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              {entry.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Mañana 8h
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              {formatTime(entry.check_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              {formatTime(entry.check_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-green-600">
                              {formatHours(entry.hours_worked)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {getBalanceIcon(entry.inconsistencies)}
                              <span className={`text-sm font-bold ${getBalanceColor(entry.hours_worked)}`}>
                                {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                              </span>
                              {entry.inconsistencies.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                                  <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
                                  {entry.inconsistencies.length}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida con detalles de marcas */}
                        {isExpanded && (
                          <tr className="bg-zinc-50 dark:bg-zinc-800">
                            <td colSpan={7} className="px-6 py-6">
                              <div className="pl-7">
                                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">
                                  Detalle de marcas del día
                                </h4>

                                {entry.inconsistencies.length > 0 && (
                                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 rounded-lg">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                                      Inconsistencias detectadas:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                                      {entry.inconsistencies.map((inc, i) => (
                                        <li key={i}>{inc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {entry.logs.map((log: ClockLog, logIdx: number) => (
                                    <div
                                      key={log.id}
                                      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            log.log_type === 'IN' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                                          }`}>
                                            <span className={`text-xs font-bold ${
                                              log.log_type === 'IN' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                            }`}>
                                              {log.log_type}
                                            </span>
                                          </div>
                                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                            Marca #{logIdx + 1}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditLog(log);
                                          }}
                                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                        >
                                          <PencilIcon className="w-4 h-4 text-green-600" />
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Hora</p>
                                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                            {new Date(log.timestamp).toLocaleTimeString('es-CR', { timeZone: CR_TIMEZONE })}
                                          </p>
                                        </div>
                                        {log.remarks && (
                                          <div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Observaciones</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{log.remarks}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {data.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
              No hay registros de asistencia
            </h3>
            <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Selecciona un rango de fechas para consultar los registros de marcación de los empleados
            </p>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Editar Marca</h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={editingLog.timestamp}
                  onChange={(e) => setEditingLog({ ...editingLog, timestamp: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                  Tipo de Marca
                </label>
                <Select
                  value={editingLog.log_type}
                  onValueChange={(value) => setEditingLog({ ...editingLog, log_type: value })}
                  className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  <SelectItem value="IN">Entrada (IN)</SelectItem>
                  <SelectItem value="OUT">Salida (OUT)</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                  Observaciones
                </label>
                <textarea
                  value={editingLog.remarks || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, remarks: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  rows={3}
                  placeholder="Ajuste manual, corrección de error, etc."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setEditingLog(null)}
                  className="flex-1 px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
