export interface PayrollEmployee {
  payroll_id: number;
  employee_id: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  version: number;
}

export interface CreatePayrollEmployeeDto {
  payroll_id: number;
  employee_id: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
}

export interface UpdatePayrollEmployeeDto {
  gross_salary?: number;
  total_deductions?: number;
  net_salary?: number;
}