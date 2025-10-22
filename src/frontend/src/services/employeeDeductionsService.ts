import { 
  EmployeeDeduction, 
  AssignDeductionRequest,
  EmployeeDeductionsResponse 
} from '@/types/employeeDeductions';
import { API_CONFIG } from '@/config';

const BASE_URL = `${API_CONFIG.baseUrl}/api`;

/**
 * Service for managing employee deductions
 */
export const EmployeeDeductionsService = {
  /**
   * Get all deductions assigned to a specific employee
   */
  async getEmployeeDeductions(employeeId: number): Promise<any[]> {
    try {
      const response = await fetch(`${BASE_URL}/nominee/employee-deductions/${employeeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener deducciones del empleado');
      }

      const data = await response.json();
      
      // Handle both direct array response and wrapped response
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data : [data.data];
      }
      
      // If no data, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching employee deductions:', error);
      throw error;
    }
  },

  /**
   * Assign a deduction to an employee
   */
  async assignDeductionToEmployee(
    request: AssignDeductionRequest
  ): Promise<EmployeeDeduction> {
    const response = await fetch(`${BASE_URL}/employee-deductions/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al asignar deducción');
    }

    const data: EmployeeDeductionsResponse = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Error al asignar deducción');
    }

    return data.data as EmployeeDeduction;
  },

  /**
   * Remove a deduction from an employee
   */
  async removeDeductionFromEmployee(
    employeeId: number,
    deductionId: number
  ): Promise<boolean> {
    const response = await fetch(
      `${BASE_URL}/employee-deductions/${employeeId}/${deductionId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar deducción');
    }

    return true;
  },
};
