"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { PayrollService, Payroll, PayrollEmployee } from '@/services/payrollService';
import { formatCRC } from '@/utils/number';
import ExcelJS from 'exceljs';
import { useModal } from '@/hooks/useModal';

export default function PayrollDetailPage() {
  const pathname = usePathname();
  const modal = useModal();
  const [payrollId, setPayrollId] = useState<number | null>(null);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parts = pathname?.split('/') || [];
    const last = parts[parts.length - 1];
    const parsed = Number(last);
    if (!isNaN(parsed)) setPayrollId(parsed);
  }, [pathname]);

  useEffect(() => {
    if (!payrollId) return;
    loadPayrollDetails(payrollId);
  }, [payrollId]);

  const loadPayrollDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const payrollData = await PayrollService.getPayrollById(id);
      setPayroll(payrollData);
      const employeesData = await PayrollService.getPayrollEmployees(id);
      setEmployees(employeesData);
    } catch (err) {
      const message = (err as Error)?.message || 'Error al cargar los detalles de la planilla';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!payrollId || !payroll) return;
    
    modal.showConfirmation(
      'Confirmar acción',
      '¿Estás seguro de marcar esta planilla como PAGADA?',
      async () => {
        try {
          const updated = await PayrollService.updatePayroll(payrollId, { status: 'PAGADO' });
          setPayroll(updated);
          modal.showSuccess(
            'Actualización exitosa',
            'La planilla ha sido marcada como PAGADA'
          );
        } catch (err) {
          const message = (err as Error)?.message || 'Error al actualizar el estado de la planilla';
          modal.showError(
            'Error',
            message
          );
        }
      }
    );
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

  const exportToExcel = async () => {
    if (!payroll || employees.length === 0) return;

    const workbook = new ExcelJS.Workbook();

    const ws1 = workbook.addWorksheet('Resumen');
    const summaryData = [
      ['PLANILLA DE SALARIOS'],
      ['Planilla #:', payroll.id],
      ['Periodo:', `${formatDate(payroll.period_start)} a ${formatDate(payroll.period_end)}`],
      ['Fecha de pago:', formatDate(payroll.payment_date || '')],
      ['Estado:', payroll.status],
      [],
      ['RESUMEN GENERAL'],
      ['Total de empleados:', employees.length],
      ['Total salario bruto:', formatCRC(totals.grossSalary)],
      ['Total deducciones:', formatCRC(totals.totalDeductions)],
      ['Total salario neto:', formatCRC(totals.netSalary)],
    ];
    ws1.addRows(summaryData);
    ws1.columns = [{ width: 25 }, { width: 30 }];

    const ws2 = workbook.addWorksheet('Empleados');
    const employeeHeaders = [
      'ID',
      'Nombre',
      'Cédula',
      'Puesto',
      'Salario Bruto',
      'Deducciones',
      'Salario Neto'
    ];

    const employeeRows = employees.map((e) => [
      e.id,
      e.employee_name,
      e.employee_identification,
      e.position_name || '-',
      e.gross_salary.toFixed(2),
      e.total_deductions.toFixed(2),
      e.net_salary.toFixed(2)
    ]);

    ws2.addRow(employeeHeaders);
    ws2.addRows(employeeRows);
    ws2.columns = [
      { width: 10 },
      { width: 30 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    const fileName = `Planilla_${payroll.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => formatCRC(value);

  const formatDate = (date: string) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'CALCULADO' || status === 'PAGADO' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded-full">
          <CheckCircleIcon className="w-4 h-4" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
        <ClockIcon className="w-4 h-4" />
        {status || 'Pendiente'}
      </span>
    );
  };

  const totals = employees.reduce(
    (acc, emp) => ({
      grossSalary: acc.grossSalary + emp.gross_salary,
      totalDeductions: acc.totalDeductions + emp.total_deductions,
      netSalary: acc.netSalary + emp.net_salary,
      totalHours: acc.totalHours + (emp.total_hours || 0),
      totalOvertimeHours: acc.totalOvertimeHours + (emp.overtime_hours || 0),
      totalWeeklyRestHours: acc.totalWeeklyRestHours + (emp.weekly_rest_hours || 0),
      totalOvertimePay: acc.totalOvertimePay + (emp.overtime_pay || 0),
      totalWeeklyRestPay: acc.totalWeeklyRestPay + (emp.weekly_rest_pay || 0),
      totalBonuses: acc.totalBonuses + (emp.bonuses || 0),
    }),
    { 
      grossSalary: 0, 
      totalDeductions: 0, 
      netSalary: 0,
      totalHours: 0,
      totalOvertimeHours: 0,
      totalWeeklyRestHours: 0,
      totalOvertimePay: 0,
      totalWeeklyRestPay: 0,
      totalBonuses: 0,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37] dark:text-gray-300">Cargando detalles de la planilla...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="p-8 text-center border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="mb-4 text-red-700 dark:text-red-300">⚠️ {error || 'No se pudo cargar la planilla'}</p>
            <Link
              href="/pages/payroll/list"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/pages/payroll/list"
              className="inline-flex items-center gap-2 text-[#6F7153] dark:text-gray-400 hover:text-[#5D614A] dark:hover:text-gray-300 font-medium mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </Link>
            
            <div className="bg-[#6F7153] rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <DocumentTextIcon className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Planilla #{payroll.id}</h1>
                    <p className="text-[#E7DCC1]">Detalle completo del cálculo de planilla</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={markAsPaid}
                    disabled={payroll.status === 'PAGADO'}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-semibold shadow-md ${
                      payroll.status === 'PAGADO'
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {payroll.status === 'PAGADO' ? 'Ya Pagada' : 'Marcar como Pagada'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-semibold shadow-md"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Exportar Excel
                  </button>
                  {getStatusBadge(payroll.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas de información */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-[#6F7153]" />
                </div>
                <h3 className="text-sm font-semibold text-[#6B5B3D] dark:text-gray-400">Periodo</h3>
              </div>
              <p className="text-base font-bold text-[#3B4D36] dark:text-white">{formatDate(payroll.period_start)}</p>
              <p className="text-sm text-[#6B5B3D] dark:text-gray-400">al {formatDate(payroll.period_end)}</p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-[#6F7153]" />
                </div>
                <h3 className="text-sm font-semibold text-[#6B5B3D] dark:text-gray-400">Fecha de pago</h3>
              </div>
              <p className="text-base font-bold text-[#3B4D36] dark:text-white">
                {payroll.payment_date ? formatDate(payroll.payment_date) : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-[#6F7153]" />
                </div>
                <h3 className="text-sm font-semibold text-[#6B5B3D] dark:text-gray-400">Empleados</h3>
              </div>
              <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{employees.length}</p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-[#6F7153]" />
                </div>
                <h3 className="text-sm font-semibold text-[#6B5B3D] dark:text-gray-400">Tipo</h3>
              </div>
              <p className="text-base font-bold text-[#3B4D36] dark:text-white">
                {payroll.payroll_type ? `Tipo ${payroll.payroll_type}` : 'No especificado'}
              </p>
            </div>
          </div>

          {/* Resumen total */}
          <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-6 mb-6">
            <h2 className="mb-6 text-xl font-bold text-[#3B4D36] dark:text-white">Resumen Total de la Planilla</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{totals.totalHours.toFixed(0)}h</p>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Horas Extras</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{totals.totalOvertimeHours.toFixed(1)}h</p>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Horas Descanso</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{totals.totalWeeklyRestHours.toFixed(1)}h</p>
              </div>

              {/* Fila 2: Datos monetarios */}
              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-[#A0826D]" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Salario Bruto</p>
                </div>
                <p className="text-lg font-bold text-[#3B4D36] dark:text-white">{formatCRC(totals.grossSalary)}</p>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-orange-600" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Pago Horas Extras</p>
                </div>
                <p className="text-lg font-bold text-orange-600">{formatCRC(totals.totalOvertimePay)}</p>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Pago Descanso</p>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatCRC(totals.totalWeeklyRestPay)}</p>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-medium text-[#6B5B3D] dark:text-gray-400">Bonificaciones</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCRC(totals.totalBonuses)}</p>
              </div>

              {/* Fila 3: Deducciones y total */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">Total Deducciones</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCRC(totals.totalDeductions)}</p>
              </div>

              <div className="bg-[#6F7153] rounded-lg p-4 border border-[#5D614A] shadow-sm lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    <p className="text-sm font-medium text-[#E7DCC1]">TOTAL NETO A PAGAR</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCRC(totals.netSalary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por empleado */}
          <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-[#E0D6B7] dark:border-gray-700">
            <div className="px-6 py-5 border-b border-[#E0D6B7] dark:border-gray-700 bg-[#E7DCC1] dark:bg-[#2a2a2a]">
              <h2 className="text-xl font-bold text-[#3B4D36] dark:text-white">Desglose por Empleado</h2>
              <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mt-1">Haz clic en un empleado para ver el detalle de sus deducciones</p>
            </div>

            {employees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#E7DCC1] dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-10 h-10 text-[#6F7153]" />
                </div>
                <h3 className="text-lg font-semibold text-[#3B4D36] dark:text-white mb-2">No hay empleados en esta planilla</h3>
                <p className="text-sm text-[#6B5B3D] dark:text-gray-400">Esta planilla no tiene empleados asignados o no se ha calculado aún.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#E7DCC1] dark:bg-[#2a2a2a]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wider">Empleado</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wider">Bruto</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wider">Deducciones</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-wider">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0D6B7] dark:divide-gray-700">
                    {employees.map((emp, idx) => {
                      const isExpanded = expandedRows.has(emp.id);
                      
                      return (
                        <React.Fragment key={emp.id}>
                          <tr
                            onClick={() => toggleRow(emp.id)}
                            className={`cursor-pointer hover:bg-[#F5EDD5] dark:hover:bg-[#2a2a2a] transition-colors ${
                              idx % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-[#FEFBF5] dark:bg-[#252525]'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-5 h-5 text-[#6F7153] shrink-0" />
                                ) : (
                                  <ChevronRightIcon className="w-5 h-5 text-[#6F7153] shrink-0" />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-[#3B4D36] dark:text-white">{emp.employee_name}</div>
                                  {emp.employee_identification && (
                                    <div className="text-xs text-[#6B5B3D] dark:text-gray-400">{emp.employee_identification}</div>
                                  )}
                                  {emp.position_name && (
                                    <div className="text-xs text-[#8B7355] dark:text-gray-500">{emp.position_name}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-[#3B4D36] dark:text-white">
                                {formatCurrency(emp.gross_salary)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(emp.total_deductions)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                {formatCurrency(emp.net_salary)}
                              </span>
                            </td>
                          </tr>

                          {/* Fila expandida */}
                          {isExpanded && (
                            <tr className="bg-[#FEFBF5] dark:bg-[#252525] border-t border-[#E0D6B7] dark:border-gray-700">
                              <td colSpan={4} className="px-6 py-0">
                                <div className="py-6 pl-14 pr-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Horas Trabajadas
                                      </p>
                                      <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">
                                        {(emp.total_hours || 0).toFixed(0)}h
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Horas Extras
                                      </p>
                                      <p className="text-2xl font-bold text-orange-600">
                                        {(emp.overtime_hours || 0).toFixed(2)}h
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Horas Descanso
                                      </p>
                                      <p className="text-2xl font-bold text-blue-600">
                                        {(emp.weekly_rest_hours || 0).toFixed(2)}h
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Salario Bruto
                                      </p>
                                      <p className="text-xl font-bold text-[#3B4D36] dark:text-white">
                                        {formatCurrency(emp.gross_salary)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Pago Horas Extras
                                      </p>
                                      <p className="text-xl font-bold text-orange-600">
                                        {formatCurrency(emp.overtime_pay || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Pago Descanso
                                      </p>
                                      <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(emp.weekly_rest_pay || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-4 border border-[#E0D6B7] dark:border-gray-700 shadow-sm">
                                      <p className="text-xs font-bold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Bonificaciones
                                      </p>
                                      <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(emp.bonuses || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                                      <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                                        Deducciones
                                      </p>
                                      <p className="text-xl font-bold text-red-600">
                                        {formatCurrency(emp.total_deductions)}
                                      </p>
                                    </div>

                                    <div className="bg-[#6F7153] rounded-xl p-4 border border-[#5D614A] shadow-sm">
                                      <p className="text-xs font-bold text-[#E7DCC1] uppercase tracking-wide mb-1">
                                        Salario Neto
                                      </p>
                                      <p className="text-xl font-bold text-white">
                                        {formatCurrency(emp.net_salary)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 rounded-lg p-4">
                                    <div className="flex gap-3">
                                      <span className="text-2xl">i</span>
                                      <div>
                                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                                          Informacion del Calculo
                                        </p>
                                        <p className="text-sm text-blue-700 dark:text-blue-400">
                                          Este desglose corresponde al resultado final guardado para este empleado en la planilla.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#E7DCC1] dark:bg-[#2a2a2a]">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-[#3B4D36] dark:text-white">TOTALES</td>
                      <td className="px-6 py-4 text-right text-base font-bold text-[#3B4D36] dark:text-white">
                        {formatCurrency(totals.grossSalary)}
                      </td>
                      <td className="px-6 py-4 text-right text-base font-bold text-red-700 dark:text-red-400">
                        {formatCurrency(totals.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 text-right text-base font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(totals.netSalary)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <modal.ModalComponent />
    </div>
  );
}
