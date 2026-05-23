"use client";

import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { EmployeePayroll } from '@/types/payrollTypes';

interface Props {
  employee: EmployeePayroll;
}

function fmtCRC(n: number): string {
  return n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtHours(n: number): string {
  return n.toFixed(1) + 'h';
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const EmployeePayrollBreakdown: React.FC<Props> = ({ employee }) => {
  const e = employee as EmployeePayroll & Record<string, unknown>;

  const rate          = Number(e.baseHourlySalary ?? 0);
  const regularHours  = Number(e.regularHours  ?? e.regular_hours  ?? 0);
  const overtimeHours = Number(e.overtimeHours ?? e.overtime_hours ?? 0);
  const restHours     = Number(e.weeklyRestHours  ?? e.weekly_rest_hours  ?? 0);
  const restPay       = Number(e.weeklyRestPay    ?? e.weekly_rest_pay    ?? 0);
  const overtimePay   = Number(e.overtimePay      ?? e.overtime_pay       ?? 0);
  const bonuses       = Number(e.bonuses ?? 0);
  const grossSalary   = Number(e.grossSalary   ?? e.gross_salary   ?? 0);
  const totalDeductions = Number(e.totalDeductions ?? e.total_deductions ?? 0);
  const netSalary     = Number(e.netSalary ?? e.net_salary ?? 0);
  const isAdjusted    = Boolean(e.is_manually_adjusted);

  const deductionsBreakdown = Array.isArray(e.deductionsBreakdown) ? e.deductionsBreakdown : [];
  const inconsistencies = Array.isArray(e.inconsistencies)
    ? (e.inconsistencies as Array<string | { message: string }>).map(
        i => typeof i === 'string' ? i : i.message
      )
    : [];
  const generalMessages = Array.isArray(e.generalMessages)
    ? (e.generalMessages as string[])
    : [];

  // Regular pay = gross minus the itemised components
  const regularPay = Math.max(0, grossSalary - restPay - overtimePay - bonuses);
  const hasNoHours  = grossSalary === 0 && regularHours === 0 && overtimeHours === 0;

  interface SalaryRow {
    label: string;
    hours: number | null;
    rate: number | null;
    factor: string | null;
    amount: number;
  }
  const salaryRows: SalaryRow[] = [];
  if (regularPay > 0) {
    salaryRows.push({
      label: 'Horas regulares',
      hours: regularHours > 0 ? regularHours : null,
      rate: rate > 0 ? rate : null,
      factor: null,
      amount: regularPay,
    });
  }
  if (restPay > 0) {
    salaryRows.push({
      label: 'Descanso semanal',
      hours: restHours > 0 ? restHours : null,
      rate: rate > 0 ? rate : null,
      factor: null,
      amount: restPay,
    });
  }
  if (overtimePay > 0) {
    salaryRows.push({
      label: 'Horas extra',
      hours: overtimeHours > 0 ? overtimeHours : null,
      rate: rate > 0 ? rate : null,
      factor: '×1.5',
      amount: overtimePay,
    });
  }
  if (bonuses > 0) {
    salaryRows.push({ label: 'Bono del período', hours: null, rate: null, factor: null, amount: bonuses });
  }

  const warnings = [
    ...inconsistencies,
    ...generalMessages.filter(m => /advertencia|inconsistencia|error|huérfana/i.test(m)),
  ];
  const infos = generalMessages.filter(m => !/advertencia|inconsistencia|error|huérfana/i.test(m));

  return (
    <div className="px-4 pb-5 pt-3 md:px-6 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/70">
      {isAdjusted && (
        <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
          Ajuste manual aplicado
        </span>
      )}

      {hasNoHours ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/60">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Este colaborador no tiene horas registradas en el período.
            Verifique las marcas de asistencia antes de aprobar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Salary composition */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
              Composición del salario bruto
            </p>
            <div className="font-mono text-xs space-y-0">
              {salaryRows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-2">
                    <span className="text-zinc-700 dark:text-zinc-300">{row.label}</span>
                    {row.hours !== null && row.rate !== null && (
                      <span className="text-zinc-400 text-[10px] whitespace-nowrap">
                        {fmtHours(row.hours)}&thinsp;×&thinsp;₡{fmtCRC(row.rate)}/h
                        {row.factor && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">({row.factor})</span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold whitespace-nowrap">
                    ₡{fmtCRC(row.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-black">
                <span className="text-zinc-800 dark:text-zinc-100">Salario bruto</span>
                <span className="text-zinc-900 dark:text-white">₡{fmtCRC(grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Right — Deductions */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
              Deducciones
            </p>
            <div className="font-mono text-xs space-y-0">
              {deductionsBreakdown.length > 0 ? (
                deductionsBreakdown.map((d, i) => {
                  const displayName = d.message?.split(':')[0]?.trim() ?? d.code;
                  const rateInfo   = d.message?.split(':')[1]?.trim() ?? '';
                  return (
                    <div
                      key={i}
                      className="flex items-baseline justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 flex-1 truncate pr-2">
                        {displayName}
                      </span>
                      <div className="flex items-baseline gap-3 whitespace-nowrap">
                        {d.type === 'percent' && (
                          <span className="text-zinc-400 text-[10px]">{rateInfo}</span>
                        )}
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                          ₡{fmtCRC(d.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : totalDeductions > 0 ? (
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-700 dark:text-zinc-300">Deducciones aplicadas</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold">₡{fmtCRC(totalDeductions)}</span>
                </div>
              ) : (
                <p className="text-zinc-400 text-[11px] py-1.5">Sin deducciones registradas</p>
              )}

              {totalDeductions > 0 && (
                <>
                  <div className="flex justify-between pt-2 font-black border-t border-zinc-200 dark:border-zinc-700 mt-1">
                    <span className="text-zinc-700 dark:text-zinc-300">Total deducciones</span>
                    <span className="text-red-600 dark:text-red-400">₡{fmtCRC(totalDeductions)}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Salario bruto</span>
                      <span>₡{fmtCRC(grossSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>− Total deducciones</span>
                      <span>₡{fmtCRC(totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="text-zinc-800 dark:text-zinc-100">Salario neto</span>
                      <span className="text-green-700 dark:text-green-400">₡{fmtCRC(netSalary)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(warnings.length > 0 || infos.length > 0) && (
        <div className="mt-5 space-y-3">
          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/60">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Advertencias
                </span>
              </div>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex gap-2">
                    <span className="text-amber-400 flex-shrink-0">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {infos.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/60">
              <div className="flex items-center gap-2 mb-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">
                  Información
                </span>
              </div>
              <ul className="space-y-1">
                {infos.map((m, i) => (
                  <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeePayrollBreakdown;
