export interface PayrollEmployee {
  id: number;
  payroll_id: number;
  employee_id: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  version: number;
}