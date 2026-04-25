import { PayrollStatus } from '@prisma/client';

export interface Payroll {
  id: number;
  payroll_type: number;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  status: PayrollStatus;
  version: number;
  // Approval tracking
  approved_by?: number | null;
  approved_at?: Date | null;
  // Reopen tracking
  reopened_at?: Date | null;
  reopen_reason?: string | null;
}