"use client";

import React, { useState } from 'react';
import { formatCRC } from '@/utils/number';
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

const CARD_CLASS = "bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm";
const DASH = '-';
const DEFAULT_TEXT_CLASS = "text-zinc-700 dark:text-white";
const DEFAULT_SPAN_CLASS = "text-zinc-600 dark:text-zinc-300";
const FONT_MEDIUM = "text-sm font-medium";
// eslint-disable-next-line sonarjs/cognitive-complexity
const extractEmployeeFields = (emp: Record<string, unknown>, idx: number) => {
  const daysArray = (emp.days || []) as Array<Record<string, unknown>>;
  const totalHoursFromDays = daysArray.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0) || 0;
  const hours = Number(emp.hours ?? emp.total_hours ?? totalHoursFromDays);
  const regularHours = Number(emp.regularHours ?? emp.regular_hours ?? 0);
  const overtimeHours = Number(emp.overtimeHours ?? emp.overtime_hours ?? 0);
  const scheduledHours = Number(emp.scheduledHours ?? emp.scheduled_hours ?? 0);
  const missingHours = scheduledHours > 0 ? Math.max(0, scheduledHours - regularHours) : 0;
  const weeklyRestHours = Number(emp.weeklyRestHours ?? emp.weekly_rest_hours ?? 0);
  const weeklyRestPay = Number(emp.weeklyRestPay ?? emp.weekly_rest_pay ?? 0);
  const overtimePay = Number(emp.overtimePay ?? emp.overtime_pay ?? 0);
  const employeeName = String(emp.name || emp.employee_name || emp.employeeName || emp.employee || `#${emp.employee_id || emp.id}`);
  const employeeId = Number(emp.employee_id || emp.employeeId || emp.id || idx);
  const identification = String(emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || '');
  const position = String(emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || '');
  const grossSalary = Number(emp.gross ?? emp.grossSalary ?? emp.total_gross ?? 0);
  const totalDeductions = Number(emp.deductions ?? emp.totalDeductions ?? emp.total_deductions ?? 0);
  const bonuses = Number(emp.bonuses ?? emp.total_bonuses ?? 0);
  const netSalary = Number(emp.net ?? emp.netSalary ?? emp.net_salary ?? 0);
  const deductionsBreakdown = (emp.deductionsBreakdown || emp.deductions_breakdown || []) as Array<Record<string, unknown>>;
  return { hours, regularHours, overtimeHours, scheduledHours, missingHours, weeklyRestHours, weeklyRestPay, overtimePay, employeeName, employeeId, identification, position, grossSalary, totalDeductions, bonuses, netSalary, deductionsBreakdown };
};

export default function PayrollResults({ data, onCreate }: PayrollResultsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Cast data to a workable type
  const payrollData = (data || {}) as Record<string, unknown>;
  const employees = payrollData.employees as unknown[] | undefined;

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const getEmployeeExcelData = (emp: Record<string, unknown>) => {
    return {
      name: emp.name || emp.employee_name || emp.employeeName || 'N/A',
      identification: emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || 'N/A',
      position: emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || 'N/A',
      baseHourly: Number(emp.baseHourlySalary || emp.base_hourly_salary || 0),
      gross: Number(emp.gross || emp.grossSalary || emp.total_gross || 0),
      bonuses: Number(emp.bonuses || 0),
      deductions: Number(emp.deductions || emp.totalDeductions || emp.total_deductions || 0),
      net: Number(emp.net || emp.netSalary || emp.net_salary || 0),
      employeeId: emp.id || emp.employee_id || emp.employeeId || '',
      days: (emp.days || []) as Array<Record<string, unknown>>,
      deductionsBreakdown: (emp.deductionsBreakdown || emp.deductions_breakdown || []) as Array<Record<string, unknown>>,
      inconsistencies: (emp.inconsistencies || []) as Array<Record<string, unknown>>,
      generalMessages: (emp.generalMessages || []) as string[],
      regularHours: Number(emp.regularHours || emp.regular_hours || 0),
      overtimeHours: Number(emp.overtimeHours || emp.overtime_hours || 0),
      weeklyRestHours: Number(emp.weeklyRestHours || emp.weekly_rest_hours || 0),
      scheduledHours: Number(emp.scheduledHours || emp.scheduled_hours || 0),
      weeklyRestPay: Number(emp.weeklyRestPay || emp.weekly_rest_pay || 0),
      overtimePay: Number(emp.overtimePay || emp.overtime_pay || 0),
    };
  };

  const exportToExcel = async () => {
    if (!employees || employees.length === 0) return;

    const ExcelJS = (await import('exceljs')).default;
    const period = payrollData.period as Record<string, unknown> | undefined;
    const periodStart = period?.startDate || payrollData.periodStart || '';
    const periodEnd = period?.endDate || payrollData.periodEnd || '';

    const workbook = new ExcelJS.Workbook();
    const ws1 = workbook.addWorksheet('Resumen General');
    ws1.addRows([
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
    ]);
    ws1.columns = [{ width: 25 }, { width: 30 }];

    const ws2 = workbook.addWorksheet('Detalle Completo');
    const detailRows: unknown[][] = [];

    employees.forEach((e: unknown, empIdx: number) => {
      const emp = getEmployeeExcelData(e as Record<string, unknown>);
      if (empIdx > 0) detailRows.push([]);
      detailRows.push([`EMPLEADO ${empIdx + 1}`, '', '', '', '', '', '', '']);
      detailRows.push(['ID:', emp.employeeId, 'Nombre:', emp.name, '', '', '', '']);
      detailRows.push(['Cédula:', emp.identification, 'Puesto:', emp.position, '', '', '', '']);
      detailRows.push(['Salario por Hora:', `₡${emp.baseHourly.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push([]);

      if (emp.days.length > 0) {
        detailRows.push(['DETALLE DIARIO DE HORAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Horas Trabajadas', 'Es Vacación', 'Mensajes', '', '', '', '']);
        emp.days.forEach((day: Record<string, unknown>) => {
          detailRows.push([day.date || '', (day.hoursWorked as number || 0).toFixed(2), day.isVacation ? 'Sí' : 'No', Array.isArray(day.messages) ? day.messages.join('; ') : '', '', '', '', '']);
        });
        const totalHoursEmployee = emp.days.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0);
        detailRows.push(['TOTAL HORAS:', totalHoursEmployee.toFixed(2), '', '', '', '', '', '']);
        detailRows.push([]);
      }

      if (emp.scheduledHours > 0 || emp.regularHours > 0 || emp.overtimeHours > 0 || emp.weeklyRestHours > 0) {
        detailRows.push(['RESUMEN DE HORAS', '', '', '', '', '', '', '']);
        detailRows.push(['Tipo', 'Cantidad', '', '', '', '', '', '']);
        detailRows.push(['Horas Programadas', emp.scheduledHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas Cumplidas', emp.regularHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas Extras', emp.overtimeHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push(['Horas de Descanso', emp.weeklyRestHours.toFixed(2), '', '', '', '', '', '']);
        detailRows.push([]);
      }

      if (emp.deductionsBreakdown.length > 0) {
        detailRows.push(['DEDUCCIONES APLICADAS', '', '', '', '', '', '', '']);
        detailRows.push(['Deducción', 'Tipo', 'Porcentaje/Monto', 'Monto Deducido', '', '', '', '']);
        emp.deductionsBreakdown.forEach((ded: Record<string, unknown>) => {
          const parts = String(ded.message || '').split(':');
          detailRows.push([parts[0].trim() || String(ded.code || '').replace(/_/g, ' ') || 'Deducción', ded.type === 'percent' ? 'Porcentaje' : 'Monto fijo', parts[1]?.trim() || '-', `₡${Number(ded.amount || 0).toFixed(2)}`, '', '', '', '']);
        });
        detailRows.push([]);
      }

      if (emp.bonuses > 0) {
        detailRows.push(['BONOS', '', '', '', '', '', '', '']);
        detailRows.push(['Total Bonos:', `₡${emp.bonuses.toFixed(2)}`, '', '', '', '', '', '']);
        detailRows.push([]);
      }

      if (emp.inconsistencies.length > 0) {
        detailRows.push(['INCONSISTENCIAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Mensaje', '', '', '', '', '', '']);
        emp.inconsistencies.forEach((inc: Record<string, unknown>) => detailRows.push([inc.date || '', inc.message || '', '', '', '', '', '', '']));
        detailRows.push([]);
      }

      if (emp.generalMessages.length > 0) {
        detailRows.push(['MENSAJES GENERALES', '', '', '', '', '', '', '']);
        emp.generalMessages.forEach((msg: string) => detailRows.push([msg, '', '', '', '', '', '', '']));
        detailRows.push([]);
      }
      
      detailRows.push(['RESUMEN FINANCIERO', '', '', '', '', '', '', '']);
      detailRows.push(['Salario Base:', `₡${emp.gross.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Pago por Descanso:', `₡${emp.weeklyRestPay.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Pago por Horas Extras:', `₡${emp.overtimePay.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Bonos:', `₡${emp.bonuses.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Total Deducciones:', `₡${emp.deductions.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['SALARIO NETO:', `₡${emp.net.toFixed(2)}`, '', '', '', '', '', '']);
    });

    ws2.addRows(detailRows);
    ws2.columns = [{ width: 25 }, { width: 20 }, { width: 20 }, { width: 40 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];

    const ws3 = workbook.addWorksheet('Tabla Resumen');
    ws3.addRow(['ID', 'Nombre', 'Cédula', 'Puesto', 'Horas Trabajadas', 'Salario/Hora', 'Salario Bruto', 'Bonos', 'Deducciones', 'Salario Neto']);
    employees.forEach((e: unknown) => {
      const emp = getEmployeeExcelData(e as Record<string, unknown>);
      const hoursFromDays = emp.days.reduce((sum: number, day: Record<string, unknown>) => sum + ((day.hoursWorked as number) || 0), 0) || 0;
      ws3.addRow([emp.employeeId, emp.name, emp.identification, emp.position, hoursFromDays.toFixed(2), emp.baseHourly.toFixed(2), emp.gross.toFixed(2), emp.bonuses.toFixed(2), emp.deductions.toFixed(2), emp.net.toFixed(2)]);
    });
    ws3.columns = [{ width: 10 }, { width: 30 }, { width: 15 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 15 }];

    const fileName = `Planilla_${periodStart}_${periodEnd}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 gap-3 mb-4 md:grid-cols-5">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <UserGroupIcon className="w-4 h-4 text-green-700" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Empleados</p>
        </div>
        <p className="text-2xl font-bold text-zinc-700 dark:text-white">{employees!.length}</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <ClockIcon className="w-4 h-4 text-zinc-400" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Trabajadas</p>
        </div>
        <p className="text-2xl font-bold text-zinc-700 dark:text-white">{totalHours.toFixed(0)}h</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <ClockIcon className="w-4 h-4 text-orange-600" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Extras</p>
        </div>
        <p className="text-2xl font-bold text-orange-600">{totalOvertimeHours.toFixed(1)}h</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <ClockIcon className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Descanso</p>
        </div>
        <p className="text-2xl font-bold text-blue-600">{totalWeeklyRestHours.toFixed(1)}h</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollarIcon className="w-4 h-4 text-zinc-500" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Salario Bruto</p>
        </div>
        <p className="text-base font-bold text-zinc-700 dark:text-white">{formatCRC(totalGross)}</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollarIcon className="w-4 h-4 text-orange-600" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pago Horas Extras</p>
        </div>
        <p className="text-base font-bold text-orange-600">{formatCRC(totalOvertimePay)}</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pago Descanso</p>
        </div>
        <p className="text-base font-bold text-blue-600">{formatCRC(totalWeeklyRestPay)}</p>
      </div>

      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Bonificaciones</p>
        </div>
        <p className="text-base font-bold text-green-600">{formatCRC(totalBonuses)}</p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollarIcon className="w-4 h-4 text-red-600" />
          <p className="text-xs font-medium text-red-700 dark:text-red-400">Total Deducciones</p>
        </div>
        <p className="text-base font-bold text-red-600">{formatCRC(totalDeductions)}</p>
      </div>

      <div className="bg-green-700 rounded-lg p-3 border border-green-800 shadow-sm col-span-full md:col-span-1">
        <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-4 h-4 text-white" />
            <p className="text-xs font-medium text-zinc-200">TOTAL NETO</p>
          </div>
          <p className="text-xl font-bold text-white">{formatCRC(total || 0)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DocumentCheckIcon className="w-6 h-6 text-green-700" />
          <h3 className="text-xl font-semibold text-zinc-700 dark:text-white">Resultados del Cálculo</h3>
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
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium shadow-sm"
            >
              <DocumentCheckIcon className="w-5 h-5" />
              Guardar planilla
            </button>
          )}
        </div>
      </div>

      {!employees && (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700">
          <pre className="overflow-auto text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
            {JSON.stringify(payrollData, null, 2)}
          </pre>
        </div>
      )}

      {employees && (
        <>
          {renderSummaryCards()}

          {/* Tabla de empleados */}
          <div className="bg-white dark:bg-zinc-900 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E0D6B7] dark:divide-gray-700">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Descanso (h)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      $ Descanso
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      $ Extras
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Bruto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Deducciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Bonificaciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">
                      Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 dark:bg-zinc-900 divide-y divide-[#E0D6B7] dark:divide-gray-700">
                  {/* eslint-disable-next-line sonarjs/cognitive-complexity */}
                  {employees.map((e: unknown, idx: number) => {
                    const emp = e as Record<string, unknown>;
                    // DEBUG: Log each employee object
                    console.log('Employee object for display:', emp);
                    console.log('All emp keys:', Object.keys(emp));

                    const { hours, regularHours, overtimeHours, scheduledHours, missingHours, weeklyRestHours, weeklyRestPay, overtimePay, employeeName, employeeId, identification, position, grossSalary, totalDeductions, bonuses, netSalary, deductionsBreakdown } = extractEmployeeFields(emp, idx);

                    const isExpanded = expandedRows.has(employeeId);
                    
                    return (
                      <React.Fragment key={employeeId}>
                        <tr 
                          onClick={() => toggleRow(employeeId)}
                          className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#2a2a2a] transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-green-700" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-green-700" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-zinc-700 dark:text-white">{employeeName}</div>
                                {identification && (
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{identification}</div>
                                )}
                                {position && (
                                  <div className="text-xs text-zinc-400 dark:text-zinc-500">{position}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {hours > 0 ? (
                              <div className="text-right">
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
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
                              <span className="text-sm text-zinc-600 dark:text-zinc-300">{weeklyRestHours > 0 ? weeklyRestHours.toFixed(2) : DASH}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">{weeklyRestHours > 0 ? weeklyRestHours.toFixed(2) : DASH}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">{weeklyRestPay > 0 ? formatCRC(weeklyRestPay) : DASH}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {/* eslint-disable-next-line sonarjs/no-duplicate-string */}
                            <span className={`${FONT_MEDIUM} ${overtimePay > 0 ? 'text-orange-600' : DEFAULT_SPAN_CLASS}`}>{overtimePay > 0 ? formatCRC(overtimePay) : DASH}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-medium text-zinc-700 dark:text-white">{formatCRC(grossSalary)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-red-600 dark:text-red-400">{formatCRC(totalDeductions)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm text-green-600">{formatCRC(bonuses)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-bold text-zinc-700 dark:text-white">{formatCRC(netSalary)}</span>
                          </td>
                        </tr>
                        
                        {/* Fila expandida con desglose de deducciones */}
                        {isExpanded && (
                          <tr className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
                            <td colSpan={9} className="px-4 py-0">
                              <div className="py-4 pl-12 pr-4">
                                {/* Resumen de Horas */}
                                {scheduledHours > 0 && (
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-4">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 border-b border-zinc-300 dark:border-zinc-700">
                                      <h4 className="text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wide">Resumen de Horas</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#E0D6B7] dark:divide-gray-700">
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Programadas</p>
                                        <p className="text-lg font-bold text-zinc-700 dark:text-white">{scheduledHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Cumplidas</p>
                                        <p className="text-lg font-bold text-zinc-700 dark:text-white">{regularHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Faltantes</p>
                                        <p className={`text-lg font-bold ${missingHours > 0 ? 'text-red-600' : DEFAULT_TEXT_CLASS}`}>{missingHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Extras (×1.5)</p>
                                        <p className={`text-lg font-bold ${overtimeHours > 0 ? 'text-orange-600' : DEFAULT_TEXT_CLASS}`}>{overtimeHours}h</p>
                                      </div>
                                      <div className="px-4 py-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Descanso</p>
                                        <p className="text-lg font-bold text-zinc-700 dark:text-white">{weeklyRestHours > 0 ? weeklyRestHours.toFixed(2) : DASH}h</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Resumen de Dinero por Horas */}
                                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-4">
                                  <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 border-b border-zinc-300 dark:border-zinc-700">
                                    <h4 className="text-xs font-bold text-zinc-700 dark:text-white uppercase tracking-wide">Desglose de Pagos por Horas</h4>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-[#E0D6B7] dark:divide-gray-700">
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">$ Descanso</p>
                                      <p className="text-lg font-bold text-zinc-700 dark:text-white">{weeklyRestPay > 0 ? formatCRC(weeklyRestPay) : '₡0.00'}</p>
                                    </div>
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">$ Extras</p>
                                      <p className={`text-lg font-bold ${overtimePay > 0 ? 'text-orange-600' : 'text-zinc-700 dark:text-white'}`}>{overtimePay > 0 ? formatCRC(overtimePay) : '₡0.00'}</p>
                                    </div>
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Horas</p>
                                      <p className="text-lg font-bold text-zinc-700 dark:text-white">{formatCRC(weeklyRestPay + overtimePay)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-4 md:grid-cols-2">
                                  <div className={CARD_CLASS}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Salario Base</span>
                                    </div>
                                    <p className="text-lg font-bold text-zinc-700 dark:text-white">{formatCRC(grossSalary)}</p>
                                  </div>
                                  
                                  <div className={CARD_CLASS}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Salario Neto</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{formatCRC(netSalary)}</p>
                                  </div>
                                </div>

                                {/* Deducciones */}
                                {deductionsBreakdown && deductionsBreakdown.length > 0 && (
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
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
                                          <div key={dedIdx} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                              <div>
                                                <p className="text-sm font-medium text-zinc-700 dark:text-white">{deductionName}</p>
                                                {percentageInfo && (
                                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{percentageInfo}</p>
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
                                    <div className="mt-3 overflow-hidden bg-white dark:bg-zinc-800 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
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
                    <tfoot className="bg-zinc-100 dark:bg-zinc-800 border-t-2 border-zinc-300 dark:border-zinc-700">
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-right">
                          <span className="text-base font-bold text-zinc-700 dark:text-white">Total Neto</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-xl font-bold text-zinc-700 dark:text-white">{formatCRC(total)}</span>
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
