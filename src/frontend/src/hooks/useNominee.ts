import { useState } from 'react';
import { toast } from 'sonner';
import { NomineeService } from '@/services/nomineeService';

export const useNominee = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof NomineeService.calculatePayrollForPeriod>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePayrollForPeriod = async (startDate: string, endDate: string, payrollId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NomineeService.calculatePayrollForPeriod(startDate, endDate, payrollId);
      setData(res);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al calcular nómina';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getClockLogs = async (initDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await NomineeService.getClockLogs(initDate, endDate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al obtener registros');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeDeductions = async (employeeId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      return await NomineeService.getEmployeeDeductions(employeeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al obtener deducciones');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, calculatePayrollForPeriod, getClockLogs, getEmployeeDeductions };
};
