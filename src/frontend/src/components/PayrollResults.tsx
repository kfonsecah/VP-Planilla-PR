"use client";

import React, { useState } from 'react';
import { formatCRC } from '@/utils/number';
import * as XLSX from 'xlsx';
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
  data: any;
  onCreate?: () => void;
}

export default function PayrollResults({ data, onCreate }: PayrollResultsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // DEBUG: Log what we receive
  console.log('PayrollResults received data:', data);
  console.log('data.employees:', data?.employees);
  console.log('data.employeeResults:', data?.employeeResults);
  
  if (!data) return null;

  // Try to find an array of employee results
  const employees = Array.isArray(data.employeeResults) ? data.employeeResults : Array.isArray(data.employees) ? data.employees : Array.isArray(data) ? data : null;
  
  console.log('Extracted employees:', employees);

  const exportToExcel = () => {
    if (!employees || employees.length === 0) return;

    // Obtener información del periodo
    const periodStart = data.period?.startDate || data.periodStart || '';
    const periodEnd = data.period?.endDate || data.periodEnd || '';

    // Hoja 1: Resumen General
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

    // Hoja 2: Detalle Completo por Empleado (como la tabla del sistema)
    const detailRows: any[] = [];

    employees.forEach((e: any, empIdx: number) => {
      console.log('Employee data for Excel:', e);
      const employeeName = e.name || e.employee_name || e.employeeName || 'N/A';
      const identification = e.identification || e.employee_identification || e.national_id || e.employee_national_id || e.nationalId || e.cedula || 'N/A';
      const position = e.position || e.position_name || e.positionName || e.positionId || e.position_id || 'N/A';
      const baseHourly = e.baseHourlySalary || e.base_hourly_salary || 0;
      const gross = e.gross || e.grossSalary || e.total_gross || 0;
      const bonuses = e.bonuses || 0;
      const deductions = e.deductions || e.totalDeductions || e.total_deductions || 0;
      const net = e.net || e.netSalary || e.net_salary || 0;
      const employeeId = e.id || e.employee_id || e.employeeId || '';

      // Encabezado del empleado
      if (empIdx > 0) detailRows.push([]); // Línea en blanco entre empleados
      detailRows.push([`EMPLEADO ${empIdx + 1}`, '', '', '', '', '', '', '']);
      detailRows.push(['ID:', employeeId, 'Nombre:', employeeName, '', '', '', '']);
      detailRows.push(['Cédula:', identification, 'Puesto:', position, '', '', '', '']);
      detailRows.push(['Salario por Hora:', `₡${baseHourly.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push([]);

      // Detalle diario de horas trabajadas
      const days = e.days || [];
      if (days.length > 0) {
        detailRows.push(['DETALLE DIARIO DE HORAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Horas Trabajadas', 'Es Vacación', 'Mensajes', '', '', '', '']);
        
        days.forEach((day: any) => {
          const date = day.date || '';
          const hours = day.hoursWorked || 0;
          const isVacation = day.isVacation ? 'Sí' : 'No';
          const messages = day.messages?.join('; ') || '';
          
          detailRows.push([
            date,
            hours.toFixed(2),
            isVacation,
            messages,
            '', '', '', ''
          ]);
        });
        
        const totalHoursEmployee = days.reduce((sum: number, day: any) => sum + (day.hoursWorked || 0), 0);
        detailRows.push(['TOTAL HORAS:', totalHoursEmployee.toFixed(2), '', '', '', '', '', '']);
        detailRows.push([]);
      }

      // Deducciones aplicadas
      const deductionsBreakdown = e.deductionsBreakdown || e.deductions_breakdown || [];
      if (deductionsBreakdown.length > 0) {
        detailRows.push(['DEDUCCIONES APLICADAS', '', '', '', '', '', '', '']);
        detailRows.push(['Deducción', 'Tipo', 'Porcentaje/Monto', 'Monto Deducido', '', '', '', '']);
        
        deductionsBreakdown.forEach((ded: any) => {
          let deductionName = '';
          let percentageInfo = '';
          
          if (ded.message) {
            const parts = ded.message.split(':');
            deductionName = parts[0].trim();
            if (parts[1]) {
              percentageInfo = parts[1].trim();
            }
          } else {
            deductionName = ded.code?.replace(/_/g, ' ') || 'Deducción';
          }

          const deductionAmount = ded.amount || 0;
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
      const inconsistencies = e.inconsistencies || [];
      if (inconsistencies.length > 0) {
        detailRows.push(['INCONSISTENCIAS', '', '', '', '', '', '', '']);
        detailRows.push(['Fecha', 'Mensaje', '', '', '', '', '', '']);
        
        inconsistencies.forEach((inc: any) => {
          const date = inc.date || '';
          const message = inc.message || '';
          detailRows.push([date, message, '', '', '', '', '', '']);
        });
        detailRows.push([]);
      }

      // Mensajes generales
      const generalMessages = e.generalMessages || [];
      if (generalMessages.length > 0) {
        detailRows.push(['MENSAJES GENERALES', '', '', '', '', '', '', '']);
        generalMessages.forEach((msg: string) => {
          detailRows.push([msg, '', '', '', '', '', '', '']);
        });
        detailRows.push([]);
      }

      // Resumen financiero del empleado
      detailRows.push(['RESUMEN FINANCIERO', '', '', '', '', '', '', '']);
      detailRows.push(['Salario Base:', `₡${gross.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Bonos:', `₡${bonuses.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['Total Deducciones:', `₡${deductions.toFixed(2)}`, '', '', '', '', '', '']);
      detailRows.push(['SALARIO NETO:', `₡${net.toFixed(2)}`, '', '', '', '', '', '']);
    });

    // Hoja 3: Resumen de Empleados (tabla compacta)
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

    const employeeRows = employees.map((e: any) => {
      const employeeName = e.name || e.employee_name || e.employeeName || 'N/A';
      const identification = e.identification || e.employee_identification || e.national_id || e.employee_national_id || e.nationalId || e.cedula || 'N/A';
      const position = e.position || e.position_name || e.positionName || e.positionId || e.position_id || 'N/A';
      const hoursFromDays = e.days?.reduce((sum: number, day: any) => sum + (day.hoursWorked || 0), 0) || 0;
      const baseHourly = e.baseHourlySalary || e.base_hourly_salary || 0;
      const gross = e.gross || e.grossSalary || e.total_gross || 0;
      const bonuses = e.bonuses || 0;
      const deductions = e.deductions || e.totalDeductions || e.total_deductions || 0;
      const net = e.net || e.netSalary || e.net_salary || 0;
      const employeeId = e.id || e.employee_id || e.employeeId || '';

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

    const employeeSummaryData = [employeeHeaders, ...employeeRows];

    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();

    // Agregar hojas
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
    const ws3 = XLSX.utils.aoa_to_sheet(employeeSummaryData);

    // Ajustar anchos de columna
    ws1['!cols'] = [{ wch: 25 }, { wch: 30 }];
    ws2['!cols'] = [
      { wch: 25 }, 
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    ws3['!cols'] = [
      { wch: 10 }, // ID
      { wch: 30 }, // Nombre
      { wch: 15 }, // Cédula
      { wch: 20 }, // Puesto
      { wch: 15 }, // Horas
      { wch: 15 }, // Salario/Hora
      { wch: 15 }, // Bruto
      { wch: 12 }, // Bonos
      { wch: 15 }, // Deducciones
      { wch: 15 }  // Neto
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General');
    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Completo');
    XLSX.utils.book_append_sheet(wb, ws3, 'Tabla Resumen');

    // Generar nombre de archivo
    const fileName = `Planilla_${periodStart}_${periodEnd}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);
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

  const total = (employees && employees.reduce) ? employees.reduce((acc: number, e: any) => {
    const netSalary = e.net ?? e.netSalary ?? e.net_salary ?? 0;
    return acc + Number(netSalary);
  }, 0) : null;

  // Calcular totales para las tarjetas
  const totalGross = employees?.reduce((acc: number, e: any) => {
    const gross = e.gross ?? e.grossSalary ?? e.total_gross ?? 0;
    return acc + Number(gross);
  }, 0) || 0;

  const totalDeductions = employees?.reduce((acc: number, e: any) => {
    const deductions = e.deductions ?? e.totalDeductions ?? e.total_deductions ?? 0;
    return acc + Number(deductions);
  }, 0) || 0;

  const totalHours = employees?.reduce((acc: number, e: any) => {
    // Calculate total hours from days array if available
    const hoursFromDays = e.days?.reduce((sum: number, day: any) => sum + (day.hoursWorked || 0), 0) || 0;
    const hours = e.hours ?? e.total_hours ?? hoursFromDays;
    return acc + Number(hours);
  }, 0) || 0;

  return (
    <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DocumentCheckIcon className="w-6 h-6 text-[#6F7153]" />
          <h3 className="text-xl font-semibold text-[#3B4D36]">Resultados del Cálculo</h3>
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
        <div className="p-4 bg-[#E7DCC1] rounded-lg border border-[#D2B48C]">
          <pre className="overflow-auto text-xs text-[#5D4E37] whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {employees && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-[#E0D6B7] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="w-5 h-5 text-[#6F7153]" />
                <p className="text-xs font-medium text-[#6B5B3D]">Empleados</p>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36]">{employees.length}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-[#E0D6B7] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-[#8B7355]" />
                <p className="text-xs font-medium text-[#6B5B3D]">Horas Totales</p>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36]">{totalHours.toFixed(0)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-[#E0D6B7] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-[#A0826D]" />
                <p className="text-xs font-medium text-[#6B5B3D]">Total Bruto</p>
              </div>
              <p className="text-xl font-bold text-[#3B4D36]">{formatCRC(totalGross)}</p>
            </div>

            <div className="bg-[#6F7153] rounded-lg p-4 border border-[#5D614A] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
                <p className="text-xs font-medium text-[#E7DCC1]">Total Neto</p>
              </div>
              <p className="text-xl font-bold text-white">{formatCRC(total || 0)}</p>
            </div>
          </div>

          {/* Tabla de empleados */}
          <div className="bg-white rounded-lg border border-[#E0D6B7] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E0D6B7]">
                <thead className="bg-[#E7DCC1]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Bruto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Deducciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Bonificaciones
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#3B4D36] uppercase tracking-wider">
                      Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E0D6B7]">
                  {employees.map((emp: any, idx: number) => {
                    // DEBUG: Log each employee object
                    console.log('Employee object for display:', emp);
                    console.log('All emp keys:', Object.keys(emp));
                    
                    // Calculate total hours from days array if available
                    const totalHours = emp.days?.reduce((sum: number, day: any) => sum + (day.hoursWorked || 0), 0) || 0;
                    const hours = emp.hours ?? emp.total_hours ?? totalHours;
                    
                    // Get employee details
                    const employeeName = emp.name || emp.employee_name || emp.employeeName || emp.employee || `#${emp.employee_id || emp.id}`;
                    const employeeId = emp.employee_id || emp.employeeId || emp.id || idx;
                    const identification = emp.identification || emp.employee_identification || emp.national_id || emp.employee_national_id || emp.nationalId || emp.cedula || '';
                    const position = emp.position || emp.position_name || emp.positionName || emp.positionId || emp.position_id || '';
                    
                    console.log('Extracted values - name:', employeeName, 'id:', employeeId, 'identification:', identification, 'position:', position);
                    
                    // Get salary values
                    const grossSalary = emp.gross ?? emp.grossSalary ?? emp.total_gross ?? 0;
                    const totalDeductions = emp.deductions ?? emp.totalDeductions ?? emp.total_deductions ?? 0;
                    const bonuses = emp.bonuses ?? emp.total_bonuses ?? 0;
                    const netSalary = emp.net ?? emp.netSalary ?? emp.net_salary ?? 0;
                    
                    const isExpanded = expandedRows.has(employeeId);
                    
                    // Obtener el desglose de deducciones
                    const deductionsBreakdown = emp.deductionsBreakdown || emp.deductions_breakdown || [];
                    
                    return (
                      <React.Fragment key={employeeId}>
                        <tr 
                          onClick={() => toggleRow(employeeId)}
                          className={`cursor-pointer hover:bg-[#F9F1DC] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FEFBF5]'}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4 text-[#6F7153]" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-[#6F7153]" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-[#3B4D36]">{employeeName}</div>
                                {identification && (
                                  <div className="text-xs text-[#6B5B3D]">{identification}</div>
                                )}
                                {position && (
                                  <div className="text-xs text-[#8B7355]">{position}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-[#5D4E37]">{hours > 0 ? hours : '-'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-[#3B4D36]">{formatCRC(grossSalary)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-red-600">{formatCRC(totalDeductions)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm text-green-600">{formatCRC(bonuses)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-bold text-[#3B4D36]">{formatCRC(netSalary)}</span>
                          </td>
                        </tr>
                        
                        {/* Fila expandida con desglose de deducciones */}
                        {isExpanded && (
                          <tr className="bg-[#FEFBF5] border-t border-[#E0D6B7]">
                            <td colSpan={6} className="px-4 py-0">
                              <div className="py-4 pl-12 pr-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                  <div className="bg-white rounded-lg p-4 border border-[#E0D6B7] shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-[#6B5B3D] uppercase tracking-wide">Salario Base</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#3B4D36]">{formatCRC(grossSalary)}</p>
                                  </div>
                                  
                                  <div className="bg-white rounded-lg p-4 border border-[#E0D6B7] shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-[#6B5B3D] uppercase tracking-wide">Salario Neto</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{formatCRC(netSalary)}</p>
                                  </div>
                                </div>

                                {/* Deducciones */}
                                {deductionsBreakdown && deductionsBreakdown.length > 0 && (
                                  <div className="bg-white rounded-lg border border-[#E0D6B7] shadow-sm overflow-hidden">
                                    <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 border-b border-red-200">
                                      <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                        Deducciones Aplicadas
                                      </h4>
                                    </div>
                                    <div className="divide-y divide-[#E0D6B7]">
                                      {deductionsBreakdown.map((deduction: any, dedIdx: number) => {
                                        // El backend envía: { code, type, amount, message }
                                        // message tiene el formato: "Nombre: porcentaje%" o "Nombre: ₡monto"
                                        
                                        const deductionAmount = deduction.amount || 0;
                                        
                                        // Extraer el nombre del message (antes de los dos puntos)
                                        let deductionName = '';
                                        let percentageInfo = '';
                                        
                                        if (deduction.message) {
                                          const parts = deduction.message.split(':');
                                          deductionName = parts[0].trim();
                                          
                                          // Si hay información adicional (porcentaje o monto), extraerla
                                          if (parts[1]) {
                                            const info = parts[1].trim();
                                            // Verificar si es un porcentaje
                                            if (info.includes('%')) {
                                              percentageInfo = info;
                                            }
                                          }
                                        } else {
                                          // Fallback si no hay message
                                          deductionName = deduction.code?.replace(/_/g, ' ') || `Deducción ${dedIdx + 1}`;
                                        }
                                        
                                        return (
                                          <div key={dedIdx} className="flex items-center justify-between px-4 py-3 hover:bg-[#F9F1DC] transition-colors">
                                            <div className="flex items-center gap-3">
                                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                              <div>
                                                <p className="text-sm font-medium text-[#3B4D36]">{deductionName}</p>
                                                {percentageInfo && (
                                                  <p className="text-xs text-[#6B5B3D]">{percentageInfo}</p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">
                                              - {formatCRC(deductionAmount)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="bg-red-50 px-4 py-3 border-t-2 border-red-300">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-red-900">TOTAL DEDUCCIONES</span>
                                        <span className="text-lg font-bold text-red-700">
                                          - {formatCRC(totalDeductions)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Bonificaciones si existen */}
                                {bonuses > 0 && (
                                  <div className="mt-3 bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3">
                                      <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          Bonificaciones
                                        </h4>
                                        <span className="text-lg font-bold text-green-700">
                                          + {formatCRC(bonuses)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(!deductionsBreakdown || deductionsBreakdown.length === 0) && totalDeductions === 0 && (
                                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                                    <p className="text-sm text-green-700 font-medium">✓ No se aplicaron deducciones a este empleado</p>
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
                  <tfoot className="bg-[#E7DCC1] border-t-2 border-[#D2B48C]">
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-right">
                        <span className="text-base font-bold text-[#3B4D36]">Total Neto</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-xl font-bold text-[#3B4D36]">{formatCRC(total)}</span>
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
