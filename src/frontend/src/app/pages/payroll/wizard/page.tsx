"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayrollWizard } from '@/hooks/usePayrollWizard';
import { useAguinaldoSummary } from '@/hooks/useAguinaldoSummary';
import { NomineeService } from '@/services/nomineeService';
import { PayrollService } from '@/services/payrollService';
import { getEmployees } from '@/services/employeeService';
import { Tooltip } from '@/components/ui/Tooltip';
import PayrollWizardStep3 from '@/components/PayrollWizardStep3';
import PayrollEmployeeAdjustModal from '@/components/PayrollEmployeeAdjustModal';
import EmployeePayrollBreakdown from '@/components/EmployeePayrollBreakdown';
import type { Employee } from '@/types/employee';
import type { PayrollCalculationResult, EmployeePayroll, DeductionBreakdown, Inconsistency } from '@/types/payrollTypes';
import type { CalculationResult, CalculationEmployee, DeductionBreakdown as WizardDeductionBreakdown } from '@/types/payrollWizard';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  DocumentCheckIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { formatDateDisplay } from '@/utils/formatters';

type PeriodType = 'quincenal' | 'mensual' | 'rango_libre';

const STEPS = [
  { label: 'Período', icon: CalendarIcon },
  { label: 'Empleados', icon: UserGroupIcon },
  { label: 'Revisar', icon: DocumentCheckIcon },
  { label: 'Aprobar', icon: CheckCircleIcon }
] as const;

const CARD_CLASSES = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300";
const INPUT_CLASSES = "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all";
const BUTTON_PRIMARY = "px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const BUTTON_SECONDARY = "px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2";

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
    minWageCheckEnabled,
    globalMinWageRate,
    selectPeriod,
    goToStep,
    setCalculationData,
    setPayrollId,
    reset,
  } = usePayrollWizard();

  const { data: aguinaldoData, refetch: refetchAguinaldo } = useAguinaldoSummary(payrollId);

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedQuincena, setSelectedQuincena] = useState<1 | 2 | null>(null);

  const dateStartRef = useRef<HTMLInputElement>(null);
  const dateEndRef = useRef<HTMLInputElement>(null);

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<PayrollCalculationResult | null>(null);
  const [adjustingEmpId, setAdjustingEmpId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  // Stores transient nomination data (not persisted to DB) keyed by employee_id
  const nominationTransientRef = useRef<Map<number, {
    baseHourlySalary: number;
    deductionsBreakdown: DeductionBreakdown[];
    inconsistencies: Inconsistency[];
    generalMessages: string[];
  }>>(new Map());

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
  }, [calcResult]);

  // Reset expand state when leaving step 3
  useEffect(() => {
    if (currentStep !== 3) setExpandedIds(new Set());
  }, [currentStep]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const mergeWithTransientData = useCallback((freshEmployees: unknown[]): EmployeePayroll[] => {
    return freshEmployees.map(fresh => {
      const f = fresh as Record<string, unknown>;
      const empId = Number(f.employee_id ?? f.id);
      const transient = nominationTransientRef.current.get(empId);
      return {
        ...f,
        baseHourlySalary: transient?.baseHourlySalary ?? Number(f.baseHourlySalary ?? 0),
        deductionsBreakdown: (transient?.deductionsBreakdown ?? f.deductionsBreakdown ?? []) as DeductionBreakdown[],
        inconsistencies: (transient?.inconsistencies ?? f.inconsistencies ?? []) as Inconsistency[],
        generalMessages: (transient?.generalMessages ?? f.generalMessages ?? []) as string[],
      } as EmployeePayroll;
    });
  }, []);

  const toggleExpand = useCallback((id: number | string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const applyQuincenaPreset = useCallback((half: 1 | 2) => {
    setSelectedQuincena(half);
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
    const filteredEmployees = employees.filter(e => 
      e.name.toLowerCase().includes(filterText.toLowerCase())
    );
    
    if (checkedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  }, [checkedIds.size, employees, filterText]);

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

  const mapToWizardResult = useCallback((res: PayrollCalculationResult): CalculationResult => {
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    const mappedEmployees: CalculationEmployee[] = res.employees.map(emp => {
      const gross = emp.grossSalary ?? (emp as any).gross_salary ?? 0;
      const net = emp.netSalary ?? (emp as any).net_salary ?? 0;
      const deductions = emp.totalDeductions ?? (emp as any).total_deductions ?? 0;

      totalGross += gross;
      totalNet += net;
      totalDeductions += deductions;

      return {
        id: Number(emp.id ?? emp.employee_id ?? emp.employeeId),
        name: emp.name ?? emp.employeeName ?? emp.employee_name ?? 'Empleado',
        grossSalary: gross,
        netSalary: net,
        deductions: (emp.deductionsBreakdown ?? []).map(d => ({
          type: d.type,
          amount: d.amount
        })) as WizardDeductionBreakdown[],
        inconsistencies: (emp.inconsistencies ?? []).map(i => typeof i === 'string' ? i : i.message)
      };
    });

    return {
      period: {
        label: `${formatDateDisplay(res.period.startDate)} – ${formatDateDisplay(res.period.endDate)}`,
        start: res.period.startDate,
        end: res.period.endDate
      },
      employees: mappedEmployees,
      totalGross,
      totalNet,
      totalDeductions,
      createdAt: new Date().toISOString()
    };
  }, []);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      let currentId = payrollId;

      if (currentId === null) {
        const payroll = await PayrollService.createPayroll({
          payroll_type_id: 1,
          period_start: dateStart,
          period_end: dateEnd,
          payment_date: dateEnd,
          status: 'BORRADOR',
        });
        currentId = payroll.id;
        setPayrollId(currentId);
      }

      const result = await NomineeService.calculatePayrollForPeriod(
        dateStart,
        dateEnd,
        currentId,
        selectedEmployeeIds,
      );

      // Persist transient nomination data (not stored in DB) for merge after refresh
      nominationTransientRef.current.clear();
      result.employees.forEach(calc => {
        const empId = Number(calc.employeeId ?? calc.employee_id ?? calc.id);
        if (!empId) return;
        nominationTransientRef.current.set(empId, {
          baseHourlySalary: calc.baseHourlySalary ?? 0,
          deductionsBreakdown: calc.deductionsBreakdown ?? [],
          inconsistencies: calc.inconsistencies ?? [],
          generalMessages: calc.generalMessages ?? [],
        });
      });

      const freshEmployees = await PayrollService.getPayrollEmployees(currentId!);
      const normalizedData: PayrollCalculationResult = { ...result, employees: mergeWithTransientData(freshEmployees) };

      setCalcResult(normalizedData);
      setCalculationData(mapToWizardResult(normalizedData));
      await refetchAguinaldo();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al calcular la planilla';
      setCalcError(msg);
      toast.error(msg);
    } finally {
      setIsCalculating(false);
    }
  }, [dateStart, dateEnd, selectedEmployeeIds, payrollId, setPayrollId, setCalculationData, refetchAguinaldo, mapToWizardResult]);

  const refreshPayrollData = useCallback(async () => {
    if (payrollId === null) return;
    try {
      const updatedEmployees = await PayrollService.getPayrollEmployees(payrollId);

      const newResult: PayrollCalculationResult = {
        ...(calcResult as PayrollCalculationResult),
        employees: mergeWithTransientData(updatedEmployees),
      };
      
      setCalcResult(newResult);
      setCalculationData(mapToWizardResult(newResult));
      await refetchAguinaldo();
      toast.success('Datos actualizados');
    } catch {
      toast.error('Error al refrescar datos de la planilla');
    }
  }, [payrollId, calcResult, setCalcResult, setCalculationData, refetchAguinaldo, mapToWizardResult]);

  const handleApprove = useCallback(async (pid: number) => {
    await PayrollService.approvePayroll(pid);
    toast.success('Planilla aprobada exitosamente');
    reset();
    setDateStart('');
    setDateEnd('');
    setCheckedIds(new Set());
    setCalcResult(null);
  }, [reset]);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (e as any).position_name?.toLowerCase().includes(filterText.toLowerCase()) ||
    e.position?.toLowerCase().includes(filterText.toLowerCase())
  );

  const calcEmployees: EmployeePayroll[] = Array.isArray(calcResult?.employees)
    ? calcResult.employees
    : [];

  const inconsistentCount = calcEmployees.filter(
    (e) => Array.isArray(e.inconsistencies) && e.inconsistencies.length > 0
  ).length;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-[#A3A3A3] uppercase tracking-widest mb-1">Cálculo de Planillas</p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-[#E5E5E5] leading-none">
              Nueva Planilla
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              Procesa el pago de tus colaboradores de forma rápida y segura.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <DocumentCheckIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium">Estado</p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Paso {currentStep} de 4</p>
            </div>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-5" />

        {/* Premium Animated Step Indicator (Compact) */}
        <div className="relative mb-12 px-4 sm:px-10">
          {/* Background Track */}
          <div className="absolute top-5 left-9 right-9 sm:left-[60px] sm:right-[60px] h-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full z-10 translate-y-[-50%]" />
          
          {/* Animated Progress Fill */}
          <motion.div 
            className="absolute top-5 left-9 right-9 sm:left-[60px] sm:right-[60px] h-0.5 bg-green-500 rounded-full z-10 origin-left translate-y-[-50%]"
            initial={false}
            animate={{ scaleX: (currentStep - 1) / (STEPS.length - 1) }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          <div className="relative z-20 flex justify-between">
            {STEPS.map((step, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3 | 4;
              const isActive = currentStep === stepNum;
              const isDone = currentStep > stepNum;
              const Icon = step.icon;

              return (
                <div key={step.label} className="flex flex-col items-center group">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg relative z-30 border-2 ${
                      isActive 
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-4 ring-green-500/10 border-green-500/50' 
                        : isDone 
                          ? 'bg-green-600 border-green-600 text-white' 
                          : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </motion.div>
                  
                  <div className="mt-3 text-center">
                    <p className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${
                      isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: Período ────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={`lg:col-span-8 ${CARD_CLASSES} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    Período de pago
                  </h2>
                  <p className="text-xs text-zinc-500">Selecciona el rango de fechas.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Tipo de período selection */}
                <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  {(['quincenal', 'mensual', 'rango_libre'] as PeriodType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setPeriodType(t); setDateStart(''); setDateEnd(''); }}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        periodType === t
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {t === 'rango_libre' ? 'Personalizado' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Specific selectors */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {periodType === 'quincenal' && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => applyQuincenaPreset(1)}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all group ${
                          selectedQuincena === 1
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10'
                        }`}
                      >
                        <span className={`text-xs font-bold uppercase transition-colors ${
                          selectedQuincena === 1 ? 'text-green-600' : 'text-zinc-400 group-hover:text-green-600'
                        }`}>Primera Quincena</span>
                        <span className={`text-sm font-bold ${
                          selectedQuincena === 1 ? 'text-green-800 dark:text-green-100' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>1 – 15 de este mes</span>
                      </button>
                      <button
                        onClick={() => applyQuincenaPreset(2)}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all group ${
                          selectedQuincena === 2
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10'
                        }`}
                      >
                        <span className={`text-xs font-bold uppercase transition-colors ${
                          selectedQuincena === 2 ? 'text-green-600' : 'text-zinc-400 group-hover:text-green-600'
                        }`}>Segunda Quincena</span>
                        <span className={`text-sm font-bold ${
                          selectedQuincena === 2 ? 'text-green-800 dark:text-green-100' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>16 – Fin de mes</span>
                      </button>
                    </div>
                  )}

                  {periodType === 'mensual' && (
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                        Seleccionar Mes
                      </label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(e.target.value);
                          applyMonthPreset(e.target.value);
                        }}
                        className={INPUT_CLASSES}
                      />
                    </div>
                  )}

                  {/* Date inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                        Fecha Inicio
                      </label>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => periodType === 'rango_libre' && dateStartRef.current?.showPicker()}
                      >
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-hover:text-green-500 transition-colors z-10" />
                        <input
                          ref={dateStartRef}
                          type="date"
                          value={dateStart}
                          onChange={(e) => setDateStart(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 z-0 pointer-events-none"
                        />
                        <div className={`${INPUT_CLASSES} pl-12 flex items-center min-h-[45px] text-zinc-800 dark:text-zinc-100 ${periodType !== 'rango_libre' ? 'opacity-70 cursor-default' : ''}`}>
                          {dateStart ? formatDateDisplay(dateStart) : <span className="text-zinc-400">Seleccionar fecha</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                        Fecha Fin
                      </label>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => periodType === 'rango_libre' && dateEndRef.current?.showPicker()}
                      >
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-hover:text-green-500 transition-colors z-10" />
                        <input
                          ref={dateEndRef}
                          type="date"
                          value={dateEnd}
                          onChange={(e) => setDateEnd(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 z-0 pointer-events-none"
                        />
                        <div className={`${INPUT_CLASSES} pl-12 flex items-center min-h-[45px] text-zinc-800 dark:text-zinc-100 ${periodType !== 'rango_libre' ? 'opacity-70 cursor-default' : ''}`}>
                          {dateEnd ? formatDateDisplay(dateEnd) : <span className="text-zinc-400">Seleccionar fecha</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleNextStep1}
                    disabled={!dateStart || !dateEnd}
                    className={`${BUTTON_PRIMARY} w-full`}
                  >
                    Confirmar Período <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-2xl bg-zinc-900 text-white shadow-xl">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Información Legal</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <ExclamationCircleIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      VP-Planilla valida automáticamente los recargos por feriados y horas extra según la ley laboral de Costa Rica.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      El cálculo incluye el acumulado proporcional para el aguinaldo de forma automática.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Empleados ──────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className={`${CARD_CLASSES} p-6 max-w-3xl mx-auto`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    Colaboradores
                  </h2>
                  <p className="text-xs text-zinc-500">Selecciona quiénes incluir en la planilla.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl">
                <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{checkedIds.size}</span>
                <span className="text-xs text-zinc-400 font-medium">/ {employees.length} seleccionados</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o posición..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className={`${INPUT_CLASSES} pl-12`}
                />
              </div>
              <button
                onClick={toggleAll}
                className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all whitespace-nowrap"
              >
                {checkedIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? 'Deseleccionar todos' : 'Marcar todos'}
              </button>
            </div>

            {loadingEmployees ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                <p className="text-sm text-zinc-400 font-medium">Cargando lista de colaboradores...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 custom-scrollbar mb-8">
                {filteredEmployees.map((emp) => {
                  const rawSalary = Number(emp.salary);
                  const hourlySalary = rawSalary > 5000 ? (rawSalary / 30 / 8) : rawSalary;
                  const threshold = Number(globalMinWageRate);
                  const isLowWage = minWageCheckEnabled === 1 && 
                    Math.round(hourlySalary * 100) / 100 < Math.round(threshold * 100) / 100;
                  const isChecked = checkedIds.has(emp.id);

                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                        isChecked 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                          : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400'
                      }`}>
                        {isChecked && <CheckCircleIcon className="w-5 h-5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmployee(emp.id)}
                        className="hidden"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isChecked ? 'text-green-800 dark:text-green-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{(emp as any).position_name || emp.position || 'Sin posición'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">₡{Number(emp.salary).toLocaleString('es-CR')}</p>
                        {isLowWage && (
                          <Tooltip content={`Salario inferior a tarifa mínima (₡${Number(threshold).toFixed(2)})`}>
                            <ExclamationCircleIcon className="w-4 h-4 text-amber-500 ml-auto mt-1 cursor-help" />
                          </Tooltip>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => goToStep(1)} className={`${BUTTON_SECONDARY} flex-1`}>
                <ArrowLeftIcon className="w-5 h-5" /> Anterior
              </button>
              <button
                onClick={handleNextStep2}
                disabled={checkedIds.size === 0}
                className={`${BUTTON_PRIMARY} flex-[2]`}
              >
                Calcular Planilla <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Revisar / Ajustar ──────────────────────────────────── */}
        {currentStep === 3 && (
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
                  {/* Outer Glow */}
                  <div className="absolute inset-[-20px] bg-green-500/10 dark:bg-green-500/5 rounded-full blur-2xl animate-pulse" />
                  
                  {/* Rotating Layers */}
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
                      Procesando cálculos
                      <span className="inline-flex w-8 text-left animate-pulse">...</span>
                    </p>
                    <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 animate-pulse" />
                  </div>
                </div>

                {/* Simulated Progress Bar */}
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
                <button onClick={handleCalculate} className={BUTTON_PRIMARY + " mx-auto"}>Reintentar Cálculo</button>
              </div>
            ) : calcResult ? (
              <div className="animate-in fade-in duration-700">
                {/* Inconsistencies Alert */}
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

                {/* Main Results Table */}
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
                        const rowBorder = hasIssues
                          ? 'border-l-2 border-amber-400 dark:border-amber-500'
                          : '';

                        return (
                          <React.Fragment key={empId}>
                            <tr
                              className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group cursor-pointer select-none ${rowBorder}`}
                              onClick={() => toggleExpand(empId as number | string)}
                            >
                              {/* Chevron */}
                              <td className="w-10 px-3 py-5 text-center">
                                <ChevronRightIcon
                                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 mx-auto ${isExpanded ? 'rotate-90' : ''}`}
                                />
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
                                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                    Revisión
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider">
                                    Validado
                                  </span>
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
        )}

        {/* ── STEP 4: Aprobar ────────────────────────────────────────────── */}
        {currentStep === 4 && payrollId !== null && calculationData !== null && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
            <PayrollWizardStep3
              payrollId={payrollId}
              calculationData={calculationData}
              onApprove={handleApprove}
              onBack={() => goToStep(3)}
            />
          </div>
        )}
        {/* ── Adjust Modal (Global to escape overflows) ──────────────────── */}
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
                await refreshPayrollData();
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}
