export interface Payroll {
  id: number;
  payroll_type_id: number;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  status: string;
  version: number;
}

export interface CreatePayrollDto {
  payroll_type_id: number;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  status: string;
}

export interface UpdatePayrollDto {
  payroll_type_id?: number;
  period_start?: Date;
  period_end?: Date;
  payment_date?: Date;
  status?: string;
}