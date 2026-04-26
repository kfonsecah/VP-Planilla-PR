"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { usePayrollWizard } from '@/hooks/usePayrollWizard';
import { NomineeService } from '@/services/nomineeService';
import { PayrollService } from '@/services/payrollService';
import { getEmployees } from '@/services/employeeService';
import PayrollWizardStep3 from '@/components/PayrollWizardStep3';
import PayrollEmployeeAdjustModal from '@/components/PayrollEmployeeAdjustModal';
import type { Employee } from '@/types/employee';

type PeriodType = 'quincenal' | 'mensual' | 'rango_libre';

const STEPS = ['Período', 'Empleados', 'Revisar', 'Aprobar'] as const;

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getMonthBounds(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

export default function PayrollWizardPage() {
  const {
    currentStep,
    calculationData,
    payrollId,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    periodType,
    setPeriodType,
    selectPeriod,
    goToStep,
    setCalculationData,
    setPayrollId,
    reset,
  } = usePayrollWizard();

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [calcResult, setCalcResult] = useState<any>(null);
  const [adjustingEmpId, setAdjustingEmpId] = useState<number | null>(null);

  // ── Load employees when entering Step 2 ──────────────────────────────────
  useEffect(() => {
    if (currentStep !== 2) return;
    setLoadingEmployees(true);
    getEmployees()
      .then((list) => setEmployees(list))
      .catch(() => toast.error('Error cargando empleados'))
      .finally(() => setLoadingEmployees(false));
  }, [currentStep]);

  // ── Trigger calculation when entering Step 3 ────────────────────────────
  useEffect(() => {
    if (currentStep !== 3) return;
    handleCalculate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const applyQuincenaPreset = useCallback((half: 1 | 2) => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    if (half === 1) {
      setDateStart(formatDate(new Date(year, month, 1)));
      setDateEnd(formatDate(new Date(year, month, 15)));
    } else {
      setDateStart(formatDate(new Date(year, month, 16)));
      setDateEnd(formatDate(new Date(year, month + 1, 0)));
    }
  }, []);

  const applyMonthPreset = useCallback((ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    const bounds = getMonthBounds(y, m - 1);
    setDateStart(bounds.start);
    setDateEnd(bounds.end);
  }, []);

  const handleNextStep1 = useCallback(() => {
    if (!dateStart || !dateEnd) return;
    selectPeriod({ start: dateStart, end: dateEnd, label: `${dateStart} – ${dateEnd}` });
    goToStep(2);
  }, [dateStart, dateEnd, selectPeriod, goToStep]);

  const toggleAll = useCallback(() => {
    if (checkedIds.size === employees.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(employees.map((e) => e.id)));
    }
  }, [checkedIds.size, employees]);

  const toggleEmployee = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNextStep2 = useCallback(() => {
    if (checkedIds.size === 0) return;
    const ids = Array.from(checkedIds).map(Number);
    setSelectedEmployeeIds(ids);
    goToStep(3);
  }, [checkedIds, setSelectedEmployeeIds, goToStep]);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      // Crear planilla borrador primero
      const payroll = await PayrollService.createPayroll({
        payroll_type_id: 1,
        period_start: dateStart,
        period_end: dateEnd,
        payment_date: dateEnd,
        status: 'BORRADOR',
      });
      setPayrollId(payroll.id);

      // Calcular con los empleados seleccionados
      const result = await NomineeService.calculatePayrollForPeriod(
        dateStart,
        dateEnd,
        payroll.id,
        selectedEmployeeIds,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (result as any)?.data ?? result;
      setCalcResult(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCalculationData(data as any);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al calcular la planilla';
      setCalcError(msg);
      toast.error(msg);
    } finally {
      setIsCalculating(false);
    }
  }, [dateStart, dateEnd, selectedEmployeeIds, setPayrollId, setCalculationData]);

  const handleApprove = useCallback(async (pid: number) => {
    await PayrollService.approvePayroll(pid);
    toast.success('Planilla aprobada exitosamente');
    reset();
    setDateStart('');
    setDateEnd('');
    setCheckedIds(new Set());
    setCalcResult(null);
  }, [reset]);

  // ── Derived ───────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calcEmployees: any[] = Array.isArray((calcResult as any)?.employees)
    ? (calcResult as any).employees
    : [];

  const inconsistentCount = calcEmployees.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => Array.isArray(e.inconsistencies) && e.inconsistencies.length > 0
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-6 py-8 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Gestión de Planillas
          </p>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-none">
            Nueva Planilla
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Calcula y aprueba planillas paso a paso
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;
            return (
              <React.Fragment key={label}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isActive ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900' : ''}
                    ${isDone ? 'bg-green-600 text-white' : ''}
                    ${!isActive && !isDone ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' : ''}
                  `}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {isDone ? '✓' : stepNum}
                  </span>
                  <span>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: Período ────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-2xl">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6">
              Seleccionar Período
            </h2>

            {/* Tipo de período */}
            <div className="flex gap-3 mb-6">
              {(['quincenal', 'mensual', 'rango_libre'] as PeriodType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setPeriodType(t); setDateStart(''); setDateEnd(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border
                    ${periodType === t
                      ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500'}
                  `}
                >
                  {t === 'rango_libre' ? 'Rango libre' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Quincenal presets */}
            {periodType === 'quincenal' && (
              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => applyQuincenaPreset(1)}
                  className="flex-1 py-2 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                >
                  1–15 del mes actual
                </button>
                <button
                  onClick={() => applyQuincenaPreset(2)}
                  className="flex-1 py-2 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                >
                  16–fin del mes actual
                </button>
              </div>
            )}

            {/* Mensual month selector */}
            {periodType === 'mensual' && (
              <div className="mb-5">
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Mes y Año
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    applyMonthPreset(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            )}

            {/* Date display (all types) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  readOnly={periodType !== 'rango_libre'}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  readOnly={periodType !== 'rango_libre'}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </div>

            <button
              onClick={handleNextStep1}
              disabled={!dateStart || !dateEnd}
              className="w-full py-3 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* ── STEP 2: Empleados ──────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Seleccionar Empleados
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {checkedIds.size} seleccionados / {employees.length} total
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={toggleAll}
                className="px-4 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {checkedIds.size === employees.length && employees.length > 0
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            </div>

            {loadingEmployees ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-700 dark:border-t-zinc-300 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl mb-6">
                {employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(emp.id)}
                      onChange={() => toggleEmployee(emp.id)}
                      className="w-4 h-4 accent-zinc-700 dark:accent-zinc-300"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{emp.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{emp.position}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => goToStep(1)}
                className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={handleNextStep2}
                disabled={checkedIds.size === 0}
                className="flex-1 py-3 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Revisar / Ajustar ──────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Revisar Resultados
              </h2>
              <button
                onClick={() => goToStep(2)}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                ← Volver
              </button>
            </div>

            {isCalculating && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-700 dark:border-t-zinc-300 rounded-full animate-spin" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Calculando planilla…</p>
              </div>
            )}

            {calcError && !isCalculating && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 mb-4">
                {calcError}
                <button
                  onClick={handleCalculate}
                  className="ml-4 underline text-sm"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!isCalculating && calcResult && (
              <>
                {/* Banner de inconsistencias */}
                {inconsistentCount > 0 && (
                  <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                    <span className="text-amber-600 dark:text-amber-400 text-xl flex-shrink-0">⚠️</span>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>{inconsistentCount} empleado(s)</strong> tienen marcas sin par (días sin entrada o salida registrada).
                      Esas horas se calcularon como 0. Puedes ajustar manualmente o aprobar con los valores actuales.
                    </p>
                  </div>
                )}

                {/* Tabla de resultados */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800 text-left">
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Empleado</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">H. Regulares</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">H. Extra</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">Deducciones</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">Salario Neto</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Estado</th>
                        <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {calcEmployees.map((emp: any, i: number) => {
                        const inconsistencies: string[] = Array.isArray(emp.inconsistencies) ? emp.inconsistencies : [];
                        const hasIssues = inconsistencies.length > 0;
                        const empId = emp.id ?? emp.employeeId ?? emp.employee_id ?? i;
                        return (
                          <tr key={empId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3 text-zinc-800 dark:text-zinc-100 font-medium">
                              {emp.name ?? emp.employeeName ?? emp.employee_name ?? `Empleado ${empId}`}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                              {Number(emp.regularHours ?? emp.regular_hours ?? 0).toFixed(1)}h
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                              {Number(emp.overtimeHours ?? emp.overtime_hours ?? 0).toFixed(1)}h
                            </td>

                            <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                              ₡{Number(emp.totalDeductions ?? emp.total_deductions ?? 0).toLocaleString('es-CR')}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-800 dark:text-zinc-100">
                              ₡{Number(emp.netSalary ?? emp.net_salary ?? 0).toLocaleString('es-CR')}
                            </td>
                            <td className="px-4 py-3">
                              {hasIssues ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium">
                                  ⚠️ {inconsistencies.length} inconsistencia{inconsistencies.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium">
                                  ✓ OK
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                id={`adjust-btn-${empId}`}
                                onClick={() => setAdjustingEmpId(Number(empId))}
                                className="text-xs px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => goToStep(4)}
                  className="w-full py-3 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                >
                  Continuar a aprobación →
                </button>
              </>
            )}

            {/* PayrollEmployeeAdjustModal integration */}
            {adjustingEmpId !== null && payrollId !== null && (() => {
              const emp = calcEmployees.find((e: any) => Number(e.id ?? e.employeeId ?? e.employee_id) === adjustingEmpId);
              if (!emp) return null;
              
              return (
                <PayrollEmployeeAdjustModal
                  isOpen={true}
                  payrollId={payrollId}
                  employeeId={adjustingEmpId}
                  employeeName={emp.name ?? emp.employeeName ?? emp.employee_name ?? 'Empleado'}
                  currentData={{
                    regularHours: Number(emp.regularHours ?? emp.regular_hours ?? 0),
                    overtimeHours: Number(emp.overtimeHours ?? emp.overtime_hours ?? 0),
                    weeklyRestHours: Number(emp.weeklyRestHours ?? emp.weekly_rest_hours ?? 0),
                    totalDeductions: Number(emp.totalDeductions ?? emp.total_deductions ?? 0),
                  }}
                  onClose={() => setAdjustingEmpId(null)}
                  onSave={() => {
                    // Refresh calculation to show updated values and totals
                    handleCalculate();
                  }}
                />
              );
            })()}
          </div>
        )}

        {/* ── STEP 4: Aprobar ────────────────────────────────────────────── */}
        {currentStep === 4 && payrollId !== null && calculationData !== null && (
          <div className="max-w-2xl">
            <PayrollWizardStep3
              payrollId={payrollId}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              calculationData={calculationData as any}
              onApprove={handleApprove}
              onBack={() => goToStep(3)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
