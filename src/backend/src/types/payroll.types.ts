import { MinuteRoundingPolicy } from '@prisma/client';

/**
 * Payroll domain types
 * Central place for all payroll-related interfaces used across services.
 */

export interface PayrollPeriod {
  startDate: string;
  endDate: string;
}

export interface DayWork {
  date: string;
  hoursWorked: number;
  isVacation: boolean;
  messages: string[];
}

export interface DeductionBreakdown {
  deduction_id?: number;  // DB id — required to persist to vpg_employee_deductions
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
  days: DayWork[];

  // Hour breakdown
  scheduledHours: number;   // Mon–Sat days in period × 8  (required hours)
  regularHours: number;
  overtimeHours: number;
  weeklyRestHours: number;  // proportional rest hours (e.g. 14.77 for 96-reg-hr period)
  weeklyRestPay: number;
  overtimePay: number;      // Pay for overtime hours (× 1.5 multiplier)
  shift_type?: string;      // Resolved shift type for display/audit

  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  bonuses: number;

  deductionsBreakdown: DeductionBreakdown[];
  inconsistencies: Inconsistency[];
  generalMessages: string[];

  // Mandatory holiday breakdown (Art. 148 CR Código de Trabajo)
  mandatoryHolidayHours?: number;
  mandatoryHolidayPay?: number;

  // Optional extended fields
  id?: number;
  employee_id?: number;
  name?: string;
  employee_name?: string;
  identification?: string;
  employee_identification?: string;
  national_id?: string;
  position?: string;
  position_name?: string;
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

export interface LegalParamSet {
  regularHoursPerDay: number; // TODO: Phase 66 (Jornadas)
  regularHoursPerWeek: number; // TODO: Phase 66
  otFactor: number;
  holidayMandatoryFactor: number;
  holidayTripleFactor: number;
  ccssObreroSalud: number;
  ccssObrerosPension: number;
  ccssObreroBP: number;
  minuteRoundingPolicy: MinuteRoundingPolicy;
  globalMinWageRate?: number;
  payUnworkedHolidays?: boolean;
}
