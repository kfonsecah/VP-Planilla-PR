import { useState } from 'react';
import { NomineeService } from '@/services/nomineeService';

export const useNominee = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePayrollForPeriod = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NomineeService.calculatePayrollForPeriod(startDate, endDate);
      setData(res);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Error al calcular nómina');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getClockLogs = async (initDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NomineeService.getClockLogs(initDate, endDate);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Error al obtener registros');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeDeductions = async (employeeId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NomineeService.getEmployeeDeductions(employeeId);
      return res;
    } catch (err: any) {
      setError(err?.message || 'Error al obtener deducciones');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, calculatePayrollForPeriod, getClockLogs, getEmployeeDeductions };
};
