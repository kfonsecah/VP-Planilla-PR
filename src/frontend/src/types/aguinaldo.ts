export interface AguinaldoAccrual {
  accrued: number;
  projectedAnnual: number;
  totalOrdinarySalary: number;
  periodsPerYear: number;
  periodStart: string;
  periodEnd: string;
  monthsCompleted: number;
  payrollsIncluded: number;
}

export interface AguinaldoSummaryRow {
  employeeId: number;
  employeeName: string;
  accruedBeforeThisPayroll: number;
  thisPayrollContribution: number;
  totalAccruedWithThis: number;
  periodStart: string;
  periodEnd: string;
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
