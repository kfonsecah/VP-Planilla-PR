"use client";

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePayrollWizard, generateBiweeklyPeriods, BiweeklyPeriod } from '@/hooks/usePayrollWizard';
import { NomineeService } from '@/services/nomineeService';
import { PayrollService } from '@/services/payrollService';
import PayrollPeriodCard from '@/components/PayrollPeriodCard';
import PayrollWizardStep2 from '@/components/PayrollWizardStep2';
import PayrollWizardStep3 from '@/components/PayrollWizardStep3';

export default function PayrollWizard() {
  const {
    currentStep,
    selectedPeriod,
    calculationData,
    payrollId,
    selectPeriod,
    goToStep,
    setCalculationData,
    setPayrollId,
    reset,
  } = usePayrollWizard();

  const periods = generateBiweeklyPeriods(2);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handlePeriodSelect = (period: { start: string; end: string; label: string }) => {
    selectPeriod(period);
    setCalcError(null);
  };

  const handleCalculate = useCallback(async () => {
    if (!selectedPeriod) return;
    setIsCalculating(true);
    setCalcError(null);
    try {
      // Create BORRADOR payroll record first to get a payrollId for approval
      const created = await PayrollService.createPayroll({
        payroll_type_id: 1, // Quincenal
        period_start: selectedPeriod.start,
        period_end: selectedPeriod.end,
        payment_date: selectedPeriod.end,
        status: 'BORRADOR',
      });
      setPayrollId(created.id);

      // Calculate payroll for the period, linking to the created record
      const result = await NomineeService.calculatePayrollForPeriod(
        selectedPeriod.start,
        selectedPeriod.end,
        created.id
      );
      setCalculationData(result as Parameters<typeof setCalculationData>[0]);
      goToStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular planilla';
      setCalcError(message);
      toast.error(message);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPeriod, setPayrollId, setCalculationData, goToStep]);

  const handleApprove = useCallback(async (_payrollId: number) => {
    toast.success('Planilla aprobada exitosamente');
    reset();
    goToStep(1);
  }, [reset, goToStep]);

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

          {calcError && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{calcError}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleCalculate}
              disabled={!selectedPeriod || isCalculating}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2
                ${selectedPeriod && !isCalculating
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              {isCalculating && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isCalculating ? 'Calculando...' : 'Calcular Planilla'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Calculation */}
      {currentStep === 2 && calculationData && (
        <PayrollWizardStep2
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={calculationData as any}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
          onConfirm={() => goToStep(3)}
        />
      )}

      {/* Step 3: Executive Summary + Approval */}
      {currentStep === 3 && calculationData && payrollId && (
        <PayrollWizardStep3
          payrollId={payrollId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          calculationData={calculationData as any}
          onApprove={handleApprove}
          onBack={() => goToStep(2)}
        />
      )}

      {/* Fallback if data missing when on step 2/3 */}
      {(currentStep === 2 || currentStep === 3) && !calculationData && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>No hay datos de cálculo disponibles.</p>
          <button
            onClick={() => goToStep(1)}
            className="mt-4 px-4 py-2 text-green-600 hover:text-green-700 font-semibold"
          >
            ← Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}
