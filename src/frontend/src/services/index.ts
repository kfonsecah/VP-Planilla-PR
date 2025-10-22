/**
 * Central export point for all services
 */

// Auth
export * from './authService';

// Employees
export * from './employeeService';

// Positions
export { PositionsService } from './positionsService';
export type { Position } from './positionsService';

// Bonuses
export { BonusesService } from './bonusesService';
export type { Bonus } from './bonusesService';

// Deductions
export { DeductionsService } from './deductionsService';
export type { Deduction } from './deductionsService';

// Vacations
export { VacationsService } from './vacationsService';
export type { Vacation } from './vacationsService';

// Labor Events
export { LaborEventsService } from './laborEventsService';
export type { LaborEventsResponse } from './laborEventsService';

// Payroll
export { PayrollService } from './payrollService';
export type { Payroll, PayrollPayload } from './payrollService';

// Payroll Types
export { PayrollTypesService } from './payrollTypesService';
export type { PayrollType, PayrollTypePayload } from './payrollTypesService';

// Nominee
export { NomineeService } from './nomineeService';
export type { ClockLog, EmployeeDeduction } from './nomineeService';

// HTTP
export { http, setStoredTokens, clearStoredTokens, setOnAuthFailure, API_BASE } from './http';
