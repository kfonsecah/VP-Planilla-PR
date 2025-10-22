import { PayrollEmployee, PayrollEmployeesResponse } from '@/types/payrollEmployee';
import { API_CONFIG } from '@/config';

const BASE_URL = `${API_CONFIG.baseUrl}/api`;

/**
 * Service for managing payroll employees
 */
export const PayrollEmployeesService = {
  /**
   * Get all employees for a specific payroll
   */
  async getPayrollEmployees(payrollId: number): Promise<PayrollEmployee[]> {
    try {
      const response = await fetch(`${BASE_URL}/payroll/${payrollId}/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener empleados de la planilla');
      }

      const data: PayrollEmployeesResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching payroll employees:', error);
      throw error;
    }
  },
};
