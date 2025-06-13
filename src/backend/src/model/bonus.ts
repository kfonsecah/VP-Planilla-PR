export interface Bonus {
  id: number;
  employee_id: number;
  description: string;
  amount: number;
  granted_at: Date;
}

export interface CreateBonusDto {
  employee_id: number;
  description: string;
  amount: number;
  granted_at: Date;
}

export interface UpdateBonusDto {
  description?: string;
  amount?: number;
  granted_at?: Date;
}