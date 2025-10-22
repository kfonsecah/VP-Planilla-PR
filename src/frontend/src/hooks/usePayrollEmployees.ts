import { useState, useCallback } from 'react';
import { PayrollEmployeesService } from '@/services/payrollEmployeesService';
import { PayrollEmployee } from '@/types/payrollEmployee';

/**
 * Hook for managing payroll employees
 */
export const usePayrollEmployees = (payrollId?: number) => {
  const [data, setData] = useState<PayrollEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch employees for a specific payroll
   */
  const fetchPayrollEmployees = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const employees = await PayrollEmployeesService.getPayrollEmployees(id);
      setData(employees);
      return employees;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al cargar empleados de la planilla';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch current payroll's employees
   */
  const refetch = useCallback(async () => {
    if (payrollId) {
      return fetchPayrollEmployees(payrollId);
    }
  }, [payrollId, fetchPayrollEmployees]);

  return {
    data,
    isLoading,
    error,
    fetchPayrollEmployees,
    refetch,
  };
};
