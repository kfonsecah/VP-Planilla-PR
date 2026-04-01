"use client";

import React, { useState } from 'react';
import { useModal } from '@/hooks/useModal';
import { ClockLogsService, AttendanceSummary, ClockLog } from '@/services/clockLogsService';
import {
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';

export default function AttendancePage() {
  const modal = useModal();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingLog, setEditingLog] = useState<ClockLog | null>(null);

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }

    setIsLoading(true);
    try {
      const res = await ClockLogsService.getAttendanceSummary(startDate, endDate);
      setData(res);
      modal.showSuccess('Registros cargados', `Se encontraron ${res.length} registros de asistencia`);
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al obtener registros');
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

  const handleEditLog = (log: ClockLog) => {
    setEditingLog({
      ...log,
      timestamp: new Date(log.timestamp).toISOString().slice(0, 16)
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      await ClockLogsService.updateClockLog(editingLog.id, {
        timestamp: editingLog.timestamp,
        log_type: editingLog.log_type,
        remarks: editingLog.remarks
      });
      modal.showSuccess('Actualizado', 'Marca actualizada correctamente');
      setEditingLog(null);
      await handleFetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al actualizar marca');
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] dark:from-[#121212] via-[#F9F1DC] dark:via-[#1a1a1a] to-[#E7DCC1] dark:to-[#121212]">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ClockIcon className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Registro de Asistencia</h1>
                <p className="text-[#E7DCC1] dark:text-zinc-200">
                  Gestiona las marcas de entrada y salida de los empleados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-white">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-600 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-white">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-600 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
              />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button
                onClick={handleFetch}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-md disabled:opacity-50"
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
                className="px-6 py-2.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 rounded-xl transition-all font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de asistencia */}
        {data.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-700 dark:text-white">Registros de Asistencia</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <UserGroupIcon className="w-5 h-5" />
                  <span className="font-semibold">{data.length} registros</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D6B7] dark:divide-zinc-700">
                  {data.map((entry, idx) => {
                    const key = `${entry.employee_id}_${entry.date}`;
                    const isExpanded = expandedRows.has(key);
                    const balance = entry.hours_worked - 8;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => toggleRow(key)}
                          className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#2a2a2a] transition-colors ${
                            idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-green-700" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-green-700" />
                              )}
                              <span className="text-sm font-medium text-zinc-700 dark:text-white">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700 dark:text-white">
                              {entry.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Mañana 8h
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-zinc-700 dark:text-white">
                              {formatTime(entry.check_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-zinc-700 dark:text-white">
                              {formatTime(entry.check_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-green-700">
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
                                  ⚠️ {entry.inconsistencies.length}
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
                                <h4 className="text-sm font-bold text-zinc-700 dark:text-white mb-4">
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
                                      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:shadow-md transition-shadow"
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
                                          <PencilIcon className="w-4 h-4 text-green-700" />
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Hora</p>
                                          <p className="text-sm font-bold text-zinc-700 dark:text-white">
                                            {new Date(log.timestamp).toLocaleTimeString('es-CR')}
                                          </p>
                                        </div>
                                        {log.remarks && (
                                          <div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Observaciones</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-300">{log.remarks}</p>
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] dark:from-[#2a2a2a] dark:to-[#3a3a3a] rounded-2xl flex items-center justify-center shadow-lg">
                <ClockIcon className="w-12 h-12 text-green-700" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-zinc-700 dark:text-white mb-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Editar Marca</h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-white/80 hover:text-white transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-white">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={editingLog.timestamp}
                  onChange={(e) => setEditingLog({ ...editingLog, timestamp: e.target.value })}
                  className="w-full border border-zinc-200 dark:border-zinc-600 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-white">
                  Tipo de Marca
                </label>
                <Select
                  value={editingLog.log_type}
                  onValueChange={(value) => setEditingLog({ ...editingLog, log_type: value })}
                  className="border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                >
                  <SelectItem value="IN">Entrada (IN)</SelectItem>
                  <SelectItem value="OUT">Salida (OUT)</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-white">
                  Observaciones
                </label>
                <textarea
                  value={editingLog.remarks || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, remarks: e.target.value })}
                  className="w-full border border-zinc-200 dark:border-zinc-600 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                  rows={3}
                  placeholder="Ajuste manual, corrección de error, etc."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setEditingLog(null)}
                  className="flex-1 px-5 py-2.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-md"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <modal.ModalComponent />
    </div>
  );
}
