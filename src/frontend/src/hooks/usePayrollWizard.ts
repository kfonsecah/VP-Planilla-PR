import { useState, useCallback, useEffect } from 'react';
import { LegalParamService } from '@/services/legalParamService';
import type { CalculationResult } from '@/types/payrollWizard';

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

export function usePayrollWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<WizardState['selectedPeriod']>(null);
  const [calculationData, setCalculationData] = useState<CalculationResult | null>(null);
  const [payrollId, setPayrollId] = useState<number | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'rango_libre'>('quincenal');
  const [minWageCheckEnabled, setMinWageCheckEnabled] = useState<number | null>(null);
  const [globalMinWageRate, setGlobalMinWageRate] = useState<number | null>(null);

  // Step 1 state
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedQuincena, setSelectedQuincena] = useState<1 | 2 | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      try {
        const [enabledRes, rateRes] = await Promise.all([
          LegalParamService.getParam('MIN_WAGE_CHECK_ENABLED'),
          LegalParamService.getParam('GLOBAL_MIN_WAGE_RATE'),
        ]);

        if (enabledRes) setMinWageCheckEnabled(Number(enabledRes.value));
        if (rateRes) setGlobalMinWageRate(Number(rateRes.value));
      } catch (error) {
        console.error('Error fetching legal parameters:', error);
      }
    };

    fetchParams();
  }, []);

  const formatDate = (d: Date): string => {
    return d.toISOString().split('T')[0];
  };

  const getMonthBounds = (year: number, month: number): { start: string; end: string } => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start: formatDate(start), end: formatDate(end) };
  };

  const applyQuincenaPreset = useCallback((half: 1 | 2) => {
    setSelectedQuincena(half);
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    if (half === 1) {
      setDateStart(formatDate(new Date(year, month, 1)));
      setDateEnd(formatDate(new Date(year, month, 15)));
    } else {
      setDateStart(formatDate(new Date(year, month, 16)));
      setDateEnd(formatDate(new Date(year, month + 1, 0)));
    }
  }, []);

  const applyMonthPreset = useCallback((ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    const bounds = getMonthBounds(y, m - 1);
    setDateStart(bounds.start);
    setDateEnd(bounds.end);
    setSelectedMonth(ym);
  }, []);

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
    setMinWageCheckEnabled(null);
    setGlobalMinWageRate(null);
    setDateStart('');
    setDateEnd('');
    setSelectedQuincena(null);
    setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
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
    minWageCheckEnabled,
    setMinWageCheckEnabled,
    globalMinWageRate,
    setGlobalMinWageRate,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    selectedMonth,
    setSelectedMonth,
    selectedQuincena,
    setSelectedQuincena,
    applyQuincenaPreset,
    applyMonthPreset,
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

    const q1Start = new Date(year, month, 1);
    const q1End = new Date(year, month, 15);

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