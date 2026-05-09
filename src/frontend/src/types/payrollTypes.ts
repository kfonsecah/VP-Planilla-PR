/**
 * Types for Payroll Types module
 */

export interface PayrollPeriod {
  startDate: string;
  endDate: string;
}

export interface DeductionBreakdown {
  deduction_id?: number;
  code: string;
  type: 'fixed' | 'percent';
  amount: number;
  message: string;
}

export interface Inconsistency {
  date: string;
  message: string;
}

export interface EmployeePayroll {
  employeeId: string;
  employeeName: string;
  positionId: string;
  baseHourlySalary: number;
  scheduledHours: number;
  regularHours: number;
  overtimeHours: number;
  weeklyRestHours: number;
  weeklyRestPay: number;
  overtimePay: number;
  shift_type?: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  bonuses: number;
  deductionsBreakdown: DeductionBreakdown[];
  inconsistencies: Inconsistency[];
  generalMessages: string[];
  id?: number;
  employee_id?: number;
  name?: string;
  employee_name?: string;
  identification?: string;
  employee_identification?: string;
  national_id?: string;
  position?: string;
  position_name?: string;
  // snake_case aliases (API may return either format)
  regular_hours?: number;
  overtime_hours?: number;
  weekly_rest_hours?: number;
  weekly_rest_pay?: number;
  overtime_pay?: number;
  gross_salary?: number;
  net_salary?: number;
  total_deductions?: number;
  is_manually_adjusted?: boolean;
}

export interface PayrollSummary {
  employeesProcessed: number;
  employeesWithInconsistencies: number;
  messages: string[];
}

export interface PayrollCalculationResult {
  period: PayrollPeriod;
  employees: EmployeePayroll[];
  summary: PayrollSummary;
}

export interface PayrollType {
  id: number;
  name: string;
  description: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollTypePayload {
  name: string;
  description: string;
}

export interface PayrollTypeFormData {
  payroll_type_name: string;
  payroll_type_description: string;
}
