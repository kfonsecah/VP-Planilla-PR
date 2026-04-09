"use client";

import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { toast } from 'sonner';
import { ClockLogsService, ClockLog } from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';
import DatePicker from '@/components/DatePicker';
import {
  ClockIcon,
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


const LOG_LABELS: Record<NormalizedLogType, string> = {
  CHECK_IN: 'Entrada',
  LUNCH_OUT: 'Salida almuerzo',
  LUNCH_IN: 'Entrada almuerzo',
  CHECK_OUT: 'Salida final',
  EXTRA: 'Extra'
};

const normalizeLogType = (value?: string, timestamp?: string): NormalizedLogType | null => {
   if (!value) return null;
   const normalized = value.toLowerCase().trim();
   
   // Si tiene timestamp, intentar inferir por hora cuando el tipo es genérico
   let hour: number | undefined;
   if (timestamp) {
     try { hour = new Date(timestamp).getHours(); } catch {}
   }
   
   if (['in', 'entrada', 'entry', 'start'].includes(normalized)) {
     // Inferir entrada de almuerzo si la hora está entre 11:30–14:30
     if (hour !== undefined && hour >= 11 && hour < 14) return 'LUNCH_IN';
     return 'CHECK_IN';
   }
   
   if (['out', 'salida', 'exit', 'end', 'salida final', 'fin turno'].includes(normalized)) {
     if (hour !== undefined) {
       if (hour >= 11 && hour < 14) return 'LUNCH_OUT';   // 11:00–13:59
       if (hour >= 16) return 'CHECK_OUT';                 // 16:00–23:59
     }
     return 'CHECK_OUT'; // default
   }
   
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

const excelDateToJsDate = (value: unknown): Date | null => {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'number') {
    // Excel stores dates as number of days since 1900-01-01 (with 1900-01-01 = 1)
    const excelEpoch = new Date(1900, 0, 1);
    const daysOffset = value - 1; // Excel counts from 1, not 0
    const msPerDay = 86400000;
    const date = new Date(excelEpoch.getTime() + daysOffset * msPerDay);
    return date;
  }

  const asString = String(value).trim();
  if (!asString) return null;

  const timestamp = Date.parse(asString);
  if (!Number.isNaN(timestamp)) return new Date(timestamp);

  return null;
};

const buildDateTimeFromParts = (dateValue: unknown, timeValue: unknown): Date | null => {
  console.log('buildDateTimeFromParts - dateValue:', dateValue, 'tipo:', typeof dateValue);
  console.log('buildDateTimeFromParts - timeValue:', timeValue, 'tipo:', typeof timeValue);
  
  let datePart: Date | null = null;

  // Intentar parsear la fecha según su tipo
  if (typeof dateValue === 'number') {
    // Número de Excel
    datePart = excelDateToJsDate(dateValue);
  } else if (typeof dateValue === 'string') {
    const dateStr = dateValue.trim();
    
    // Formato ISO: 2025-01-06 o 2025/01/06
    if (dateStr.match(/^\d{4}[-\/]\d{2}[-\/]\d{2}/)) {
      // Parsear manualmente para evitar problemas de timezone
      const parts = dateStr.split(/[-\/]/);
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      datePart = new Date(year, month, day, 0, 0, 0, 0);
      console.log('  -> Parseado como ISO:', datePart, 'válido:', !isNaN(datePart.getTime()));
    }
    // Formato dd/mm/yyyy o dd-mm-yyyy
    else if (dateStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/)) {
      const parts = dateStr.split(/[-\/]/);
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mes en JS es 0-indexed
      const year = parseInt(parts[2], 10);
      datePart = new Date(year, month, day, 0, 0, 0, 0);
      console.log('  -> Parseado como dd/mm/yyyy:', datePart, 'válido:', !isNaN(datePart.getTime()));
    }
    // Intentar parseo directo
    else {
      datePart = new Date(dateStr);
      console.log('  -> Parseo directo:', datePart, 'válido:', !isNaN(datePart.getTime()));
    }
  } else if (dateValue instanceof Date) {
    datePart = dateValue;
  }

  if (!datePart || isNaN(datePart.getTime())) {
    console.log('  ❌ Fecha inválida - datePart:', datePart);
    return null;
  }

  console.log('  ✅ Fecha base válida:', datePart.toString());
  
  if (timeValue == null || timeValue === '') {
    console.log('  ⏰ Sin hora, retornando fecha base');
    return datePart;
  }

  if (timeValue instanceof Date) {
    try {
      datePart.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), 0);
      if (isNaN(datePart.getTime())) {
        console.log('  ❌ Fecha inválida después de setHours (Date)');
        return null;
      }
      console.log('  ✅ Con hora (Date):', datePart.toString());
      return datePart;
    } catch (e) {
      console.log('  ❌ Error aplicando hora (Date):', e);
      return datePart;
    }
  }

  if (typeof timeValue === 'number') {
    try {
      // Excel time is fraction of a day (0.5 = 12:00)
      const totalSeconds = Math.round(timeValue * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      datePart.setHours(hours, minutes, seconds, 0);
      if (isNaN(datePart.getTime())) {
        console.log('  ❌ Fecha inválida después de setHours (number)');
        return null;
      }
      console.log('  ✅ Con hora (number):', datePart.toString());
      return datePart;
    } catch (e) {
      console.log('  ❌ Error aplicando hora (number):', e);
      return datePart;
    }
  }

  const timeString = String(timeValue).trim();
  if (!timeString) {
    console.log('  ⚠️ timeString vacío, retornando fecha base');
    return datePart;
  }
  
  try {
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    
    console.log('  ⏰ Parseando hora string:', { hours, minutes, seconds });
    
    if (Number.isNaN(hours) || hours < 0 || hours > 23) {
      console.log('  ❌ Horas inválidas:', hours);
      return datePart;
    }
    
    datePart.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, Number.isNaN(seconds) ? 0 : seconds, 0);
    
    if (isNaN(datePart.getTime())) {
      console.log('  ❌ Fecha inválida después de setHours (string)');
      return null;
    }
    
    console.log('  ✅ Con hora (string):', datePart.toString());
    return datePart;
  } catch (e) {
    console.log('  ❌ Error aplicando hora (string):', e);
    return datePart;
  }
};

const parseDateInput = (value: string, endOfDay = false) => {
  if (!value) return null;
  
  // Formato ISO: YYYY-MM-DD
  if (value.match(/^\d{4}[-\/]\d{2}[-\/]\d{2}$/)) {
    const [year, month, day] = value.split(/[-\/]/).map((chunk) => parseInt(chunk, 10));
    if (!year || !month || !day) return null;
    if (endOfDay) return Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // Formato display: DD/MM/YY (del DatePicker)
  if (value.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/)) {
    const [day, month, year] = value.split(/[-\/]/).map((chunk) => parseInt(chunk, 10));
    if (!day || !month || !year) return null;
    const fullYear = year < 100 ? 2000 + year : year;
    if (endOfDay) return Date.UTC(fullYear, month - 1, day, 23, 59, 59, 999);
    return Date.UTC(fullYear, month - 1, day, 0, 0, 0, 0);
  }
  
  return null;
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
  const [error, setError] = useState<string | null>(null);

  // Helpers para fechas en formato ISO (YYYY-MM-DD)
  const toISODate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const applyDatePreset = useCallback((preset: 'today' | 'last7days' | 'last15days' | 'last3months' | 'thisMonth') => {
    const now = new Date();
    const today = toISODate(now);
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'last7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setStartDate(toISODate(start));
      setEndDate(today);
    } else if (preset === 'last15days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 14);
      setStartDate(toISODate(start));
      setEndDate(today);
    } else if (preset === 'last3months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setStartDate(toISODate(start));
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(firstDay);
      setEndDate(today);
    }
  }, []);

  // Conversión ISO (YYYY-MM-DD) ↔ display (DD/MM/YY) para DatePicker
  const isoToDisplay = (iso: string): string => {
    const d = new Date(iso);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = String(d.getUTCFullYear()).slice(-2);
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

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const emps = await getEmployees();
      setEmployees(emps as unknown as Employee[]);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const findEmployeeByName = (rawName?: string): Record<string, unknown> | null => {
    if (!rawName) return null;
    const normalized = normalizeName(rawName);
    if (!normalized) return null;
    const list = employees as unknown as Array<Record<string, unknown>>;
    return (
      // Exact full-name match (e.g. "Test B Dos" → "test b dos")
      list.find((emp) => normalizeName(String(emp.name || '')) === normalized) ||
      // First word + last_name (handles omitted middle name: "Test Dos" → "Test B Dos")
      list.find((emp) => {
        const firstName = String(emp.name || '').split(/\s+/)[0] || '';
        const lastName  = String(emp.last_name || '');
        return firstName && lastName && normalizeName(`${firstName} ${lastName}`) === normalized;
      }) ||
      null
    );
  };

   const parseExcelMarks = async (file: File) => {
     try {
       const { Workbook } = await import('exceljs');
       const buffer = await file.arrayBuffer();
       const workbook = new Workbook();
       await workbook.xlsx.load(buffer);
       const ws = workbook.worksheets[0];
       if (!ws) throw new Error('No hay hojas');

       const allData: unknown[][] = [];
       ws.eachRow({ includeEmpty: true }, (row) => {
         const rowData: unknown[] = [];
         row.eachCell({ includeEmpty: true }, (cell) => {
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           let value: any = cell.value;
           if (cell.formula) value = cell.result ?? cell.value;
           rowData.push(value);
         });
         allData.push(rowData);
       });

       const rows = allData.filter(r => Array.isArray(r) && r.some(c => c != null && String(c).trim() !== ''));
       if (rows.length === 0) return { logs: [], stats: { totalRows: 0, validRows: 0, matchedRows: 0, unmatchedEmployees: 0 } };

       let headerRowIndex = 0;
       const rawHeaders = rows[0].map(c => String(c || '').trim());
       const looksLikeHeaders = rawHeaders.some(h => /empleado|fecha|hora|nombre|date|time|timestamp|tipo|log_type|marca/i.test(h));
       if (!looksLikeHeaders) headerRowIndex = -1;

       const headers = rows[headerRowIndex].map(h => String(h || '').toLowerCase());
       const colEmployeeId = headers.findIndex(h => /empleado|employee|id/.test(h));
       // Detect separate date + time columns (e.g. "Fecha" and "Hora")
       const colFecha = headers.findIndex(h => /^fecha$|^date$/.test(h));
       const colHora = headers.findIndex(h => /^hora$|^time$/.test(h));
       const colTimestamp = colFecha === -1
         ? headers.findIndex(h => /timestamp|fecha|hora|date|time/.test(h))
         : colFecha;
       const hasSeparateTime = colFecha !== -1 && colHora !== -1;
       const colLogType = headers.findIndex(h => /tipo|log_type|marca|log type/.test(h));

       const useCols = {
         emp: colEmployeeId !== -1 ? colEmployeeId : 0,
         ts: colTimestamp !== -1 ? colTimestamp : 1,
         hora: hasSeparateTime ? colHora : -1,
         type: colLogType !== -1 ? colLogType : 2
       };

       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const logs: any[] = [];
       const unmatched = new Set<string>();
       let matchedRows = 0;
       const dataRows = rows.slice(headerRowIndex + 1);

       dataRows.forEach((row, idx) => {
         const empRaw = row[useCols.emp];
         const empIdNum = empRaw != null ? Number(empRaw) : NaN;
         const empId = !isNaN(empIdNum) ? empIdNum : null;
         // Pass raw value as employee_name so backend can resolve by name when ID doesn't match
         const empName = empId === null && empRaw != null ? String(empRaw).trim() : '';
         const tsRaw = row[useCols.ts];
         // Combine separate date + time columns when present
         const horaRaw = useCols.hora !== -1 ? row[useCols.hora] : null;
         const logType = row[useCols.type] ? String(row[useCols.type]).trim() : null;

         if (!tsRaw || !logType) {
           unmatched.add(`Fila ${idx}: datos faltantes`);
           return;
         }

         let ts: Date | null = null;
         if (typeof tsRaw === 'string' && tsRaw.includes(' ') && !horaRaw) {
           ts = new Date(tsRaw.replace(' ', 'T'));
         } else if (horaRaw !== null) {
           // Separate date + time columns: combine them
           let dateStr: string | null = null;
           if (typeof tsRaw === 'number') {
             dateStr = excelDateToJsDate(tsRaw)?.toISOString().split('T')[0] ?? null;
           } else {
             const raw = String(tsRaw).split('T')[0];
             // Convert DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD
             const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
             if (dmyMatch) {
               const [, d, m, y] = dmyMatch;
               const year = y.length === 2 ? `20${y}` : y;
               dateStr = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
             } else {
               dateStr = raw; // assume already ISO
             }
           }
const timeStr = typeof horaRaw === 'number'
              ? (() => {
                  const totalMinutes = Math.round(horaRaw * 24 * 60);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                })()
              : String(horaRaw).trim();
           ts = dateStr ? new Date(`${dateStr}T${timeStr}:00`) : null;
         } else if (typeof tsRaw === 'string' && /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(tsRaw)) {
           ts = buildDateTimeFromParts(tsRaw, '');
         } else if (typeof tsRaw === 'number') {
           ts = excelDateToJsDate(tsRaw);
         } else {
           ts = new Date(String(tsRaw));
         }

         if (!ts || isNaN(ts.getTime())) {
           unmatched.add(`Fila ${idx}: timestamp inválido`);
           return;
         }

         logs.push({
           id: logs.length + 1,
           employee_id: empId,
           employee_name: empName,
           timestamp: ts.toISOString(),
           log_type: logType,
           remarks: undefined,
           version: 1
         });
         matchedRows++;
       });

       return {
         logs,
         stats: { totalRows: dataRows.length, validRows: logs.length, matchedRows, unmatchedEmployees: unmatched.size }
       };
       
     } catch (err) {
       console.error('Error parseExcel:', err);
       throw err;
     } finally {
       setIsImporting(false);
     }
   };

  const formatEmployeeName = (emp: Pick<Employee, 'employee_first_name' | 'employee_middle_name' | 'employee_last_name'>) =>
    `${emp.employee_first_name} ${emp.employee_middle_name} ${emp.employee_last_name}`.replace(/\s+/g, ' ').trim();

  const findEmployeeById = (employeeId?: number | string | null): Employee | null => {
    if (employeeId === null || employeeId === undefined) return null;
    const employeeIdStr = String(employeeId);
    return employees.find((e) => String(e.employee_id) === employeeIdStr) || null;
  };

  const resolveEmployeeForLog = (log: ClockLog): { id: string | number; name: string } => {
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
          id: (byName.id ?? byName.employee_id) as string | number,
          name: String(byName.name || log.employee_name || '')
        };
      }
    }

    const fallbackId: string | number = log.employee_id ?? normalizeName(log.employee_name || `desconocido_${log.id}`);
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

      const normalizedLogs = sortedLogs.map((log) => {
        const normalized_type = normalizeLogType(log.log_type, log.timestamp) ?? 'EXTRA';
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
       console.log('=== INICIO IMPORTACIÓN ===');
       console.log('Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
       
       const result = await parseExcelMarks(file);
       
       console.log('=== RESULTADO IMPORTACIÓN ===');
       console.log('Logs encontrados:', result.logs.length);
       console.log('Stats:', result.stats);
       
       if (!result.logs.length) {
         console.error('NO SE ENCONTRARON MARCAS');
         toast.error('No se encontraron registros válidos en el archivo seleccionado. Revisa la consola del navegador para más detalles.');
         setUploadedLogs([]);
         setUploadSummary(null);
         event.target.value = '';
         return;
       }

       setUploadedLogs(result.logs);
       setUploadSummary({
         fileName: file.name,
         totalRows: result.stats.totalRows,
         validRows: result.stats.validRows,
         unmatchedEmployees: result.stats.unmatchedEmployees
       });

       // Guardar marcas en la base de datos con seguimiento de sesión y detección de anomalías
       try {
         const saveResult = await ClockLogsService.importLogs(result.logs, 'excel_import');
         console.log('Marcas importadas con sesion:', saveResult);
         const resolutionSkipped = saveResult.skipped ?? 0;
         const anomalyCount = saveResult.anomalies ?? 0;
         // DB duplicates = logs that resolved OK but were skipped by createMany skipDuplicates
         const dbDuplicates = result.logs.length - resolutionSkipped - saveResult.created;
         const resolutionMsg = resolutionSkipped > 0
           ? ` ${resolutionSkipped} no se pudieron identificar.`
           : '';
         const duplicatesMsg = dbDuplicates > 0
           ? ` ${dbDuplicates} ya existían en la BD (ignoradas).`
           : '';
         const anomalyMsg = anomalyCount > 0
           ? ` ${anomalyCount} anomalías detectadas.`
           : '';
         if (saveResult.created === 0 && dbDuplicates > 0) {
           toast.info(`Todos los registros de ${file.name} ya estaban en la BD.${duplicatesMsg}`);
         } else {
           toast.success(`${saveResult.created} marcas importadas desde ${file.name}.${duplicatesMsg}${resolutionMsg}${anomalyMsg}`);
         }
       } catch (saveErr: unknown) {
         console.error('Marcas cargadas en vista pero no guardadas en BD:', saveErr);
         const saveErrMsg = saveErr instanceof Error ? saveErr.message : 'error desconocido';
         toast.success(`Se cargaron ${result.stats.validRows} marcas para visualización, pero no se pudieron guardar en BD: ${saveErrMsg}`);
       }
     } catch (err: unknown) {
       console.error('❌ ERROR EN IMPORTACIÓN:', err);
       toast.error((err instanceof Error ? err.message : null) || 'No se pudo procesar el archivo');
     } finally {
       setIsImporting(false);
       event.target.value = '';
     }
   };

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecciona fecha de inicio y fin');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let logs: ClockLog[] = [];
      let source: 'excel' | 'api' = 'api';

      if (uploadedLogs.length > 0) {
        const rangeStart = parseDateInput(startDate);
        const rangeEnd = parseDateInput(endDate, true);
        if (rangeStart === null || rangeEnd === null) {
          toast.error('No se pudo interpretar el rango seleccionado');
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
        toast.error('No se encontraron registros en el rango seleccionado');
        return;
      }

      const processed = processAttendanceData(logs, source);
      setData(processed);
      toast.success(
        source === 'excel'
          ? `Se encontraron ${processed.length} registros en el archivo importado`
          : `Se encontraron ${processed.length} registros desde la API`
      );
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

  const formatTime = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CR', {
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-screen-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Recursos Humanos</p>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Registro de Asistencia</h1>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3 text-red-500 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar asistencia</p>
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

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fecha inicio
              </label>
              <DatePicker
                value={isoToDisplay(startDate)}
                onChange={(display) => {
                  const iso = parseDisplayToISO(display);
                  if (iso) setStartDate(iso);
                }}
                placeholder="dd/mm/yy"
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Fecha fin
              </label>
              <DatePicker
                value={isoToDisplay(endDate)}
                onChange={(display) => {
                  const iso = parseDisplayToISO(display);
                  if (iso) setEndDate(iso);
                }}
                placeholder="dd/mm/yy"
                className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm"
              />
            </div>
            <div className="flex gap-2 md:col-span-2 flex-wrap">
              <button
                onClick={() => applyDatePreset('today')}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Hoy
              </button>
              <button
                onClick={() => applyDatePreset('last7days')}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Últimos 7 días
              </button>
              <button
                onClick={() => applyDatePreset('last15days')}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Últimos 15 días
              </button>
              <button
                onClick={() => applyDatePreset('last3months')}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Últimos 3 meses
              </button>
              <button
                onClick={() => applyDatePreset('thisMonth')}
                className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Este mes
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleFetch}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-4 h-4" />
                    Consultar
                  </>
                )}
              </button>
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setData([]); }}
                className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-sm"
              >
                Limpiar
              </button>
            </div>

            <label className="relative inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm">
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              {isImporting ? 'Procesando archivo...' : 'Importar marcas (.xlsx)'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleExcelUpload}
                disabled={isImporting}
              />
            </label>
            </div>
          </div>

          {uploadSummary && (
            <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
              <p><span className="font-medium text-zinc-700 dark:text-zinc-300">Archivo:</span> {uploadSummary.fileName}</p>
              <p>Marcas válidas: {uploadSummary.validRows}/{uploadSummary.totalRows} · Sin coincidencia: {uploadSummary.unmatchedEmployees}</p>
            </div>
          )}

        {/* Loading state - skeleton table */}
        {isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-5 py-3 text-left font-medium">Fecha</th>
                    <th className="px-5 py-3 text-left font-medium">Empleado</th>
                    <th className="px-5 py-3 text-center font-medium">Entrada</th>
                    <th className="px-5 py-3 text-center font-medium">Salida alm.</th>
                    <th className="px-5 py-3 text-center font-medium">Entrada alm.</th>
                    <th className="px-5 py-3 text-center font-medium">Salida final</th>
                    <th className="px-5 py-3 text-center font-medium">Horas</th>
                    <th className="px-5 py-3 text-center font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3.5"><div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-16 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-14 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                      <td className="px-5 py-3.5"><div className="h-4 w-12 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance table */}
        {data.length > 0 && !isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Registros de Asistencia</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <UserGroupIcon className="w-4 h-4" />
                <span className="font-medium">{data.length} registros</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-5 py-3 text-left font-medium">Fecha</th>
                    <th className="px-5 py-3 text-left font-medium">Empleado</th>
                    <th className="px-5 py-3 text-center font-medium">Entrada</th>
                    <th className="px-5 py-3 text-center font-medium">Salida alm.</th>
                    <th className="px-5 py-3 text-center font-medium">Entrada alm.</th>
                    <th className="px-5 py-3 text-center font-medium">Salida final</th>
                    <th className="px-5 py-3 text-center font-medium">Horas</th>
                    <th className="px-5 py-3 text-center font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.map((entry) => {
                    const key = `${entry.employee_id}_${entry.date}`;
                    const isExpanded = expandedRows.has(key);
                    const balance = entry.hours_worked - 8;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => toggleRow(key)}
                          className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-green-600" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                              {entry.employee_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">
                              {formatTime(entry.check_in)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">
                              {formatTime(entry.lunch_out)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">
                              {formatTime(entry.lunch_in)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">
                              {formatTime(entry.check_out)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatHours(entry.hours_worked)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              {getBalanceIcon(entry.inconsistencies)}
                              <span className={`text-sm font-semibold ${getBalanceColor(entry.hours_worked)}`}>
                                {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                              </span>
                              {entry.inconsistencies.length > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                  {entry.inconsistencies.length}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                            <td colSpan={8} className="px-5 py-5">
                              <div className="pl-7">
                                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                                  Detalle de marcas del día
                                </h4>

                                {entry.inconsistencies.length > 0 && (
                                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5">Inconsistencias:</p>
                                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
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
                                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3"
                                    >
                                      <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{logIdx + 1}</span>
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                                            {LOG_LABELS[log.normalized_type] || log.normalized_type}
                                          </p>
                                          {log.log_type && (
                                            <p className="text-[10px] text-zinc-400">Original: {log.log_type}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-zinc-400 mb-0.5">Hora</p>
                                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                          {new Date(log.timestamp).toLocaleTimeString('es-CR')}
                                        </p>
                                      </div>
                                      {log.remarks && (
                                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                          <p className="text-[10px] text-zinc-400 mb-0.5">Observaciones</p>
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{log.remarks}</p>
                                        </div>
                                      )}
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

        {/* Empty state */}
        {data.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <ClockIcon className="w-10 h-10 text-zinc-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-100 mb-2">
              No hay registros de asistencia
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Selecciona un rango de fechas para consultar los registros de marcación de los empleados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
