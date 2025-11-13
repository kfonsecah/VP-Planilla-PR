"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useModal } from '@/hooks/useModal';
import { ClockLogsService, ClockLog } from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';
import * as XLSX from 'xlsx';
import {
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

type NormalizedLogType = 'CHECK_IN' | 'LUNCH_OUT' | 'LUNCH_IN' | 'CHECK_OUT' | 'EXTRA';

interface NormalizedClockLog extends ClockLog {
  normalized_type: NormalizedLogType;
}

const LOG_SEQUENCE: NormalizedLogType[] = ['CHECK_IN', 'LUNCH_OUT', 'LUNCH_IN', 'CHECK_OUT'];

const LOG_LABELS: Record<NormalizedLogType, string> = {
  CHECK_IN: 'Entrada',
  LUNCH_OUT: 'Salida almuerzo',
  LUNCH_IN: 'Entrada almuerzo',
  CHECK_OUT: 'Salida final',
  EXTRA: 'Extra'
};

const normalizeLogType = (value?: string): NormalizedLogType | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (['in', 'entrada', 'entry', 'start'].includes(normalized)) return 'CHECK_IN';
  if (['out', 'salida', 'exit', 'end', 'salida final', 'fin turno'].includes(normalized)) return 'CHECK_OUT';
  if (
    [
      'almuerzo out',
      'almuerzo',
      'almuerzo_salida',
      'break_out',
      'lunch_out',
      'lunch start',
      'break start',
      'salida almuerzo'
    ].includes(normalized)
  )
    return 'LUNCH_OUT';
  if (
    [
      'almuerzo in',
      'break_in',
      'lunch_in',
      'lunch end',
      'break end',
      'almuerzo_entrada',
      'entrada almuerzo'
    ].includes(normalized)
  )
    return 'LUNCH_IN';
  return null;
};

const normalizeName = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const excelDateToJsDate = (value: any): Date | null => {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
  }

  const asString = String(value).trim();
  if (!asString) return null;

  const timestamp = Date.parse(asString);
  if (!Number.isNaN(timestamp)) return new Date(timestamp);

  return null;
};

const buildDateTimeFromParts = (dateValue: any, timeValue: any): Date | null => {
  const datePart = excelDateToJsDate(dateValue);
  if (!datePart) return null;
  if (timeValue == null || timeValue === '') return datePart;

  if (timeValue instanceof Date) {
    datePart.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), 0);
    return datePart;
  }

  if (typeof timeValue === 'number') {
    const parsed = XLSX.SSF.parse_date_code(timeValue);
    if (!parsed) return datePart;
    datePart.setHours(parsed.H, parsed.M, parsed.S || 0, 0);
    return datePart;
  }

  const timeString = String(timeValue).trim();
  if (!timeString) return datePart;
  const [hours, minutes, seconds] = timeString.split(':').map((chunk) => parseInt(chunk, 10));
  if (!Number.isNaN(hours)) {
    datePart.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, Number.isNaN(seconds) ? 0 : seconds, 0);
    return datePart;
  }

  return datePart;
};

const parseDateInput = (value: string, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((chunk) => parseInt(chunk, 10));
  if (!year || !month || !day) return null;
  if (endOfDay) return Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
};

interface Employee {
  employee_id: number | string;
  employee_first_name: string;
  employee_middle_name: string;
  employee_last_name: string;
}

interface AttendanceData {
  employee_id: number | string;
  employee_name: string;
  date: string;
  logs: NormalizedClockLog[];
  hours_worked: number;
  check_in: Date | null;
  lunch_out: Date | null;
  lunch_in: Date | null;
  check_out: Date | null;
  break_hours: number;
  inconsistencies: string[];
  source: 'excel' | 'api';
}

export default function AttendancePage() {
  const modal = useModal();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<AttendanceData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [uploadedLogs, setUploadedLogs] = useState<ClockLog[]>([]);
  const [uploadSummary, setUploadSummary] = useState<{
    fileName: string;
    totalRows: number;
    validRows: number;
    unmatchedEmployees: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const emps = await getEmployees();
      setEmployees(emps as any);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const findEmployeeByName = (rawName?: string) => {
    if (!rawName) return null;
    const normalized = normalizeName(rawName);
    if (!normalized) return null;
    return (
      employees.find((emp) => normalizeName(`${emp.employee_first_name} ${emp.employee_middle_name} ${emp.employee_last_name}`) === normalized) ||
      employees.find((emp) => normalizeName(`${emp.employee_first_name} ${emp.employee_last_name}`) === normalized)
    );
  };

  const parseExcelMarks = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error('El archivo no contiene hojas válidas');

    const worksheet = workbook.Sheets[firstSheetName];

    const normalizeRows = () => {
      const directRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '', blankrows: false });
      if (directRows.length > 0) return directRows;

      const csvText = XLSX.utils.sheet_to_csv(worksheet);
      if (!csvText.trim()) return [];

      return csvText
        .split(/\r?\n/)
        .map((line) =>
          line
            .split(',')
            .map((cell) => cell.replace(/^"|"$/g, '').trim())
        )
        .filter((row) => row.some((cell) => cell && cell.length > 0));
    };

    const rows = normalizeRows();
    if (!rows.length) {
      return { logs: [], stats: { totalRows: 0, validRows: 0, matchedRows: 0, unmatchedEmployees: 0 } };
    }

    const headerRowIndex = rows.findIndex(
      (row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (headerRowIndex === -1) {
      throw new Error('No se encontraron encabezados en el archivo');
    }

    const rawHeaders = rows[headerRowIndex].map((cell) => String(cell || '').trim());
    const normalizedHeaders = rawHeaders.map((header, idx) => {
      if (!header) return `col_${idx}`;
      return header.toLowerCase().replace(/\s+/g, '_');
    });

    const logs: ClockLog[] = [];
    const unmatched = new Set<string>();
    let matchedRows = 0;

    const getValue = (row: any[], needles: string[]) => {
      for (let colIdx = 0; colIdx < normalizedHeaders.length; colIdx += 1) {
        const header = normalizedHeaders[colIdx];
        for (const needle of needles) {
          if (header.includes(needle)) return row[colIdx];
        }
      }
      return undefined;
    };

    rows.slice(headerRowIndex + 1).forEach((row, index) => {
      if (!Array.isArray(row)) return;

      const nameValue = getValue(row, ['employee', 'empleado', 'colaborador', 'nombre', 'name']);
      const idValue = getValue(row, ['employee_id', 'id', 'codigo', 'identificacion']);
      const timestampValue = getValue(row, ['timestamp', 'marca', 'datetime', 'fecha_hora']);
      const dateValue = getValue(row, ['date', 'fecha', 'dia', 'day']);
      const timeValue = getValue(row, ['time', 'hora', 'hour']);
      const remarksValue = getValue(row, ['remarks', 'observaciones', 'nota']);
      const typeValue = getValue(row, ['type', 'tipo', 'log', 'estado', 'marcatipo', 'tipo_marca']);

      let timestamp: Date | null = null;
      if (timestampValue) {
        timestamp = excelDateToJsDate(timestampValue);
      } else if (dateValue) {
        timestamp = buildDateTimeFromParts(dateValue, timeValue);
      }

      if (!timestamp || Number.isNaN(timestamp.getTime())) {
        return;
      }

      let numericId: number | undefined;
      if (idValue !== undefined && idValue !== '') {
        const parsedId = Number(idValue);
        if (!Number.isNaN(parsedId)) numericId = parsedId;
      }

      const rawName = typeof nameValue === 'string' ? nameValue.trim() : '';
      let matchedEmployeeId = numericId;
      let matchedEmployeeName = rawName;

      if (!matchedEmployeeId && rawName) {
        const match = findEmployeeByName(rawName);
        if (match) {
          matchedEmployeeId = match.employee_id;
          matchedEmployeeName = `${match.employee_first_name} ${match.employee_middle_name} ${match.employee_last_name}`.replace(/\s+/g, ' ').trim();
        }
      }

      if (!matchedEmployeeId) {
        unmatched.add(rawName || `Fila ${headerRowIndex + index + 2}`);
      } else {
        matchedRows += 1;
      }

      logs.push({
        id: logs.length + 1,
        employee_id: matchedEmployeeId ?? null,
        employee_name: matchedEmployeeName || rawName || `Empleado #${matchedEmployeeId}`,
        timestamp: timestamp.toISOString(),
        log_type: typeof typeValue === 'string' && typeValue ? typeValue.toUpperCase() : 'IMPORTED',
        remarks: typeof remarksValue === 'string' ? remarksValue : undefined,
        version: 1
      });
    });

    const totalDataRows = rows.length - (headerRowIndex + 1);

    return {
      logs,
      stats: {
        totalRows: Math.max(totalDataRows, 0),
        validRows: logs.length,
        matchedRows,
        unmatchedEmployees: unmatched.size
      }
    };
  };

  const formatEmployeeName = (emp: Pick<Employee, 'employee_first_name' | 'employee_middle_name' | 'employee_last_name'>) =>
    `${emp.employee_first_name} ${emp.employee_middle_name} ${emp.employee_last_name}`.replace(/\s+/g, ' ').trim();

  const findEmployeeById = (employeeId?: number | string | null): Employee | null => {
    if (employeeId === null || employeeId === undefined) return null;
    const employeeIdStr = String(employeeId);
    return employees.find((e) => String(e.employee_id) === employeeIdStr) || null;
  };

  const resolveEmployeeForLog = (log: ClockLog) => {
    const byId = findEmployeeById(log.employee_id);
    if (byId) {
      return {
        id: byId.employee_id,
        name: formatEmployeeName(byId)
      };
    }

    if (log.employee_name) {
      const byName = findEmployeeByName(log.employee_name);
      if (byName) {
        return {
          id: byName.employee_id,
          name: formatEmployeeName(byName)
        };
      }
    }

    const fallbackId = log.employee_id ?? normalizeName(log.employee_name || `desconocido_${log.id}`);
    const fallbackName =
      log.employee_name ||
      (log.employee_id !== null && log.employee_id !== undefined ? `Empleado #${log.employee_id}` : 'Empleado sin identificar');

    return {
      id: fallbackId,
      name: fallbackName
    };
  };

  const processAttendanceData = (logs: ClockLog[], source: 'excel' | 'api'): AttendanceData[] => {
    const grouped = logs.reduce((acc: Record<string, AttendanceData>, log) => {
      const resolvedEmployee = resolveEmployeeForLog(log);
      const employeeId = resolvedEmployee.id;
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const key = `${employeeId}_${date}`;

      if (!acc[key]) {
        acc[key] = {
          employee_id: employeeId,
          employee_name: resolvedEmployee.name,
          date,
          logs: [],
          hours_worked: 0,
          check_in: null,
          lunch_out: null,
          lunch_in: null,
          check_out: null,
          break_hours: 0,
          inconsistencies: [],
          source
        };
      }

      acc[key].logs.push(log as NormalizedClockLog);
      return acc;
    }, {});

    Object.values(grouped).forEach((entry) => {
      const sortedLogs = [...entry.logs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const normalizedLogs = sortedLogs.map((log, idx) => {
        const normalized_type = normalizeLogType(log.log_type) ?? LOG_SEQUENCE[idx] ?? 'EXTRA';
        return { ...log, normalized_type };
      });

      entry.logs = normalizedLogs;

      const getLogDate = (type: NormalizedLogType) => {
        const found = normalizedLogs.find((log) => log.normalized_type === type);
        return found ? new Date(found.timestamp) : null;
      };

      const checkIn = getLogDate('CHECK_IN');
      const lunchOut = getLogDate('LUNCH_OUT');
      const lunchIn = getLogDate('LUNCH_IN');
      const checkOut = getLogDate('CHECK_OUT');

      entry.check_in = checkIn;
      entry.lunch_out = lunchOut;
      entry.lunch_in = lunchIn;
      entry.check_out = checkOut;

      let hoursWorked = 0;
      let breakHours = 0;

      if (checkIn && checkOut) {
        hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      if (lunchOut && lunchIn) {
        breakHours = Math.max(0, (lunchIn.getTime() - lunchOut.getTime()) / (1000 * 60 * 60));
        hoursWorked -= breakHours;
      } else if (lunchOut || lunchIn) {
        entry.inconsistencies.push('⚠️ Marcas de almuerzo incompletas');
      }

      if (!checkIn) entry.inconsistencies.push('❌ Falta marca de entrada');
      if (!checkOut) entry.inconsistencies.push('❌ Falta marca de salida');

      const extraMarks = normalizedLogs.filter((log) => log.normalized_type === 'EXTRA');
      if (extraMarks.length > 0) {
        entry.inconsistencies.push(`⚠️ ${extraMarks.length} marca(s) adicional(es)`);
      }

      if (hoursWorked < 0) {
        entry.inconsistencies.push('⚠️ Horas calculadas negativas');
        hoursWorked = 0;
      }

      entry.break_hours = Number(breakHours.toFixed(2));
      entry.hours_worked = Number(hoursWorked.toFixed(2));
    });

    return Object.values(grouped);
  };

  const handleExcelUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const result = await parseExcelMarks(file);
      if (!result.logs.length) {
        modal.showError('Archivo sin marcas', 'No se encontraron registros válidos en el archivo seleccionado');
        setUploadedLogs([]);
        setUploadSummary(null);
        return;
      }

      setUploadedLogs(result.logs);
      setUploadSummary({
        fileName: file.name,
        totalRows: result.stats.totalRows,
        validRows: result.stats.validRows,
        unmatchedEmployees: result.stats.unmatchedEmployees
      });

      modal.showSuccess('Archivo importado', `Se importaron ${result.stats.validRows} marcas desde ${file.name}`);
    } catch (err: any) {
      console.error('Excel import error', err);
      modal.showError('Error al importar', err?.message || 'No se pudo procesar el archivo');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      modal.showError('Fechas incompletas', 'Selecciona fecha de inicio y fin');
      return;
    }

    setIsLoading(true);
    try {
      let logs: ClockLog[] = [];
      let source: 'excel' | 'api' = 'api';

      if (uploadedLogs.length > 0) {
        const rangeStart = parseDateInput(startDate);
        const rangeEnd = parseDateInput(endDate, true);
        if (rangeStart === null || rangeEnd === null) {
          modal.showError('Fechas inválidas', 'No se pudo interpretar el rango seleccionado');
          return;
        }

        logs = uploadedLogs.filter((log) => {
          const timestamp = new Date(log.timestamp).getTime();
          return timestamp >= rangeStart && timestamp <= rangeEnd;
        });
        source = 'excel';
      } else {
        logs = await ClockLogsService.getClockLogs(startDate, endDate);
      }

      if (!logs.length) {
        setData([]);
        modal.showError('Sin marcas', 'No se encontraron registros en el rango seleccionado');
        return;
      }

      const processed = processAttendanceData(logs, source);
      setData(processed);
      modal.showSuccess(
        'Registros cargados',
        source === 'excel'
          ? `Se encontraron ${processed.length} registros en el archivo importado`
          : `Se encontraron ${processed.length} registros desde la API`
      );
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al obtener registros');
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

  const formatTime = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('es-CR', {
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
    if (!Number.isFinite(hours)) return '0:00hr';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}hr`;
  };

  const getBalanceColor = (hours: number) => {
    if (hours >= 8) return 'text-green-600';
    if (hours >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBalanceIcon = (inconsistencies: string[]) => {
    if (inconsistencies.length === 0) return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1]">
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
                <p className="text-[#E7DCC1]">
                  Gestiona las marcas de entrada y salida de los empleados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#3B4D36]">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-[#E0D6B7] px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#3B4D36]">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-[#E0D6B7] px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
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
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-dashed border-[#B99B6B] text-[#3B4D36] font-semibold cursor-pointer hover:bg-[#FDF6E6] transition-colors">
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              {isImporting ? 'Procesando archivo...' : 'Importar marcas (.xlsx)'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleExcelUpload}
                disabled={isImporting}
              />
            </label>
            {uploadSummary && (
              <div className="text-sm text-[#3B4D36] space-y-0.5">
                <p>
                  <span className="font-semibold">Archivo:</span> {uploadSummary.fileName}
                </p>
                <p className="text-xs text-[#6B5B3D]">
                  Marcas válidas: {uploadSummary.validRows}/{uploadSummary.totalRows} · Empleados sin coincidencia:{' '}
                  {uploadSummary.unmatchedEmployees}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de asistencia */}
        {data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E0D6B7] bg-gradient-to-r from-[#E7DCC1] to-[#F9F1DC]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#3B4D36]">Registros de Asistencia</h2>
                <div className="flex items-center gap-2 text-sm text-[#6B5B3D]">
                  <UserGroupIcon className="w-5 h-5" />
                  <span className="font-semibold">{data.length} registros</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#E7DCC1]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Salida almuerzo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Entrada almuerzo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Salida final
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Horas trabajadas
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D6B7]">
                  {data.map((entry, idx) => {
                    const key = `${entry.employee_id}_${entry.date}`;
                    const isExpanded = expandedRows.has(key);
                    const balance = entry.hours_worked - 8;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => toggleRow(key)}
                          className={`cursor-pointer hover:bg-[#F5EDD5] transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#FEFBF5]'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-[#6F7153]" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-[#6F7153]" />
                              )}
                              <span className="text-sm font-medium text-[#3B4D36]">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-[#3B4D36]">
                              {entry.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36]">
                              {formatTime(entry.check_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36]">
                              {formatTime(entry.lunch_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36]">
                              {formatTime(entry.lunch_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36]">
                              {formatTime(entry.check_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-[#6F7153]">
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
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {entry.inconsistencies.length}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida con detalles de marcas */}
                        {isExpanded && (
                          <tr className="bg-[#FEFBF5]">
                            <td colSpan={8} className="px-6 py-6">
                              <div className="pl-7">
                                <h4 className="text-sm font-bold text-[#3B4D36] mb-4">
                                  Detalle de marcas del día
                                </h4>

                                {entry.inconsistencies.length > 0 && (
                                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
                                    <p className="text-sm font-semibold text-red-800 mb-2">
                                      Inconsistencias detectadas:
                                    </p>
                                    <ul className="list-none text-sm text-red-700 space-y-1">
                                      {entry.inconsistencies.map((inc, i) => (
                                        <li key={i}>{inc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {entry.logs.map((log: NormalizedClockLog, logIdx: number) => (
                                    <div
                                      key={log.id}
                                      className="bg-white border border-[#E0D6B7] rounded-xl p-4 hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-[#E7DCC1] flex items-center justify-center">
                                              <span className="text-sm font-bold text-[#3B4D36]">{logIdx + 1}</span>
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-[#3B4D36]">
                                                {LOG_LABELS[log.normalized_type] || log.normalized_type}
                                              </p>
                                              {log.log_type && (
                                                <p className="text-xs text-[#6B5B3D]">Tipo original: {log.log_type}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-xs text-[#6B5B3D] mb-1">Hora</p>
                                          <p className="text-sm font-bold text-[#3B4D36]">
                                            {new Date(log.timestamp).toLocaleTimeString('es-CR')}
                                          </p>
                                        </div>
                                        {log.remarks && (
                                          <div>
                                            <p className="text-xs text-[#6B5B3D] mb-1">Observaciones</p>
                                            <p className="text-xs text-[#5D4E37]">{log.remarks}</p>
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
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] rounded-2xl flex items-center justify-center shadow-lg">
                <ClockIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] mb-3">
              No hay registros de asistencia
            </h3>
            <p className="text-base text-[#6B5B3D] max-w-md mx-auto">
              Selecciona un rango de fechas para consultar los registros de marcación de los empleados
            </p>
          </div>
        )}
      </div>

      <modal.ModalComponent />
    </div>
  );
}
