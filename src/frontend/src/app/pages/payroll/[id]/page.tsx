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
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PayrollService, Payroll, PayrollEmployee, ParamSnapshot } from '@/services/payrollService';
import { PayrollParamSnapshotSection } from '@/components/PayrollParamSnapshotSection';
import { useAguinaldoSummary } from '@/hooks/useAguinaldoSummary';
import { formatCRC } from '@/utils/number';
import { useModal } from '@/hooks/useModal';
import { toast } from 'sonner';
import { BanknotesIcon } from '@heroicons/react/24/outline';

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function PayrollDetailPage() {
  const pathname = usePathname();
  const modal = useModal();
  const [payrollId, setPayrollId] = useState<number | null>(null);
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<ParamSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [showAguinaldo, setShowAguinaldo] = useState(false);
  const { data: aguinaldoSummary, isLoading: aguinaldoLoading } = useAguinaldoSummary(
    showAguinaldo ? payrollId : null
  );

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
      // Load snapshot only for approved/paid payrolls (PAY-29)
      if (payrollData.status === 'APROBADA' || payrollData.status === 'PAGADA') {
        setSnapshotsLoading(true);
        try {
          const { snapshot } = await PayrollService.getPayrollSnapshot(id);
          setSnapshots(snapshot || []);
        } catch (snapErr) {
          // Degrade gracefully — old payrolls have no snapshot
          console.warn('Snapshot not available for this payroll:', snapErr);
          setSnapshots([]);
        } finally {
          setSnapshotsLoading(false);
        }
      }
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
          toast.success('La planilla ha sido marcada como PAGADA');
        } catch (err) {
          const message = (err as Error)?.message || 'Error al actualizar el estado de la planilla';
          toast.error(message);
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

    const ExcelJS = (await import('exceljs')).default;
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

  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <div className="mb-6">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Planilla / Detalle</p>
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
              {/* Header Card Skeleton */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            {/* Info Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
            {/* Summary Skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-6" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            {/* Employee Table Skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Planilla / Detalle</p>
              <Link
                href="/pages/payroll/list"
                className="inline-flex items-center gap-2 text-green-600 dark:text-zinc-400 hover:text-green-500 dark:hover:text-zinc-300 font-medium mb-4 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver al listado
              </Link>
            </div>
            <div className="overflow-auto rounded-lg border border-red-200 dark:border-red-800">
              <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
                <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3 text-red-500 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar la planilla</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => payrollId && loadPayrollDetails(payrollId)}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payroll) return null;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <div className="mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Planilla / Detalle</p>
            <Link
              href="/pages/payroll/list"
              className="inline-flex items-center gap-2 text-green-600 dark:text-zinc-400 hover:text-green-500 dark:hover:text-zinc-300 font-medium mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Volver al listado
            </Link>
            
            {/* Header Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-9 h-9 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Planilla #{payroll.id}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Detalle completo del cálculo de planilla</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={markAsPaid}
                    disabled={payroll.status === 'PAGADO'}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all font-semibold ${
                      payroll.status === 'PAGADO'
                        ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed text-zinc-500 dark:text-zinc-400'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {payroll.status === 'PAGADO' ? 'Ya Pagada' : 'Marcar como Pagada'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-5 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold text-zinc-700 dark:text-zinc-200"
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Periodo</h3>
              </div>
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">{formatDate(payroll.period_start)}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">al {formatDate(payroll.period_end)}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Fecha de pago</h3>
              </div>
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                {payroll.payment_date ? formatDate(payroll.payment_date) : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Empleados</h3>
              </div>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{employees.length}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tipo</h3>
              </div>
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
                {payroll.payroll_type ? `Tipo ${payroll.payroll_type}` : 'No especificado'}
              </p>
            </div>
          </div>

          {/* Resumen total */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="mb-6 text-xl font-bold text-zinc-800 dark:text-zinc-100">Resumen Total de la Planilla</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Empleados</p>
                </div>
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{employees.length}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Trabajadas</p>
                </div>
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{totals.totalHours.toFixed(0)}h</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Extras</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{totals.totalOvertimeHours.toFixed(1)}h</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horas Descanso</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{totals.totalWeeklyRestHours.toFixed(1)}h</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Salario Bruto</p>
                </div>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{formatCRC(totals.grossSalary)}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-orange-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pago Horas Extras</p>
                </div>
                <p className="text-lg font-bold text-orange-600">{formatCRC(totals.totalOvertimePay)}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pago Descanso</p>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatCRC(totals.totalWeeklyRestPay)}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Bonificaciones</p>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCRC(totals.totalBonuses)}</p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-red-600" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">Total Deducciones</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCRC(totals.totalDeductions)}</p>
              </div>

              <div className="bg-green-600 rounded-lg p-4 border border-green-700 dark:border-green-700 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    <p className="text-sm font-medium text-green-100 dark:text-zinc-200">TOTAL NETO A PAGAR</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCRC(totals.netSalary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por empleado */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Desglose por Empleado</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Haz clic en un empleado para ver el detalle de sus deducciones</p>
            </div>

            {employees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">No hay empleados en esta planilla</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta planilla no tiene empleados asignados o no se ha calculado aún.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">Empleado</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">Bruto</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">Deducciones</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {employees.map((emp, idx) => {
                      const isExpanded = expandedRows.has(emp.id);
                      
                      return (
                        <React.Fragment key={emp.id}>
                          <tr
                            onClick={() => toggleRow(emp.id)}
                            className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                              idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/50'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-5 h-5 text-green-600 shrink-0" />
                                ) : (
                                  <ChevronRightIcon className="w-5 h-5 text-green-600 shrink-0" />
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{emp.employee_name}</div>
                                  {emp.employee_identification && (
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{emp.employee_identification}</div>
                                  )}
                                  {emp.position_name && (
                                    <div className="text-xs text-zinc-400 dark:text-zinc-500">{emp.position_name}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                                {formatCurrency(emp.gross_salary)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(emp.total_deductions)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(emp.net_salary)}
                              </span>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
                              <td colSpan={4} className="px-6 py-0">
                                <div className="py-6 pl-14 pr-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Horas Trabajadas
                                      </p>
                                      <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                                        {(emp.total_hours || 0).toFixed(0)}h
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Horas Extras
                                      </p>
                                      <p className="text-2xl font-bold text-orange-600">
                                        {(emp.overtime_hours || 0).toFixed(2)}h
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Horas Descanso
                                      </p>
                                      <p className="text-2xl font-bold text-blue-600">
                                        {(emp.weekly_rest_hours || 0).toFixed(2)}h
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Salario Bruto
                                      </p>
                                      <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                                        {formatCurrency(emp.gross_salary)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Pago Horas Extras
                                      </p>
                                      <p className="text-xl font-bold text-orange-600">
                                        {formatCurrency(emp.overtime_pay || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Pago Descanso
                                      </p>
                                      <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(emp.weekly_rest_pay || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                        Bonificaciones
                                      </p>
                                      <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(emp.bonuses || 0)}
                                      </p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                      <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                                        Deducciones
                                      </p>
                                      <p className="text-xl font-bold text-red-600">
                                        {formatCurrency(emp.total_deductions)}
                                      </p>
                                    </div>

                                    <div className="bg-green-600 rounded-lg p-4 border border-green-700 dark:border-green-700">
                                      <p className="text-xs font-bold text-green-100 dark:text-zinc-200 uppercase tracking-wide mb-1">
                                        Salario Neto
                                      </p>
                                      <p className="text-xl font-bold text-white">
                                        {formatCurrency(emp.net_salary)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 rounded-lg p-4">
                                    <div className="flex gap-3">
                                      <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
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
                  <tfoot className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-800 dark:text-zinc-100">TOTALES</td>
                      <td className="px-6 py-4 text-right text-base font-bold text-zinc-800 dark:text-zinc-100">
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
          {/* Parámetros de cálculo (PAY-29) */}
          {payroll && (payroll.status === 'APROBADA' || payroll.status === 'PAGADA') && (
            <PayrollParamSnapshotSection
              snapshots={snapshots}
              isLoading={snapshotsLoading}
            />
          )}

          {/* Aguinaldo acumulado (informativo) */}
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setShowAguinaldo(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <BanknotesIcon className="w-5 h-5 text-[#4A5D3A] dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Aguinaldo acumulado</p>
                  <p className="text-xs text-zinc-400">Impacto de esta planilla en el aguinaldo de cada colaborador</p>
                </div>
              </div>
              <ChevronDownIcon className={`w-5 h-5 text-zinc-400 transition-transform ${showAguinaldo ? 'rotate-180' : ''}`} />
            </button>

            {showAguinaldo && (
              <div className="border-t border-zinc-100 dark:border-zinc-800">
                {aguinaldoLoading ? (
                  <div className="p-6 text-center">
                    <ArrowPathIcon className="w-5 h-5 animate-spin text-zinc-400 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Calculando...</p>
                  </div>
                ) : aguinaldoSummary && aguinaldoSummary.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                          <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Colaborador</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Acumulado antes</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Esta planilla</th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Total acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {aguinaldoSummary.map(row => (
                          <tr key={row.employeeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                            <td className="px-6 py-3 text-zinc-700 dark:text-zinc-200 font-medium">{row.employeeName}</td>
                            <td className="px-6 py-3 text-right text-zinc-500 dark:text-zinc-400">{formatCRC(row.accruedBeforeThisPayroll)}</td>
                            <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-300">+{formatCRC(row.thisPayrollContribution)}</td>
                            <td className="px-6 py-3 text-right font-semibold text-[#4A5D3A] dark:text-green-400">{formatCRC(row.totalAccruedWithThis)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-6 py-3 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                      Fecha límite de pago: <strong>20 de diciembre</strong>. Solo planillas PAGADA cuentan para el aguinaldo legal.
                    </p>
                  </div>
                ) : (
                  <p className="px-6 py-5 text-sm text-zinc-400">No hay datos de aguinaldo disponibles.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <modal.ModalComponent />
    </div>
  );
}
