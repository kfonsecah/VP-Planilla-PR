export interface AguinaldoAccrual {
  accrued: number;
  projectedAnnual: number;
  periodStart: Date;
  periodEnd: Date;
  monthsCompleted: number;
  payrollsIncluded: number;
}

export interface AguinaldoConfig {
  periodStartMonth: number;    // 1-12, default 12 (December)
  periodStartDay: number;      // 1-31, default 1
  paymentDeadlineDay: number;  // 1-31: show prior period until this day of payment month
}

export interface AguinaldoSummaryRow {
  employeeId: number;
  employeeName: string;
  accruedBeforeThisPayroll: number;
  thisPayrollContribution: number;
  totalAccruedWithThis: number;
  periodStart: Date;
  periodEnd: Date;
}
