// Relations interfaces for many-to-many tables
export interface EnterpriseBranch {
  enterprise_id: number;
  branch_id: number;
}

export interface BranchEmployee {
  branch_id: number;
  employee_id: number;
}

export interface EmployeeDeduction {
  employee_id: number;
  deduction_id: number;
}