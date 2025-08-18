export interface Payroll { 
  id: number; 
  payroll_type: number;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  status: string;
  version: number;
}