"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayrollWizardContext } from '@/contexts/PayrollWizardContext';
import { useAguinaldoSummary } from '@/hooks/useAguinaldoSummary';
import { Tooltip } from '@/components/ui/Tooltip';
import EmployeePayrollBreakdown from '@/components/EmployeePayrollBreakdown';
import PayrollEmployeeAdjustModal from '@/components/PayrollEmployeeAdjustModal';
import { 
  DocumentCheckIcon, 
  ChevronRightIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import type { EmployeePayroll } from '@/types/payrollTypes';

const BUTTON_PRIMARY = "px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const BUTTON_SECONDARY = "px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2";
const CARD_CLASSES = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300";

export default function Step3Review() {
  const {
    currentStep,
    goToStep,
    payrollId,
    isCalculating,
    calcError,
    calcResult,
    handleCalculate,
    refreshPayrollData,
    adjustingEmpId,
    setAdjustingEmpId,
    expandedIds,
    setExpandedIds,
    toggleExpand,
  } = usePayrollWizardContext();

  const { data: aguinaldoData, refetch: refetchAguinaldo } = useAguinaldoSummary(payrollId);

  // ── Trigger calculation when entering Step 3 ────────────────────────────
  useEffect(() => {
    if (currentStep !== 3) return;
    handleCalculate(() => refetchAguinaldo());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Auto-expand employees with inconsistencies when results arrive
  useEffect(() => {
    if (!calcResult) return;
    const ids = new Set<number | string>(
      calcResult.employees
        .filter(e => Array.isArray(e.inconsistencies) && e.inconsistencies.length > 0)
        .map(e => (e.id ?? e.employee_id ?? Number(e.employeeId)) as number | string)
        .filter(Boolean)
    );
    setExpandedIds(ids);
  }, [calcResult, setExpandedIds]);

  // Reset expand state when leaving step 3
  useEffect(() => {
    if (currentStep !== 3) setExpandedIds(new Set());
  }, [currentStep, setExpandedIds]);

  const calcEmployees: EmployeePayroll[] = Array.isArray(calcResult?.employees)
    ? calcResult.employees
    : [];

  const inconsistentCount = calcEmployees.filter(
    (e) => Array.isArray(e.inconsistencies) && e.inconsistencies.length > 0
  ).length;

  if (currentStep !== 3) return null;

  return (
    <>
      <div className={`${CARD_CLASSES} p-6 max-w-5xl mx-auto`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <DocumentCheckIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Validar Resultados
              </h2>
              <p className="text-xs text-zinc-500">Revisa los cálculos antes de aprobar.</p>
            </div>
          </div>
          <button
            onClick={() => goToStep(2)}
            className={BUTTON_SECONDARY}
          >
            <ArrowLeftIcon className="w-5 h-5" /> Cambiar empleados
          </button>
        </div>

        {isCalculating ? (
          <div className="flex flex-col items-center justify-center py-28 gap-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-[-20px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-2xl animate-pulse" />
              <div className="w-24 h-24 border-[3px] border-transparent border-t-green-600 border-r-green-600/30 rounded-full animate-spin" />
              <div className="absolute inset-2 w-20 h-20 border-[3px] border-transparent border-b-zinc-900 dark:border-b-zinc-100 border-l-zinc-900/30 dark:border-l-zinc-100/30 rounded-full animate-spin-reverse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white dark:bg-zinc-900 rounded-full p-3 shadow-xl border border-zinc-100 dark:border-zinc-800">
                  <SparklesIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <p className="text-2xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                  Procesando cálculos<span className="inline-flex w-8 text-left animate-pulse">...</span>
                </p>
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 animate-pulse" />
              </div>
            </div>
            <div className="w-64 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-inner">
              <div className="h-full bg-green-600 rounded-full animate-progress" style={{ width: '40%' }} />
            </div>
          </div>
        ) : calcError ? (
          <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 text-center space-y-4">
            <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Algo salió mal</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{calcError}</p>
            </div>
            <button onClick={() => handleCalculate(() => refetchAguinaldo())} className={BUTTON_PRIMARY + " mx-auto"}>Reintentar Cálculo</button>
          </div>
        ) : calcResult ? (
          <div className="animate-in fade-in duration-700">
            {inconsistentCount > 0 && (
              <div className="flex items-center justify-between gap-4 p-4 mb-8 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                      Se detectaron {inconsistentCount} colaboradores con marcas incompletas
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Días sin entrada o salida registrada calculados como 0h.</p>
                  </div>
                </div>
                <Tooltip content="Revisa las marcas en el dashboard de asistencia">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-white dark:bg-zinc-800 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-700">Audit Needed</div>
                </Tooltip>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-10 shadow-inner">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-left border-b border-zinc-200 dark:border-zinc-800">
                    <th className="w-10 px-3 py-4" />
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Colaborador</th>
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-right">Horas</th>
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-right">Deducciones</th>
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-right">Aguinaldo</th>
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-right">Neto a Pagar</th>
                    <th className="px-4 py-4 font-bold text-zinc-500 uppercase tracking-widest text-[10px] text-center">Estado</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {calcEmployees.map((emp, i) => {
                    const inconsistencies = Array.isArray(emp.inconsistencies) ? emp.inconsistencies : [];
                    const hasIssues = inconsistencies.length > 0;
                    const empId = emp.id ?? emp.employee_id ?? Number(emp.employeeId) ?? i;
                    const isExpanded = expandedIds.has(empId as number | string);
                    const rowBorder = hasIssues ? 'border-l-2 border-amber-400 dark:border-amber-500' : '';

                    return (
                      <React.Fragment key={empId}>
                        <tr
                          className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group cursor-pointer select-none ${rowBorder}`}
                          onClick={() => toggleExpand(empId as number | string)}
                        >
                          <td className="w-10 px-3 py-5 text-center">
                            <ChevronRightIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 mx-auto ${isExpanded ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="px-4 py-5">
                            <p className="font-bold text-zinc-800 dark:text-zinc-100">{emp.name ?? emp.employeeName ?? emp.employee_name}</p>
                            <p className="text-[10px] text-zinc-400 font-medium">{emp.position_name || emp.position || 'ID: ' + empId}</p>
                          </td>
                          <td className="px-4 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">{(Number(emp.regularHours ?? emp.regular_hours ?? 0) + Number(emp.overtimeHours ?? emp.overtime_hours ?? 0)).toFixed(1)}h</span>
                              <span className="text-[10px] text-zinc-400">R: {Number(emp.regularHours ?? emp.regular_hours ?? 0).toFixed(1)} | E: {Number(emp.overtimeHours ?? emp.overtime_hours ?? 0).toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-right font-medium text-zinc-600 dark:text-zinc-400">
                            ₡{Number(emp.totalDeductions ?? emp.total_deductions ?? 0).toLocaleString('es-CR')}
                          </td>
                          <td className="px-4 py-5 text-right">
                            {(() => {
                              const agui = aguinaldoData.find(a => a.employeeId === Number(emp.employee_id ?? emp.id ?? emp.employeeId));
                              if (!agui) return <span className="text-zinc-300">—</span>;
                              return (
                                <Tooltip content={`Acumulado total: ₡${agui.totalAccruedWithThis.toLocaleString('es-CR')}`}>
                                  <span className="text-zinc-700 dark:text-zinc-300 font-medium cursor-help hover:text-green-600 transition-colors underline decoration-dotted underline-offset-4">
                                    ₡{agui.thisPayrollContribution.toLocaleString('es-CR')}
                                  </span>
                                </Tooltip>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-5 text-right">
                            <p className="text-base font-black text-zinc-900 dark:text-white">
                              ₡{Number(emp.netSalary ?? emp.net_salary ?? 0).toLocaleString('es-CR')}
                            </p>
                          </td>
                          <td className="px-4 py-5 text-center">
                            {hasIssues ? (
                              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">Revisión</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider">Validado</span>
                            )}
                          </td>
                          <td className="px-4 py-5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setAdjustingEmpId(Number(empId)); }}
                              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <tr key={`breakdown-${empId}`}>
                              <td colSpan={8} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <EmployeePayrollBreakdown employee={emp} />
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => goToStep(4)}
              className={`${BUTTON_PRIMARY} w-full py-4 text-lg shadow-green-500/20`}
            >
              Confirmar y Proceder <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        ) : null}
      </div>

      {adjustingEmpId !== null && payrollId !== null && (() => {
        const emp = calcResult?.employees.find(
          (e) => Number(e.id ?? e.employee_id ?? e.employeeId) === adjustingEmpId
        );
        if (!emp) return null;
        const normalizedData = {
          regularHours: Number(emp.regularHours ?? emp.regular_hours ?? 0),
          overtimeHours: Number(emp.overtimeHours ?? emp.overtime_hours ?? 0),
          weeklyRestHours: Number(emp.weeklyRestHours ?? emp.weekly_rest_hours ?? 0),
          totalDeductions: Number(emp.totalDeductions ?? emp.total_deductions ?? 0),
        };

        return (
          <PayrollEmployeeAdjustModal
            isOpen={true}
            payrollId={payrollId}
            employeeId={adjustingEmpId}
            employeeName={emp.name ?? emp.employeeName ?? emp.employee_name ?? 'Empleado'}
            currentData={normalizedData}
            onClose={() => setAdjustingEmpId(null)}
            onSave={async () => {
              await refreshPayrollData(() => refetchAguinaldo());
            }}
          />
        );
      })()}
    </>
  );
}
