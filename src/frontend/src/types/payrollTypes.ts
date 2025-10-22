/**
 * Types for Payroll Types module
 */

export interface PayrollType {
  id: number;
  name: string;
  description: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollTypePayload {
  name: string;
  description: string;
}

export interface PayrollTypeFormData {
  payroll_type_name: string;
  payroll_type_description: string;
}
