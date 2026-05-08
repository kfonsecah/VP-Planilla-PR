import { useState, useCallback, useEffect } from 'react';
import { PayrollService, Payroll } from '@/services/payrollService';

export interface PagadaPayroll {
  id: number;
  label: string;
  period_start: string;
  period_end: string;
  payment_date?: string;
}

const formatPeriod = (p: Payroll): string => {
  const start = new Date(p.period_start).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' });
  const end = new Date(p.period_end).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} – ${end}`;
};

export const usePayrollSelector = () => {
  const [payrolls, setPayrolls] = useState<PagadaPayroll[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await PayrollService.getAllPayrolls();
      const pagadas: PagadaPayroll[] = all
        .filter((p) => p.status === 'PAGADA')
        .map((p) => ({
          id: p.id,
          label: formatPeriod(p),
          period_start: p.period_start,
          period_end: p.period_end,
          payment_date: p.payment_date,
        }));
      setPayrolls(pagadas);
      if (pagadas.length > 0) {
        setSelectedId(pagadas[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planillas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = payrolls.find((p) => p.id === selectedId) ?? null;

  return { payrolls, selectedId, setSelectedId, selected, isLoading, error, reload: load };
};
