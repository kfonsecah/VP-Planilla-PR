import { useState, useCallback } from 'react';

export interface BiweeklyPeriod {
  start: Date;
  end: Date;
  label: string;
  isCurrent: boolean;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  selectedPeriod: {
    start: string;
    end: string;
    label: string;
    preCalculated?: boolean;
  } | null;
  calculationData: CalculationResult | null;
  payrollId: number | null;
}

interface CalculationResult {
  period: {
    label: string;
    start: string;
    end: string;
  };
  employees: CalculationEmployee[];
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  createdAt: string;
}

interface CalculationEmployee {
  id: number;
  name: string;
  grossSalary: number;
  netSalary: number;
  deductions: DeductionBreakdown[];
  inconsistencies?: string[];
}

interface DeductionBreakdown {
  type: string;
  amount: number;
}

export function usePayrollWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<WizardState['selectedPeriod']>(null);
  const [calculationData, setCalculationData] = useState<CalculationResult | null>(null);
  const [payrollId, setPayrollId] = useState<number | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'rango_libre'>('quincenal');

  const selectPeriod = useCallback((period: {
    start: string;
    end: string;
    label: string;
    preCalculated?: boolean;
  }) => {
    setSelectedPeriod({
      start: period.start,
      end: period.end,
      label: period.label,
      preCalculated: period.preCalculated ?? true,
    });
  }, []);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
  }, []);

  const setCalculationDataState = useCallback((data: CalculationResult) => {
    setCalculationData(data);
  }, []);

  const setPayrollIdState = useCallback((id: number) => {
    setPayrollId(id);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setSelectedPeriod(null);
    setCalculationData(null);
    setPayrollId(null);
    setSelectedEmployeeIds([]);
    setPeriodType('quincenal');
  }, []);

  return {
    currentStep,
    selectedPeriod,
    calculationData,
    payrollId,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    periodType,
    setPeriodType,
    selectPeriod,
    goToStep,
    setCalculationData: setCalculationDataState,
    setPayrollId: setPayrollIdState,
    reset,
  };
}

// Generate biweekly periods for selection
export function generateBiweeklyPeriods(monthsBack: number = 2): BiweeklyPeriod[] {
  const periods: BiweeklyPeriod[] = [];
  const today = new Date();

  for (let i = 0; i < monthsBack * 2; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // First quincena: 1-15
    const q1Start = new Date(year, month, 1);
    const q1End = new Date(year, month, 15);

    // Second quincena: 16-last day
    const q2Start = new Date(year, month, 16);
    const q2End = new Date(year, month + 1, 0);

    const monthName = monthDate.toLocaleDateString('es-CR', { month: 'long' });

    periods.push({
      start: q1Start,
      end: q1End,
      label: `1ª Quincena ${monthName}`,
      isCurrent: i === 0 && today.getDate() <= 15
    });

    periods.push({
      start: q2Start,
      end: q2End,
      label: `2ª Quincena ${monthName}`,
      isCurrent: i === 0 && today.getDate() > 15
    });
  }

  return periods;
}