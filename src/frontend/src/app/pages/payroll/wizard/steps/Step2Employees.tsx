"use client";

import React, { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { usePayrollWizardContext } from '@/contexts/PayrollWizardContext';
import { getEmployees } from '@/services/employeeService';
import { Tooltip } from '@/components/ui/Tooltip';

const CARD_CLASSES = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300";
const INPUT_CLASSES = "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all";
const BUTTON_PRIMARY = "px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const BUTTON_SECONDARY = "px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2";

export default function Step2Employees() {
  const {
    currentStep,
    goToStep,
    setSelectedEmployeeIds,
    minWageCheckEnabled,
    globalMinWageRate,
    // Step 2 state from hook
    employees,
    setEmployees,
    loadingEmployees,
    setLoadingEmployees,
    checkedIds,
    filterText,
    setFilterText,
    toggleAll,
    toggleEmployee
  } = usePayrollWizardContext();

  // ── Load employees when entering Step 2 ──────────────────────────────────
  useEffect(() => {
    if (currentStep !== 2) return;
    setLoadingEmployees(true);
    getEmployees()
      .then((list) => setEmployees(list))
      .catch(() => toast.error('Error cargando empleados'))
      .finally(() => setLoadingEmployees(false));
  }, [currentStep, setEmployees, setLoadingEmployees]);

  const handleNextStep2 = useCallback(() => {
    if (checkedIds.size === 0) return;
    const ids = Array.from(checkedIds).map(Number);
    setSelectedEmployeeIds(ids);
    goToStep(3);
  }, [checkedIds, setSelectedEmployeeIds, goToStep]);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(filterText.toLowerCase()) ||
    e.position_name?.toLowerCase().includes(filterText.toLowerCase()) ||
    e.position?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
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
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{emp.position_name || emp.position || 'Sin posición'}</p>
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
  );
}
