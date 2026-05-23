"use client";

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePayrollWizard, generateBiweeklyPeriods, BiweeklyPeriod } from '@/hooks/usePayrollWizard';
import { NomineeService } from '@/services/nomineeService';
import { PayrollService } from '@/services/payrollService';
import { getEmployees } from '@/services/employeeService';
import PayrollPeriodCard from '@/components/PayrollPeriodCard';
import PayrollWizardStep2 from '@/components/PayrollWizardStep2';
import Step4Approve from '@/app/pages/payroll/wizard/steps/Step4Approve';
import DatePicker from '@/components/DatePicker';
import AguinaldoResults from '@/components/AguinaldoResults';
import { useLegalParamAlerts } from '@/hooks/useLegalParamAlerts';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Employee } from '@/types/employee';
import type { CalculationResult } from '@/types/payrollWizard';

type WizardType = 'quincenal' | 'aguinaldo';

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year.slice(-2)}`;
}

function displayToIso(display: string): string {
  const [day, month, year] = display.split('/');
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month}-${day}`;
}

function getDefaultAguinaldoDates() {
  const today = new Date();
  const endIso = today.toISOString().split('T')[0];
  const startIso = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  return { start: isoToDisplay(startIso), end: isoToDisplay(endIso) };
}

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
  const [wizardType, setWizardType] = useState<WizardType>('quincenal');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [aguinaldoEmployees, setAguinaldoEmployees] = useState<Employee[]>([]);
  const [wizardAlertDismissed, setWizardAlertDismissed] = useState(false);
  const { alerts: legalParamAlerts } = useLegalParamAlerts();

  const defaults = getDefaultAguinaldoDates();
  const [aguinaldoStart, setAguinaldoStart] = useState(defaults.start);
  const [aguinaldoEnd, setAguinaldoEnd] = useState(defaults.end);

  const handleTypeChange = (type: WizardType) => {
    setWizardType(type);
    reset();
    setCalcError(null);
  };

  const handlePeriodSelect = (period: { start: string; end: string; label: string }) => {
    selectPeriod(period);
    setCalcError(null);
  };

  const handleCalculateQuincenal = useCallback(async () => {
    if (!selectedPeriod) return;
    setIsCalculating(true);
    setCalcError(null);
    try {
      const created = await PayrollService.createPayroll({
        payroll_type_id: 1,
        period_start: selectedPeriod.start,
        period_end: selectedPeriod.end,
        payment_date: selectedPeriod.end,
        status: 'BORRADOR',
      });
      setPayrollId(created.id);
      const result = await NomineeService.calculatePayrollForPeriod(
        selectedPeriod.start,
        selectedPeriod.end,
        created.id
      );
      setCalculationData(result as unknown as CalculationResult);
      goToStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular planilla';
      setCalcError(message);
      toast.error(message);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPeriod, setPayrollId, setCalculationData, goToStep]);

  const handleCalculateAguinaldo = useCallback(async () => {
    if (!aguinaldoStart || !aguinaldoEnd) return;
    setIsCalculating(true);
    setCalcError(null);
    try {
      const employees = await getEmployees();
      const activeIds = employees
        .filter((e) => e.status !== 'fired')
        .map((e) => Number(e.id))
        .filter((id) => !isNaN(id));

      if (activeIds.length === 0) {
        throw new Error('No hay empleados activos para calcular aguinaldo');
      }

      const result = await NomineeService.calculateAguinaldo(activeIds, displayToIso(aguinaldoStart), displayToIso(aguinaldoEnd));
      setAguinaldoEmployees(employees);
      setCalculationData(result as unknown as CalculationResult);
      goToStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al calcular aguinaldo';
      setCalcError(message);
      toast.error(message);
    } finally {
      setIsCalculating(false);
    }
  }, [aguinaldoStart, aguinaldoEnd, setCalculationData, goToStep]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApprove = useCallback(async (_payrollId: number) => {
    toast.success('Planilla aprobada exitosamente');
    reset();
  }, [reset]);

  const isAguinaldo = wizardType === 'aguinaldo';
  const steps = isAguinaldo ? ['Período', 'Revisar'] : ['Período', 'Revisar', 'Aprobar'];
  const stepCount = steps.length as 2 | 3;

  return (
    <div className="w-full p-6">
      {/* Type tabs */}
      {currentStep === 1 && (
        <div className="flex gap-2 mb-6">
          {(['quincenal', 'aguinaldo'] as WizardType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
                wizardType === type
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {type === 'quincenal' ? 'Planilla Quincenal' : 'Aguinaldo'}
            </button>
          ))}
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {steps.map((label, index) => {
            const step = (index + 1) as 1 | 2 | 3;
            return (
              <React.Fragment key={step}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep === step
                    ? 'bg-green-600 text-white'
                    : currentStep > step
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                {index < stepCount - 1 && (
                  <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {steps.map((label, index) => (
            <React.Fragment key={label}>
              <span>{label}</span>
              {index < stepCount - 1 && <span className="w-12" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Period Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {legalParamAlerts.length > 0 && !wizardAlertDismissed && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Parámetros legales modificados
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Los parámetros legales cambiaron desde que esta planilla fue creada. Se recomienda recalcular antes de aprobar.
                  </p>
                </div>
                <button
                  onClick={() => setWizardAlertDismissed(true)}
                  aria-label="Descartar por ahora"
                  className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {!isAguinaldo ? (
            <>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Seleccione un período</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Período de Aguinaldo</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Seleccione el rango del período laboral. El aguinaldo cubre hasta 12 meses de trabajo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fecha inicio</label>
                  <DatePicker
                    value={aguinaldoStart}
                    onChange={setAguinaldoStart}
                    rangeStart={aguinaldoStart}
                    rangeEnd={aguinaldoEnd}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fecha fin</label>
                  <DatePicker
                    value={aguinaldoEnd}
                    onChange={setAguinaldoEnd}
                    rangeStart={aguinaldoStart}
                    rangeEnd={aguinaldoEnd}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {calcError && (
            <p className="text-sm text-red-600 dark:text-red-400">{calcError}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={isAguinaldo ? handleCalculateAguinaldo : handleCalculateQuincenal}
              disabled={(!isAguinaldo && !selectedPeriod) || isCalculating}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                ((isAguinaldo || selectedPeriod) && !isCalculating)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isCalculating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isCalculating ? 'Calculando...' : isAguinaldo ? 'Calcular Aguinaldo' : 'Calcular Planilla'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {currentStep === 2 && calculationData && isAguinaldo && (
        <AguinaldoResults
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results={calculationData as any}
          employees={aguinaldoEmployees}
          onBack={() => { reset(); goToStep(1); }}
        />
      )}
      {currentStep === 2 && calculationData && !isAguinaldo && (
        <PayrollWizardStep2
          data={calculationData}
          onBack={() => { reset(); goToStep(1); }}
          onNext={() => goToStep(3)}
          onConfirm={() => goToStep(3)}
        />
      )}

      {/* Step 3: Approve (quincenal only) */}
      {currentStep === 3 && calculationData && payrollId && !isAguinaldo && (
        <Step4Approve
          payrollId={payrollId}
          calculationData={calculationData}
          onApprove={handleApprove}
          onBack={() => goToStep(2)}
        />
      )}

      {/* Fallback */}
      {(currentStep === 2 || currentStep === 3) && !calculationData && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p>No hay datos de cálculo disponibles.</p>
          <button onClick={() => goToStep(1)} className="mt-4 px-4 py-2 text-green-600 hover:text-green-700 font-semibold">
            ← Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}
