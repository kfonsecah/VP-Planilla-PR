/**
 * Employee Deductions Types
 * Tipos para la gestión de deducciones asignadas a empleados
 */

export interface EmployeeDeduction {
  employee_id: number;
  deduction_id: number;
  version: number;
}

export interface EmployeeDeductionWithDetails extends EmployeeDeduction {
  deduction_name: string;
  deduction_description: string;
  fixed_amount: number;
  percentage: number;
}

export interface AssignDeductionRequest {
  employeeId: number;
  deductionId: number;
}

export interface EmployeeDeductionsResponse {
  success: boolean;
  data?: EmployeeDeduction | EmployeeDeduction[] | EmployeeDeductionWithDetails[];
  error?: string;
  message?: string;
}
