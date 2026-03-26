"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useModal } from '@/hooks/useModal';
import { ClockLogsService, ClockLog } from '@/services/clockLogsService';
import { getEmployees } from '@/services/employeeService';
import ExcelJS from 'exceljs';
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
    if (dateStr.match(/^\d{4}[-/]\d{2}[-/]\d{2}/)) {
      // Parsear manualmente para evitar problemas de timezone
      const parts = dateStr.split(/[-/]/);
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      datePart = new Date(year, month, day, 0, 0, 0, 0);
      console.log('  -> Parseado como ISO:', datePart, 'válido:', !isNaN(datePart.getTime()));
    }
    // Formato dd/mm/yyyy o dd-mm-yyyy
    else if (dateStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/)) {
      const parts = dateStr.split(/[-/]/);
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
      const buffer = await file.arrayBuffer();
      console.log('1. Buffer creado, tamaño:', buffer.byteLength);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      console.log('2. Workbook cargado, hojas:', workbook.worksheets.map(ws => ws.name));
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('El archivo no contiene hojas válidas');
      
      console.log('3. Hoja seleccionada:', worksheet.name);

      // Convertir worksheet a array de arrays
      const allData: unknown[][] = [];
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        const rowData: unknown[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          // ExcelJS maneja automáticamente las fechas
          let value = cell.value;
          
          // Si es una fórmula, obtener el resultado
          if (cell.formula) {
            value = cell.result || cell.value;
          }
          
          rowData.push(value);
        });
        allData.push(rowData);
      });
      
      console.log('4. Total filas (incluyendo vacías):', allData.length);
      console.log('5. Primeras 10 filas:');
      allData.slice(0, 10).forEach((row, i) => {
        console.log(`   Fila ${i}:`, row);
      });

      // Filtrar filas vacías
      const rows = allData.filter((row: unknown[]) => 
        Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      
      console.log('6. Filas con datos:', rows.length);
      
      if (!rows.length) {
        console.error('❌ No hay filas con datos');
        return { logs: [], stats: { totalRows: 0, validRows: 0, matchedRows: 0, unmatchedEmployees: 0 } };
      }

      // Buscar encabezados (primera fila que tenga contenido)
      let headerRowIndex = 0;
      const rawHeaders = (rows[headerRowIndex] as unknown[]).map((cell: unknown) => String(cell || '').trim());
      
      console.log('7. Encabezados encontrados en fila 0:', rawHeaders);
      
      // Si la primera fila parece ser datos y no encabezados, crear encabezados genéricos
      const looksLikeHeaders = rawHeaders.some((h: string) => {
        const lower = h.toLowerCase();
        return lower.includes('empleado') || lower.includes('fecha') || lower.includes('hora') || 
               lower.includes('nombre') || lower.includes('date') || lower.includes('time');
      });
      
      if (!looksLikeHeaders) {
        console.log('⚠️ Primera fila no parece tener encabezados, usando nombres genéricos');
        // Usar la primera fila como datos, crear encabezados genéricos
        headerRowIndex = -1;
      }

      const logs: ClockLog[] = [];
      const unmatched = new Set<string>();
      let matchedRows = 0;

      // Procesar filas de datos
      const startRow = headerRowIndex + 1;
      const dataRows = rows.slice(startRow);
      
      console.log('8. Procesando', dataRows.length, 'filas de datos desde fila', startRow);

      dataRows.forEach((row: unknown[], rowIndex: number) => {
        console.log(`\n--- Procesando fila ${rowIndex + startRow} ---`);
        console.log('Datos:', row);

        // Intentar diferentes posiciones para los datos comunes
        let employeeName = '';
        let employeeId: number | null = null;
        let dateValue: unknown = null;
        let timeValue: unknown = null;
        let typeValue: string | null = null;

        // Estrategia: buscar en todas las columnas
        row.forEach((cell: unknown, colIndex: number) => {
          const cellStr = String(cell || '').trim();
          if (!cellStr) return;

          console.log(`  Col ${colIndex}: "${cellStr}"`);

          // Detectar fecha (formato dd/mm/yyyy, yyyy-mm-dd, o número de Excel)
          if (!dateValue && (cellStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || 
              cellStr.match(/^\d{4}-\d{2}-\d{2}/) || 
              typeof cell === 'number' && cell > 40000)) {
            dateValue = cell;
            console.log(`    -> Detectada como FECHA`);
          }
          // Detectar hora (formato HH:MM o HH:MM:SS)
          else if (!timeValue && cellStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
            timeValue = cellStr;
            console.log(`    -> Detectada como HORA`);
          }
          // Detectar ID (número corto)
          else if (!employeeId && !isNaN(Number(cell)) && Number(cell) < 10000) {
            employeeId = Number(cell);
            console.log(`    -> Detectado como ID`);
          }
          // Detectar tipo de marca
          else if (!typeValue && cellStr.match(/entrada|salida|in|out|almuerzo/i)) {
            typeValue = cellStr;
            console.log(`    -> Detectado como TIPO`);
          }
          // Resto asumirlo como nombre si tiene letras
          else if (!employeeName && cellStr.match(/[a-zA-Z]{2,}/)) {
            employeeName = cellStr;
            console.log(`    -> Detectado como NOMBRE`);
          }
        });

        console.log('Valores extraídos:', { employeeName, employeeId, dateValue, timeValue, typeValue });

        // Construir timestamp
        let timestamp: Date | null = null;
        if (dateValue) {
          if (timeValue) {
            timestamp = buildDateTimeFromParts(dateValue, timeValue);
          } else {
            timestamp = excelDateToJsDate(dateValue);
          }
        }

        if (!timestamp || isNaN(timestamp.getTime())) {
          console.log('❌ No se pudo construir timestamp válido');
          return;
        }

        console.log('✅ Timestamp:', timestamp.toISOString());

        // Buscar empleado
        let matchedEmployeeId: number | null = employeeId;
        let matchedEmployeeName = employeeName;

        if (!matchedEmployeeId && employeeName) {
          const match = findEmployeeByName(employeeName);
          if (match) {
            matchedEmployeeId = (Number(match.id || match.employee_id) || null) as number | null;
            matchedEmployeeName = String(match.name || employeeName || '');
            console.log('✅ Empleado encontrado por nombre:', matchedEmployeeName);
          } else {
            console.log('⚠️ Empleado no encontrado en base de datos');
          }
        }

        if (!matchedEmployeeId) {
          unmatched.add(employeeName || `Fila ${rowIndex + startRow}`);
        } else {
          matchedRows += 1;
        }

        const newLog: ClockLog = {
          id: logs.length + 1,
          employee_id: matchedEmployeeId ?? null,
          employee_name: matchedEmployeeName || employeeName || `Empleado #${matchedEmployeeId}`,
          timestamp: timestamp.toISOString(),
          log_type: String(typeValue || 'IMPORTED').toUpperCase(),
          remarks: undefined,
          version: 1
        };

        logs.push(newLog);
        console.log('✅ Log creado:', newLog);
      });

      const stats = {
        totalRows: dataRows.length,
        validRows: logs.length,
        matchedRows,
        unmatchedEmployees: unmatched.size
      };

      console.log('\n=== RESUMEN FINAL ===');
      console.log('Total filas procesadas:', stats.totalRows);
      console.log('Logs válidos creados:', stats.validRows);
      console.log('Empleados emparejados:', stats.matchedRows);
      console.log('Empleados sin emparejar:', stats.unmatchedEmployees);
      console.log('Primeros 3 logs:', logs.slice(0, 3));

      return { logs, stats };
      
    } catch (error) {
      console.error('❌ ERROR EN parseExcelMarks:', error);
      throw error;
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
      console.log('=== INICIO IMPORTACIÓN ===');
      console.log('Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
      
      const result = await parseExcelMarks(file);
      
      console.log('=== RESULTADO IMPORTACIÓN ===');
      console.log('Logs encontrados:', result.logs.length);
      console.log('Stats:', result.stats);
      
      if (!result.logs.length) {
        console.error('NO SE ENCONTRARON MARCAS');
        modal.showError('Archivo sin marcas', 'No se encontraron registros válidos en el archivo seleccionado. Revisa la consola del navegador para más detalles.');
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

      // Guardar marcas en la base de datos para que la planilla pueda usarlas
      try {
        const saveResult = await ClockLogsService.bulkSave(result.logs);
        console.log('✅ Marcas guardadas en BD:', saveResult.created);
        modal.showSuccess('Archivo importado', `Se importaron ${result.stats.validRows} marcas desde ${file.name}. ${saveResult.created} guardadas en base de datos.`);
      } catch (saveErr: unknown) {
        console.error('⚠️ Marcas cargadas en vista pero no guardadas en BD:', saveErr);
        const saveErrMsg = saveErr instanceof Error ? saveErr.message : 'error desconocido';
        modal.showSuccess('Archivo importado (solo vista)', `Se cargaron ${result.stats.validRows} marcas para visualización, pero no se pudieron guardar en BD: ${saveErrMsg}`);
      }
    } catch (err: unknown) {
      console.error('❌ ERROR EN IMPORTACIÓN:', err);
      modal.showError('Error al importar', (err instanceof Error ? err.message : null) || 'No se pudo procesar el archivo');
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
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] dark:from-[#121212] via-[#F9F1DC] dark:via-[#1a1a1a] to-[#E7DCC1] dark:to-[#121212]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-[#3d3d3d] dark:to-[#252525] rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ClockIcon className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Registro de Asistencia</h1>
                <p className="text-[#E7DCC1] dark:text-[#A3A3A3]">
                  Gestiona las marcas de entrada y salida de los empleados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-[#404040] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#3B4D36] dark:text-[#E5E5E5]">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-[#E0D6B7] dark:border-[#404040] px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#3B4D36] dark:text-[#E5E5E5]">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-[#E0D6B7] dark:border-[#404040] px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5]"
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
                className="px-6 py-2.5 bg-gray-200 dark:bg-[#404040] hover:bg-gray-300 dark:hover:bg-[#4a4a4a] text-gray-700 dark:text-[#E5E5E5] rounded-xl transition-all font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-dashed border-[#B99B6B] dark:border-[#4a4a4a] text-[#3B4D36] dark:text-[#E5E5E5] font-semibold cursor-pointer hover:bg-[#FDF6E6] dark:hover:bg-[#3d3d3d] transition-colors">
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
              <div className="text-sm text-[#3B4D36] dark:text-[#E5E5E5] space-y-0.5">
                <p>
                  <span className="font-semibold">Archivo:</span> {uploadSummary.fileName}
                </p>
                <p className="text-xs text-[#6B5B3D] dark:text-[#A3A3A3]">
                  Marcas válidas: {uploadSummary.validRows}/{uploadSummary.totalRows} · Empleados sin coincidencia:{' '}
                  {uploadSummary.unmatchedEmployees}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de asistencia */}
        {data.length > 0 && (
          <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-[#404040] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E0D6B7] dark:border-[#404040] bg-gradient-to-r from-[#E7DCC1] to-[#F9F1DC] dark:from-[#333333] dark:to-[#2d2d2d]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#3B4D36] dark:text-[#E5E5E5]">Registros de Asistencia</h2>
                <div className="flex items-center gap-2 text-sm text-[#6B5B3D] dark:text-[#A3A3A3]">
                  <UserGroupIcon className="w-5 h-5" />
                  <span className="font-semibold">{data.length} registros</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#E7DCC1] dark:bg-[#333333]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Salida almuerzo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Entrada almuerzo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Salida final
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Horas trabajadas
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-[#3B4D36] dark:text-[#E5E5E5] uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D6B7] dark:divide-[#404040]">
                  {data.map((entry, idx) => {
                    const key = `${entry.employee_id}_${entry.date}`;
                    const isExpanded = expandedRows.has(key);
                    const balance = entry.hours_worked - 8;

                    return (
                      <React.Fragment key={key}>
                        <tr
                          onClick={() => toggleRow(key)}
                          className={`cursor-pointer hover:bg-[#F5EDD5] dark:hover:bg-[#3d3d3d] transition-colors ${
                            idx % 2 === 0 ? 'bg-white dark:bg-[#2d2d2d]' : 'bg-[#FEFBF5] dark:bg-[#333333]'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-[#6F7153]" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-[#6F7153]" />
                              )}
                              <span className="text-sm font-medium text-[#3B4D36] dark:text-[#E5E5E5]">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                              {entry.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                              {formatTime(entry.check_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                              {formatTime(entry.lunch_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                              {formatTime(entry.lunch_in)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                              {formatTime(entry.check_out)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-[#6F7153] dark:text-[#A3A3A3]">
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
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
                                  {entry.inconsistencies.length}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida con detalles de marcas */}
                        {isExpanded && (
                          <tr className="bg-[#FEFBF5] dark:bg-[#333333]">
                            <td colSpan={8} className="px-6 py-6">
                              <div className="pl-7">
                                <h4 className="text-sm font-bold text-[#3B4D36] dark:text-[#E5E5E5] mb-4">
                                  Detalle de marcas del día
                                </h4>

                                {entry.inconsistencies.length > 0 && (
                                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 rounded-lg">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                                      Inconsistencias detectadas:
                                    </p>
                                    <ul className="list-none text-sm text-red-700 dark:text-red-400 space-y-1">
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
                                      className="bg-white dark:bg-[#2d2d2d] border border-[#E0D6B7] dark:border-[#404040] rounded-xl p-4 hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg bg-[#E7DCC1] dark:bg-[#3d3d3d] flex items-center justify-center">
                                              <span className="text-sm font-bold text-[#3B4D36] dark:text-[#E5E5E5]">{logIdx + 1}</span>
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-[#3B4D36] dark:text-[#E5E5E5]">
                                                {LOG_LABELS[log.normalized_type] || log.normalized_type}
                                              </p>
                                              {log.log_type && (
                                                <p className="text-xs text-[#6B5B3D] dark:text-[#A3A3A3]">Tipo original: {log.log_type}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-xs text-[#6B5B3D] dark:text-[#A3A3A3] mb-1">Hora</p>
                                          <p className="text-sm font-bold text-[#3B4D36] dark:text-[#E5E5E5]">
                                            {new Date(log.timestamp).toLocaleTimeString('es-CR')}
                                          </p>
                                        </div>
                                        {log.remarks && (
                                          <div>
                                            <p className="text-xs text-[#6B5B3D] dark:text-[#A3A3A3] mb-1">Observaciones</p>
                                            <p className="text-xs text-[#5D4E37] dark:text-[#A3A3A3]">{log.remarks}</p>
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
          <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-[#404040] p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] dark:from-[#3d3d3d] dark:to-[#2d2d2d] rounded-2xl flex items-center justify-center shadow-lg">
                <ClockIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] dark:text-[#E5E5E5] mb-3">
              No hay registros de asistencia
            </h3>
            <p className="text-base text-[#6B5B3D] dark:text-[#A3A3A3] max-w-md mx-auto">
              Selecciona un rango de fechas para consultar los registros de marcación de los empleados
            </p>
          </div>
        )}
      </div>

      <modal.ModalComponent />
    </div>
  );
}
