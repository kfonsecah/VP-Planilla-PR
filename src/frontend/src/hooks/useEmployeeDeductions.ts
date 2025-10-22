import { useState, useCallback } from 'react';
import { EmployeeDeductionsService } from '@/services/employeeDeductionsService';
import { EmployeeDeduction, AssignDeductionRequest } from '@/types/employeeDeductions';

/**
 * Hook for managing employee deductions
 */
export const useEmployeeDeductions = (employeeId?: number) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch deductions for a specific employee
   */
  const fetchEmployeeDeductions = useCallback(async (empId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const deductions = await EmployeeDeductionsService.getEmployeeDeductions(empId);
      setData(deductions);
      return deductions;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al cargar deducciones';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Assign a deduction to an employee
   */
  const assignDeduction = useCallback(async (request: AssignDeductionRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await EmployeeDeductionsService.assignDeductionToEmployee(request);
      
      // Refresh the list if we're tracking a specific employee
      if (employeeId === request.employeeId) {
        await fetchEmployeeDeductions(request.employeeId);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al asignar deducción';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, fetchEmployeeDeductions]);

  /**
   * Remove a deduction from an employee
   */
  const removeDeduction = useCallback(async (empId: number, deductionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await EmployeeDeductionsService.removeDeductionFromEmployee(empId, deductionId);
      
      // Refresh the list if we're tracking this employee
      if (employeeId === empId) {
        await fetchEmployeeDeductions(empId);
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al eliminar deducción';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, fetchEmployeeDeductions]);

  /**
   * Refetch current employee's deductions
   */
  const refetch = useCallback(async () => {
    if (employeeId) {
      return fetchEmployeeDeductions(employeeId);
    }
  }, [employeeId, fetchEmployeeDeductions]);

  return {
    data,
    isLoading,
    error,
    fetchEmployeeDeductions,
    assignDeduction,
    removeDeduction,
    refetch,
  };
};
