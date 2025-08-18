export interface Bonus {
  id: number;
  employee_id: number;
  payroll_id: number;
  year: number;
  month: number;
  description: string;
  amount: number;
  granted_at: Date;
  version: number;
}
