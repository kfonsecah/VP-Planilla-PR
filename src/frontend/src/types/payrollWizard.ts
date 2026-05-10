export interface DeductionBreakdown {
  type: string;
  amount: number;
}

export interface CalculationEmployee {
  id: number;
  name: string;
  position_name?: string;
  grossSalary: number;
  netSalary: number;
  regularHours: number;
  overtimeHours: number;
  totalDeductions: number;
  deductions: DeductionBreakdown[];
  inconsistencies?: string[];
}

export interface CalculationResult {
  period: {
    label: string;
    start: string;
    end: string;
  };
  employees: CalculationEmployee[];
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  createdAt: string;
}
