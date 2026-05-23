"use client";

import React from 'react';
import PayrollResults from '@/components/PayrollResults';
import type { CalculationResult } from '@/types/payrollWizard';

interface PayrollWizardStep2Props {
  data: CalculationResult;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
}

export default function PayrollWizardStep2({
  data,
  onBack,
  onNext,
  onConfirm,
}: PayrollWizardStep2Props) {
  // Check for any employee inconsistencies
  const hasInconsistencies = data?.employees?.some(
    (emp) => emp.inconsistencies && emp.inconsistencies.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          ← Cambiar período
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Revisar y continuar →
        </button>
      </div>

      {/* Warning if has inconsistencies */}
      {hasInconsistencies && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 2h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Algunos empleados tienen inconsistencias
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Revise los detalles antes de aprobar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reuse existing PayrollResults component */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PayrollResults data={data as any} onCreate={onConfirm} />
    </div>
  );
}