import { PayrollEmployee } from '@/types/payrollEmployee';
import { http } from './http';

/**
 * Service for managing payroll employees
 */
export const PayrollEmployeesService = {
  /**
   * Get all employees for a specific payroll
   */
  async getPayrollEmployees(payrollId: number): Promise<PayrollEmployee[]> {
    const data = await http.get(`payroll/${payrollId}/employees`);
    return data || [];
  },
};
