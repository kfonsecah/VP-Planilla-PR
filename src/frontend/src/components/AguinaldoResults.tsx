"use client";

import React from 'react';
import { formatCRC } from '@/utils/number';
import { GiftIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { Employee } from '@/types/employee';

interface AguinaldoEntry {
  employeeId: number;
  aguinaldo: number | null;
  message: string;
}

interface AguinaldoResultsProps {
  results: AguinaldoEntry[];
  employees: Employee[];
  onBack: () => void;
}

export default function AguinaldoResults({ results, employees, onBack }: AguinaldoResultsProps) {
  const employeeMap = new Map(employees.map((e) => [Number(e.id), e]));

  const eligible = results.filter((r) => r.aguinaldo !== null && r.aguinaldo > 0);
  const notEligible = results.filter((r) => r.aguinaldo === null || r.aguinaldo === 0);
  const total = eligible.reduce((sum, r) => sum + (r.aguinaldo ?? 0), 0);

  const CARD = "bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          ← Cambiar período
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <UserGroupIcon className="w-4 h-4 text-green-700" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Empleados elegibles</p>
          </div>
          <p className="text-2xl font-bold text-zinc-700 dark:text-white">{eligible.length}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{notEligible.length} sin derecho</p>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CurrencyDollarIcon className="w-4 h-4 text-green-700" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total a pagar</p>
          </div>
          <p className="text-xl font-bold text-zinc-700 dark:text-white">{formatCRC(total)}</p>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CurrencyDollarIcon className="w-4 h-4 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Promedio por empleado</p>
          </div>
          <p className="text-xl font-bold text-zinc-700 dark:text-white">
            {eligible.length > 0 ? formatCRC(total / eligible.length) : '—'}
          </p>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <GiftIcon className="w-5 h-5 text-green-700" />
          <h3 className="text-base font-semibold text-zinc-700 dark:text-white">Aguinaldo por empleado</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">Cédula</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">Puesto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">Aguinaldo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-700 dark:text-white uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {results.map((r, idx) => {
                const emp = employeeMap.get(r.employeeId);
                const fullName = emp
                  ? [emp.name, emp.middle_name, emp.last_name].filter(Boolean).join(' ')
                  : `Empleado #${r.employeeId}`;
                const hasAguinaldo = r.aguinaldo !== null && r.aguinaldo > 0;

                return (
                  <tr
                    key={r.employeeId}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'} ${!hasAguinaldo ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-zinc-700 dark:text-white">{fullName}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{emp?.national_id ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{emp?.position ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`text-sm font-bold ${hasAguinaldo ? 'text-green-700 dark:text-green-400' : 'text-zinc-400'}`}>
                        {hasAguinaldo ? formatCRC(r.aguinaldo!) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {hasAguinaldo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          Elegible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                          Sin derecho
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-100 dark:bg-zinc-800 border-t-2 border-zinc-300 dark:border-zinc-700">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-zinc-700 dark:text-white">TOTAL AGUINALDO</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-base font-bold text-green-700 dark:text-green-400">{formatCRC(total)}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
