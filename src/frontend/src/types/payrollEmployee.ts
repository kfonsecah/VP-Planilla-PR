/**
 * Payroll Employee Types
 * Tipos para empleados en planilla con sus cálculos
 */

export interface PayrollEmployee {
  id: number;
  payroll_id: number;
  employee_id: number;
  employee_name: string;
  employee_identification: string;
  position_name: string;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  version: number;
}

export interface PayrollEmployeesResponse {
  success: boolean;
  data?: PayrollEmployee[];
  error?: string;
  message?: string;
}
