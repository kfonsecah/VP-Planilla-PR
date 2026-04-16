"use client";

import React from 'react';
import { usePayrollWizard, generateBiweeklyPeriods, BiweeklyPeriod } from '@/hooks/usePayrollWizard';
import PayrollPeriodCard from '@/components/PayrollPeriodCard';

export default function PayrollWizard() {
  const {
    currentStep,
    selectedPeriod,
    selectPeriod,
    goToStep,
  } = usePayrollWizard();

  const periods = generateBiweeklyPeriods(2);

  const handlePeriodSelect = (period: { start: string; end: string; label: string }) => {
    selectPeriod(period);
  };

  const handleCalculate = () => {
    // TODO: Integrate with calculation service - triggers Step 2
    goToStep(2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {([1, 2, 3] as const).map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep === step
                    ? 'bg-green-600 text-white'
                    : currentStep > step
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }
                `}
              >
                {currentStep > step ? '✓' : step}
              </div>
              {index < 2 && (
                <div
                  className={`
                    w-12 h-0.5
                    ${currentStep > step
                      ? 'bg-green-600'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                    }
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Período</span>
          <span className="w-12" />
          <span>Revisar</span>
          <span className="w-12" />
          <span>Aprobar</span>
        </div>
      </div>

      {/* Step 1: Period Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Seleccione un período
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((period: BiweeklyPeriod) => (
              <PayrollPeriodCard
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                period={period}
                isSelected={
                  selectedPeriod?.start === period.start.toISOString().split('T')[0] &&
                  selectedPeriod?.end === period.end.toISOString().split('T')[0]
                }
                onSelect={handlePeriodSelect}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleCalculate}
              disabled={!selectedPeriod}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-colors
                ${selectedPeriod
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              Calcular Planilla
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Calculation (Placeholder) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => goToStep(1)}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              ← Cambiar período
            </button>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Revisar Cálculo
            </h2>
            <button
              onClick={() => goToStep(3)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Revisar y continuar →
            </button>
          </div>
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>Vista de revisión de cálculo - Phase 37-02</p>
            <p className="text-sm mt-2">Período: {selectedPeriod?.label}</p>
          </div>
        </div>
      )}

      {/* Step 3: Executive Summary (Placeholder) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => goToStep(2)}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              ← Volver
            </button>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Resumen Ejecutivo
            </h2>
            <div className="w-24" />
          </div>
          <div className="bg-green-700 rounded-xl p-6 text-white">
            <p className="text-sm text-green-200">Período</p>
            <p className="font-semibold">{selectedPeriod?.label}</p>
          </div>
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>Vista de aprobación - Phase 37-03</p>
          </div>
        </div>
      )}
    </div>
  );
}