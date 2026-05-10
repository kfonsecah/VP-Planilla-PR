"use client";

import React, { useRef, useCallback } from 'react';
import { 
  CalendarIcon, 
  ChevronRightIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { usePayrollWizard } from '@/hooks/usePayrollWizard';
import { formatDateDisplay } from '@/utils/formatters';

const CARD_CLASSES = "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300";
const INPUT_CLASSES = "w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all";
const BUTTON_PRIMARY = "px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2";

type PeriodType = 'quincenal' | 'mensual' | 'rango_libre';

export default function Step1Period() {
  const {
    periodType,
    setPeriodType,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    selectedMonth,
    selectedQuincena,
    applyQuincenaPreset,
    applyMonthPreset,
    selectPeriod,
    goToStep,
  } = usePayrollWizard();

  const dateStartRef = useRef<HTMLInputElement>(null);
  const dateEndRef = useRef<HTMLInputElement>(null);

  const handleNext = useCallback(() => {
    if (!dateStart || !dateEnd) return;
    selectPeriod({ 
      start: dateStart, 
      end: dateEnd, 
      label: `${formatDateDisplay(dateStart)} – ${formatDateDisplay(dateEnd)}` 
    });
    goToStep(2);
  }, [dateStart, dateEnd, selectPeriod, goToStep]);

  return (
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
              onClick={handleNext}
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
  );
}
