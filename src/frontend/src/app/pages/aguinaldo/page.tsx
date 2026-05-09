'use client';

import React, { useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAguinaldoProjection } from '@/hooks/useAguinaldoProjection';
import { formatCRC } from '@/utils/number';

const CURRENT_YEAR = new Date().getFullYear();

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AguinaldoPage() {
  const [fiscalYear, setFiscalYear] = useState<number>(CURRENT_YEAR);
  const { data, isLoading, error, refresh } = useAguinaldoProjection(fiscalYear);

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-6 py-6 max-w-screen-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Aguinaldo</p>
            <h1 className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">
              Proyección de Aguinaldo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={fiscalYear}
              onChange={e => setFiscalYear(Number(e.target.value))}
              className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Fiscal period info bar */}
        {data && (
          <div className="flex flex-wrap items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4" />
              Período fiscal: <strong>{formatDate(data.fiscalPeriodStart)}</strong> — <strong>{formatDate(data.fiscalPeriodEnd)}</strong>
            </span>
            <span className="hidden sm:block text-amber-400">|</span>
            <span>
              Fecha límite de pago: <strong>{formatDate(data.paymentDeadline)}</strong>
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 p-8 text-center mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total empleados</p>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">{data.summary.totalEmployees}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Aguinaldo acumulado</p>
              <p className="text-2xl font-bold text-[#4A5D3A] dark:text-green-400">
                {formatCRC(data.summary.totalAguinaldoAccumulated)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Comprometido hasta hoy</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Proyección año completo</p>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">
                {formatCRC(data.summary.totalProjectedFullYear)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Si el salario se mantiene igual</p>
            </div>
          </div>
        )}

        {/* Employee table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {isLoading && !data ? (
            <div className="p-10 text-center">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Calculando aguinaldo...</p>
            </div>
          ) : data && data.employees.length === 0 ? (
            <div className="p-10 text-center">
              <BanknotesIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No hay empleados activos en este período.</p>
            </div>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400">Colaborador</th>
                    <th className="text-right px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400">Períodos incl.</th>
                    <th className="text-right px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400">Salario ord. acumulado</th>
                    <th className="text-right px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400">Aguinaldo acumulado</th>
                    <th className="text-right px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400">Proyección año</th>
                    <th className="px-5 py-3 font-medium text-zinc-500 dark:text-zinc-400 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.employees.map(emp => (
                    <tr key={emp.employeeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-700 dark:text-zinc-200">{emp.employeeName}</p>
                        <p className="text-xs text-zinc-400">Ingresó {formatDate(emp.hireDate)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-600 dark:text-zinc-300">
                        {emp.periodsIncluded} / {data.periodsPerYear}
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-600 dark:text-zinc-300">
                        {formatCRC(emp.totalOrdinarySalary)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[#4A5D3A] dark:text-green-400">
                        {formatCRC(emp.aguinaldoAccumulated)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-600 dark:text-zinc-300">
                        {formatCRC(emp.projectedFullYear)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {emp.isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Completo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            <ClockIcon className="w-3.5 h-3.5" />
                            En curso
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 font-semibold">
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">Total</td>
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5 text-right text-[#4A5D3A] dark:text-green-400">
                      {formatCRC(data.summary.totalAguinaldoAccumulated)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-700 dark:text-zinc-200">
                      {formatCRC(data.summary.totalProjectedFullYear)}
                    </td>
                    <td className="px-5 py-3.5" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
