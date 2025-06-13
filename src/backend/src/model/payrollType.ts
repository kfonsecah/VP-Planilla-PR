export interface PayrollType {
  id: number;
  name: string;
  description: string;
  version: number;
}

export interface CreatePayrollTypeDto {
  name: string;
  description: string;
}

export interface UpdatePayrollTypeDto {
  name?: string;
  description?: string;
}