"use client";

import React, { useState } from 'react';
import { formatCRC } from '@/utils/number';
import ExcelJS from 'exceljs';
import { 
  DocumentCheckIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface PayrollResultsProps {
  data: unknown;
  onCreate?: () => void;
}

export default function PayrollResults({ data, onCreate }: PayrollResultsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Cast data to a workable type
  const payrollData = data as Record<string, unknown>;

  // DEBUG: Log what we receive
  console.log('PayrollResults received data:', payrollData);
  console.log('data.employees:', payrollData?.employees);
  console.log('data.employeeResults:', payrollData?.employeeResults);
  
  if (!payrollData) return null;

  // Try to find an array of employee results
  const employees = Array.isArray(payrollData.employeeResults) ? payrollData.employeeResults : Array.isArray(payrollData.employees) ? payrollData.employees : Array.isArray(payrollData) ? (payrollData as unknown[]) : null;
  
  console.log('Extracted employees:', employees);

  const exportToExcel = async () => {
    if (!employees || employees.length === 0) return;

    // Obtener información del periodo
    const period = payrollData.period as Record<string, unknown> | undefined;
    const periodStart = period?.startDate || payrollData.periodStart || '';
    const periodEnd = period?.endDate || payrollData.periodEnd || '';

    // Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();

    // Hoja 1: Resumen General
    const ws1 = workbook.addWorksheet('Resumen General');
    const summaryData = [
      ['PLANILLA DE SALARIOS'],
      ['Periodo:', `${periodStart} a ${periodEnd}`],
      ['Fecha de generación:', new Date().toLocaleDateString('es-CR')],
      [],
      ['RESUMEN GENERAL'],
      ['Total de empleados:', employees.length],
      ['Total horas trabajadas:', totalHours.toFixed(2)],
      ['Total salario bruto:', formatCRC(totalGross)],
      ['Total deducciones:', formatCRC(totalDeductions)],
      ['Total salario neto:', formatCRC(total || 0)],
    ];
    ws1.addRows(summaryData);
    ws1.columns = [{ width: 25 }, { width: 30 }];

    // Hoja 2: Detalle Completo por Empleado
    const ws2 = workbook.addWorksheet('Detalle Completo');
    const detailRows: unknown[][] = [];

    employees.forEach((e: unknown, empIdx: number) => {
      console.log('Employee data for Excel:', e);
      const emp = e as Record<string, unknown>;
      const employeeName = emp.name || emp.employee_name || emp.employeeName || 'N/A';
      const identification = emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || 'N/A';
      const position = emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || 'N/A';
      const baseHourly = Number(emp.baseHourlySalary || emp.base_hourly_salary || 0);
      const gross = Number(emp.gross || emp.grossSalary || emp.total_gross || 0);
      const bonuses = Number(emp.bonuses || 0);
      const deductions = Number(emp.deductions || emp.totalDeductions || emp.total_deductions || 0);
      const net = Number(emp.net || emp.netSalary || emp.net_salary || 0);
      const employeeId = emp.id || emp.employee_id || emp.employeeId || '';

      // Encabezado del empleado
      if (empIdx > 0) detailRows.push([]); // Línea en blanco entre empleados
      detailRows.push([`EMPLEADO ${empIdx + 1}`, '', '', '', '', '', '', '']);
      detailRows.push(['ID:', employeeId, 'Nombre:', employeeName, '', '', '', '']);
      detailRows.push(['Cédula:', identification, 'Puesto:', position, '', '', '', '']);
      detailRows.push(['Salario por Hora:', `₡${baseHourly.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push([]);

      // Detalle diario de horas trabajadas
      const days = (emp.days || []) as Array<Record<string, unknown>>;
      if (days.length > 0) {
        detailRows.push(['DETALLE DIARIO DE HORAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Horas Trabajadas', 'Es Vacación', 'Mensajes', '', '', '', '']);
        
        days.forEach((day: Record<string, unknown>) => {
          const date = day.date || '';
          const hours = day.hoursWorked || 0;
          const isVacation = day.isVacation ? 'Sí' : 'No';
          const messages = Array.isArray(day.messages) ? day.messages.join('; ') : '';
          
          detailRows.push([
            date,
            (hours as number).toFixed(2),
            isVacation,
            messages,
            '', '', '', ''
          ]);
        });
        
        const totalHoursEmployee = days.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0);
        detailRows.push(['TOTAL HORAS:', totalHoursEmployee.toFixed(2), '', '', '', '', '', '']);
        detailRows.push([]);
      }

      // Resumen de horas (regulares, extras, descanso)
      const regularHours = Number(emp.regularHours || emp.regular_hours || 0);
      const overtimeHours = Number(emp.overtimeHours || emp.overtime_hours || 0);
      const weeklyRestHours2 = Number(emp.weeklyRestHours || emp.weekly_rest_hours || 0);
      const scheduledHours = Number(emp.scheduledHours || emp.scheduled_hours || 0);

      if (scheduledHours > 0 || regularHours > 0 || overtimeHours > 0 || weeklyRestHours2 > 0) {
        detailRows.push(['RESUMEN DE HORAS', '', '', '', '', '', '', '']);
        detailRows.push(['Tipo', 'Cantidad', '', '', '', '', '', '']);
        detailRows.push(['Horas Programadas', scheduledHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas Cumplidas', regularHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas Extras', overtimeHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas de Descanso', weeklyRestHours2.toFixed(2), '', '', '', '', '', '']);
        detailRows.push([]);
      }

      // Deducciones aplicadas
      const deductionsBreakdown = (emp.deductionsBreakdown || emp.deductions_breakdown || []) as Array<Record<string, unknown>>;
      if (deductionsBreakdown.length > 0) {
        detailRows.push(['DEDUCCIONES APLICADAS', '', '', '', '', '', '', '']);
        detailRows.push(['Deducción', 'Tipo', 'Porcentaje/Monto', 'Monto Deducido', '', '', '', '']);
        
        deductionsBreakdown.forEach((ded: Record<string, unknown>) => {
          let deductionName = '';
          let percentageInfo = '';
          
          if (ded.message) {
            const parts = String(ded.message).split(':');
            deductionName = parts[0].trim();
            if (parts[1]) {
              percentageInfo = parts[1].trim();
            }
          } else {
            deductionName = String(ded.code || '').replace(/_/g, ' ') || 'Deducción';
          }

          const deductionAmount = Number(ded.amount || 0);
          const deductionType = ded.type === 'percent' ? 'Porcentaje' : 'Monto fijo';

          detailRows.push([
            deductionName,
            deductionType,
            percentageInfo || '-',
            `₡${deductionAmount.toFixed(2)}`,
            '', '', '', ''
          ]);
        });
        detailRows.push([]);
      }

      // Bonos
      if (bonuses > 0) {
        detailRows.push(['BONOS', '', '', '', '', '', '', '']);
        detailRows.push(['Total Bonos:', `₡${bonuses.toFixed(2)}`, '', '', '', '', '', '']);
        detailRows.push([]);
      }

      // Inconsistencias
      const inconsistencies = (emp.inconsistencies || []) as Array<Record<string, unknown>>;
      if (inconsistencies.length > 0) {
        detailRows.push(['INCONSISTENCIAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Mensaje', '', '', '', '', '', '']);
        
        inconsistencies.forEach((inc: Record<string, unknown>) => {
          const date = inc.date || '';
          const message = inc.message || '';
          detailRows.push([date, message, '', '', '', '', '', '']);
        });
        detailRows.push([]);
      }

      // Mensajes generales
      const generalMessages = (emp.generalMessages || []) as string[];
      if (generalMessages.length > 0) {
        detailRows.push(['MENSAJES GENERALES', '', '', '', '', '', '', '']);
        generalMessages.forEach((msg: string) => {
          detailRows.push([msg, '', '', '', '', '', '', '']);
        });
        detailRows.push([]);
      }

      // Resumen financiero del empleado
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const weeklyRestHours = Number(emp.weeklyRestHours || emp.weekly_rest_hours || 0);
      const weeklyRestPay = Number(emp.weeklyRestPay || emp.weekly_rest_pay || 0);
      const overtimePay = Number(emp.overtimePay || emp.overtime_pay || 0);
      
      detailRows.push(['RESUMEN FINANCIERO', '', '', '', '', '', '', '']);
      detailRows.push(['Salario Base:', `₡${gross.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Pago por Descanso:', `₡${weeklyRestPay.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Pago por Horas Extras:', `₡${overtimePay.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Bonos:', `₡${bonuses.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Total Deducciones:', `₡${deductions.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['SALARIO NETO:', `₡${net.toFixed(2)}`, '', '', '', '', '', '']);
    });

    ws2.addRows(detailRows);
    ws2.columns = [
      { width: 25 }, 
      { width: 20 }, 
      { width: 20 }, 
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // Hoja 3: Resumen de Empleados (tabla compacta)
    const ws3 = workbook.addWorksheet('Tabla Resumen');
    const employeeHeaders = [
      'ID',
      'Nombre',
      'Cédula',
      'Puesto',
      'Horas Trabajadas',
      'Salario/Hora',
      'Salario Bruto',
      'Bonos',
      'Deducciones',
      'Salario Neto'
    ];

    const employeeRows = employees.map((e: unknown) => {
      const emp = e as Record<string, unknown>;
      const employeeName = emp.name || emp.employee_name || emp.employeeName || 'N/A';
      const identification = emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || 'N/A';
      const position = emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || 'N/A';
      const daysArray = (emp.days || []) as Array<Record<string, unknown>>;
      const hoursFromDays = daysArray.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0) || 0;
      const baseHourly = Number(emp.baseHourlySalary || emp.base_hourly_salary || 0);
      const gross = Number(emp.gross || emp.grossSalary || emp.total_gross || 0);
      const bonuses = Number(emp.bonuses || 0);
      const deductions = Number(emp.deductions || emp.totalDeductions || emp.total_deductions || 0);
      const net = Number(emp.net || emp.netSalary || emp.net_salary || 0);
      const employeeId = emp.id || emp.employee_id || emp.employeeId || '';

      return [
        employeeId,
        employeeName,
        identification,
        position,
        hoursFromDays.toFixed(2),
        baseHourly.toFixed(2),
        gross.toFixed(2),
        bonuses.toFixed(2),
        deductions.toFixed(2),
        net.toFixed(2)
      ];
    });

    ws3.addRow(employeeHeaders);
    ws3.addRows(employeeRows);
    ws3.columns = [
      { width: 10 }, // ID
      { width: 30 }, // Nombre
      { width: 15 }, // Cédula
      { width: 20 }, // Puesto
      { width: 15 }, // Horas
      { width: 15 }, // Salario/Hora
      { width: 15 }, // Bruto
      { width: 12 }, // Bonos
      { width: 15 }, // Deducciones
      { width: 15 }  // Neto
    ];

    // Generar nombre de archivo
    const fileName = `Planilla_${periodStart}_${periodEnd}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleRow = (employeeId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedRows(newExpanded);
  };

  const total = (employees && employees.reduce) ? employees.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const netSalary = emp.net ?? emp.netSalary ?? emp.net_salary ?? 0;
    return acc + Number(netSalary);
  }, 0) : null;

  // Calcular totales para las tarjetas
  const totalGross = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const gross = emp.gross ?? emp.grossSalary ?? emp.total_gross ?? 0;
    return acc + Number(gross);
  }, 0) || 0;

  const totalDeductions = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const deductions = emp.deductions ?? emp.totalDeductions ?? emp.total_deductions ?? 0;
    return acc + Number(deductions);
  }, 0) || 0;

  const totalHours = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    // Calculate total hours from days array if available
    const daysArray = (emp.days || []) as Array<Record<string, unknown>>;
    const hoursFromDays = daysArray.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0) || 0;
    const hours = emp.hours ?? emp.total_hours ?? hoursFromDays;
    return acc + Number(hours);
  }, 0) || 0;

  const totalOvertimeHours = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const overtimeHours = emp.overtimeHours ?? emp.overtime_hours ?? 0;
    return acc + Number(overtimeHours);
  }, 0) || 0;

  const totalWeeklyRestHours = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const weeklyRestHours = emp.weeklyRestHours ?? emp.weekly_rest_hours ?? 0;
    return acc + Number(weeklyRestHours);
  }, 0) || 0;

  const totalOvertimePay = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const overtimePay = emp.overtimePay ?? emp.overtime_pay ?? 0;
    return acc + Number(overtimePay);
  }, 0) || 0;

  const totalWeeklyRestPay = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const weeklyRestPay = emp.weeklyRestPay ?? emp.weekly_rest_pay ?? 0;
    return acc + Number(weeklyRestPay);
  }, 0) || 0;

  const totalBonuses = employees?.reduce((acc: number, e: unknown) => {
    const emp = e as Record<string, unknown>;
    const bonuses = emp.bonuses ?? emp.total_bonuses ?? 0;
    return acc + Number(bonuses);
  }, 0) || 0;

  return (
    <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DocumentCheckIcon className="w-6 h-6 text-[#6F7153]" />
          <h3 className="text-xl font-semibold text-[#3B4D36] dark:text-white">Resultados del Cálculo</h3>
        </div>
        <div className="flex gap-3">
          {employees && employees.length > 0 && (
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar Excel
            </button>
          )}
          {onCreate && (
            <button 
              onClick={onCreate} 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors font-medium shadow-sm"
            >
              <DocumentCheckIcon className="w-5 h-5" />
              Guardar planilla
            </button>
          )}
        </div>
      </div>

      {!employees && (
        <div className="p-4 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-lg border border-[#D2B48C] dark:border-gray-700">
          <pre className="overflow-auto text-xs text-[#5D4E37] dark:text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(payrollData, null, 2)}
          </pre>
        </div>
      )}

      {employees && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Fila 1: Datos generales */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="w-5 h-5 text-[#6F7153]" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Empleados</p>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{employees.length}</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-[#8B7355]" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Horas Trabajadas</p>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{totalHours.toFixed(0)}h</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Horas Extras</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{totalOvertimeHours.toFixed(1)}h</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Horas Descanso</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{totalWeeklyRestHours.toFixed(1)}h</p>
            </div>

            {/* Fila 2: Datos monetarios */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-[#A0826D]" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Salario Bruto</p>
              </div>
              <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{formatCRC(totalGross)}</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Pago Horas Extras</p>
              </div>
              <p className="text-lg font-bold text-orange-600">{formatCRC(totalOvertimePay)}</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Pago Descanso</p>
              </div>
              <p className="text-lg font-bold text-blue-600">{formatCRC(totalWeeklyRestPay)}</p>
            </div>

            <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Bonificaciones</p>
              </div>
              <p className="text-lg font-bold text-green-600">{formatCRC(totalBonuses)}</p>
            </div>

            {/* Fila 3: Deducciones y total */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                <p className="text-xs font-medium text-red-700 dark:text-red-400">Total Deducciones</p>
              </div>
              <p className="text-lg font-bold text-red-600">{formatCRC(totalDeductions)}</p>
            </div>

            <div className="bg-[#6F7153] rounded-lg p-4 border border-[#5D614A] shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  <p className="text-sm font-medium text-[#E7DCC1]">TOTAL NETO A PAGAR</p>
                </div>
                <p className="text-3xl font-bold text-white">{formatCRC(total || 0)}</p>
              </div>
            </div>
          </div>

          {/* Tabla de empleados */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg border border-[#E0D6B7] dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E0D6B7] dark:divide-gray-700">
                <thead className="bg-[#E7DCC1] dark:bg-[#2a2a2a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Descanso (h)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      $ Descanso
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      $ Extras
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Bruto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Deducciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Bonificaciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] dark:text-white uppercase tracking-wider">
                      Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-[#E0D6B7] dark:divide-gray-700">
                  {employees.map((e: unknown, idx: number) => {
                    const emp = e as Record<string, unknown>;
                    // DEBUG: Log each employee object
                    console.log('Employee object for display:', emp);
                    console.log('All emp keys:', Object.keys(emp));
                    
                    // Calculate total hours from days array if available
                    const daysArray = (emp.days || []) as Array<Record<string, unknown>>;
                    const totalHoursFromDays = daysArray.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0) || 0;
                    const hours = Number(emp.hours ?? emp.total_hours ?? totalHoursFromDays);
                    const regularHours  = Number(emp.regularHours   ?? emp.regular_hours   ?? 0);
                    const overtimeHours = Number(emp.overtimeHours  ?? emp.overtime_hours  ?? 0);
                    const scheduledHours = Number(emp.scheduledHours ?? emp.scheduled_hours ?? 0);
                    const missingHours  = scheduledHours > 0 ? Math.max(0, scheduledHours - regularHours) : 0;
                    const weeklyRestHours = Number(emp.weeklyRestHours ?? emp.weekly_rest_hours ?? 0);
                    const weeklyRestPay = Number(emp.weeklyRestPay ?? emp.weekly_rest_pay ?? 0);
                    const overtimePay = Number(emp.overtimePay ?? emp.overtime_pay ?? 0);
                    
                    // Get employee details
                    const employeeName = String(emp.name || emp.employee_name || emp.employeeName || emp.employee || `#${emp.employee_id || emp.id}`);
                    const employeeId = Number(emp.employee_id || emp.employeeId || emp.id || idx);
                    const identification = String(emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || '');
                    const position = String(emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || '');
                    
                    console.log('Extracted values - name:', employeeName, 'id:', employeeId, 'identification:', identification, 'position:', position);
                    
                    // Get salary values
                    const grossSalary = Number(emp.gross ?? emp.grossSalary ?? emp.total_gross ?? 0);
                    const totalDeductions = Number(emp.deductions ?? emp.totalDeductions ?? emp.total_deductions ?? 0);
                    const bonuses = Number(emp.bonuses ?? emp.total_bonuses ?? 0);
                    const netSalary = Number(emp.net ?? emp.netSalary ?? emp.net_salary ?? 0);
                    
                    const isExpanded = expandedRows.has(employeeId);
                    
                    // Obtener el desglose de deducciones
                    const deductionsBreakdown = (emp.deductionsBreakdown || emp.deductions_breakdown || []) as Array<Record<string, unknown>>;
                    
                    return (
                      <React.Fragment key={employeeId}>
                        <tr 
                          onClick={() => toggleRow(employeeId)}
                          className={`cursor-pointer hover:bg-[#F9F1DC] dark:hover:bg-[#2a2a2a] transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-[#FEFBF5] dark:bg-[#252525]'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-[#6F7153]" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-[#6F7153]" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-[#3B4D36] dark:text-white">{employeeName}</div>
                                {identification && (
                                  <div className="text-xs text-[#6B5B3D] dark:text-gray-400">{identification}</div>
                                )}
                                {position && (
                                  <div className="text-xs text-[#8B7355] dark:text-gray-500">{position}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {hours > 0 ? (
                              <div className="text-right">
                                <span className="text-sm text-[#5D4E37] dark:text-gray-300">
                                  {regularHours > 0 ? regularHours : hours}
                                </span>
                                {overtimeHours > 0 && (
                                  <span className="block text-xs font-medium text-orange-600">+{overtimeHours}h ext</span>
                                )}
                                {missingHours > 0 && (
                                  <span className="block text-xs text-red-500">{missingHours}h falt</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-[#5D4E37] dark:text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-[#5D4E37] dark:text-gray-300">{weeklyRestHours > 0 ? weeklyRestHours.toFixed(2) : '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-[#5D4E37] dark:text-gray-300">{weeklyRestPay > 0 ? formatCRC(weeklyRestPay) : '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className={`text-sm font-medium ${overtimePay > 0 ? 'text-orange-600' : 'text-[#5D4E37] dark:text-gray-300'}`}>{overtimePay > 0 ? formatCRC(overtimePay) : '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-medium text-[#3B4D36] dark:text-white">{formatCRC(grossSalary)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-red-600 dark:text-red-400">{formatCRC(totalDeductions)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-green-600">{formatCRC(bonuses)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-bold text-[#3B4D36] dark:text-white">{formatCRC(netSalary)}</span>
                          </td>
                        </tr>
                        
                        {/* Fila expandida con desglose de deducciones */}
                        {isExpanded && (
                          <tr className="bg-[#FEFBF5] dark:bg-[#252525] border-t border-[#E0D6B7] dark:border-gray-700">
                            <td colSpan={9} className="px-4 py-0">
                              <div className="py-4 pl-12 pr-4">
                                {/* Resumen de Horas */}
                                {scheduledHours > 0 && (
                                  <div className="bg-white dark:bg-[#2a2a2a] rounded-lg border border-[#E0D6B7] dark:border-gray-700 shadow-sm overflow-hidden mb-4">
                                    <div className="bg-[#E7DCC1] dark:bg-[#333333] px-4 py-2 border-b border-[#D2B48C] dark:border-gray-700">
                                      <h4 className="text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wide">Resumen de Horas</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#E0D6B7] dark:divide-gray-700">
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Programadas</p>
                                        <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{scheduledHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Cumplidas</p>
                                        <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{regularHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Faltantes</p>
                                        <p className={`text-lg font-bold ${missingHours > 0 ? 'text-red-600' : 'text-[#3B4D36] dark:text-white'}`}>{missingHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Extras (×1.5)</p>
                                        <p className={`text-lg font-bold ${overtimeHours > 0 ? 'text-orange-600' : 'text-[#3B4D36] dark:text-white'}`}>{overtimeHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Descanso</p>
                                        <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{weeklyRestHours > 0 ? weeklyRestHours.toFixed(2) : '-'}h</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Resumen de Dinero por Horas */}
                                <div className="bg-white dark:bg-[#2a2a2a] rounded-lg border border-[#E0D6B7] dark:border-gray-700 shadow-sm overflow-hidden mb-4">
                                  <div className="bg-[#E7DCC1] dark:bg-[#333333] px-4 py-2 border-b border-[#D2B48C] dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wide">Desglose de Pagos por Horas</h4>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-[#E0D6B7] dark:divide-gray-700">
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">$ Descanso</p>
                                      <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{weeklyRestPay > 0 ? formatCRC(weeklyRestPay) : '₡0.00'}</p>
                                    </div>
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">$ Extras</p>
                                      <p className={`text-lg font-bold ${overtimePay > 0 ? 'text-orange-600' : 'text-[#3B4D36] dark:text-white'}`}>{overtimePay > 0 ? formatCRC(overtimePay) : '₡0.00'}</p>
                                    </div>
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1">Total Horas</p>
                                      <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{formatCRC(weeklyRestPay + overtimePay)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-4 md:grid-cols-2">
                                  <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide">Salario Base</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{formatCRC(grossSalary)}</p>
                                  </div>
                                  
                                  <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide">Salario Neto</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{formatCRC(netSalary)}</p>
                                  </div>
                                </div>

                                {/* Deducciones */}
                                {deductionsBreakdown && deductionsBreakdown.length > 0 && (
                                  <div className="bg-white dark:bg-[#2a2a2a] rounded-lg border border-[#E0D6B7] dark:border-gray-700 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                      <h4 className="flex items-center gap-2 text-sm font-bold text-red-800 dark:text-red-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                        Deducciones Aplicadas
                                      </h4>
                                    </div>
                                    <div className="divide-y divide-[#E0D6B7] dark:divide-gray-700">
                                      {deductionsBreakdown.map((deduction: unknown, dedIdx: number) => {
                                        const ded = deduction as Record<string, unknown>;
                                        const deductionAmount = Number(ded.amount || 0);
                                        
                                        let deductionName = '';
                                        let percentageInfo = '';
                                        
                                        if (ded.message) {
                                          const parts = String(ded.message).split(':');
                                          deductionName = parts[0].trim();
                                          
                                          if (parts[1]) {
                                            const info = parts[1].trim();
                                            if (info.includes('%')) {
                                              percentageInfo = info;
                                            }
                                          }
                                        } else {
                                          deductionName = String(ded.code || '').replace(/_/g, ' ') || `Deducción ${dedIdx + 1}`;
                                        }
                                        
                                        return (
                                          <div key={dedIdx} className="flex items-center justify-between px-4 py-3 hover:bg-[#F9F1DC] dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                              <div>
                                                <p className="text-sm font-medium text-[#3B4D36] dark:text-white">{deductionName}</p>
                                                {percentageInfo && (
                                                  <p className="text-xs text-[#6B5B3D] dark:text-gray-400">{percentageInfo}</p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                              - {formatCRC(deductionAmount)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="px-4 py-3 border-t-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                      <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-red-900 dark:text-red-300">TOTAL DEDUCCIONES</span>
                                          <span className="text-lg font-bold text-red-700 dark:text-red-400">
                                            - {formatCRC(totalDeductions)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Bonificaciones si existen */}
                                  {bonuses > 0 && (
                                    <div className="mt-3 overflow-hidden bg-white dark:bg-[#2a2a2a] border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
                                      <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20">
                                        <div className="flex items-center justify-between">
                                          <h4 className="flex items-center gap-2 text-sm font-bold text-green-800 dark:text-green-300">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Bonificaciones
                                          </h4>
                                          <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                            + {formatCRC(bonuses)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {(!deductionsBreakdown || deductionsBreakdown.length === 0) && totalDeductions === 0 && (
                                    <div className="p-4 text-center border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                                      <p className="text-sm font-medium text-green-700 dark:text-green-300">✓ No se aplicaron deducciones a este empleado</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  {total !== null && (
                    <tfoot className="bg-[#E7DCC1] dark:bg-[#2a2a2a] border-t-2 border-[#D2B48C] dark:border-gray-700">
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-right">
                          <span className="text-base font-bold text-[#3B4D36] dark:text-white">Total Neto</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-xl font-bold text-[#3B4D36] dark:text-white">{formatCRC(total)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
