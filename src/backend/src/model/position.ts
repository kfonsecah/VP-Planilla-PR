export interface Position { 
  id: number;
  name: string;
  description: string;
  base_salary: number;
  occupation_code?: string;
  risk_class?: string;
  version: number;
}