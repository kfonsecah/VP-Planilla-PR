export interface Deduction {
  id: number;
  name: string;
  description: string;
  percentage?: number;
  fixed_amount?: number;
  version: number;
}