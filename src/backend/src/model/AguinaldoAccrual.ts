export interface AguinaldoAccrual {
  accrued: number;
  projectedAnnual: number;
  totalOrdinarySalary: number;
  periodsPerYear: number;
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

export interface AguinaldoProjectionEmployee {
  employeeId: number;
  employeeName: string;
  hireDate: string;
  periodsIncluded: number;
  totalOrdinarySalary: number;
  aguinaldoAccumulated: number;
  projectedFullYear: number;
  isComplete: boolean;
}

export interface AguinaldoProjectionResponse {
  fiscalPeriodStart: string;
  fiscalPeriodEnd: string;
  paymentDeadline: string;
  periodsPerYear: number;
  employees: AguinaldoProjectionEmployee[];
  summary: {
    totalEmployees: number;
    totalAguinaldoAccumulated: number;
    totalProjectedFullYear: number;
  };
}
