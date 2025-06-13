export interface Position {
  id: number;
  name: string;
  description: string;
  base_salary: number;
  version: number;
}

export interface CreatePositionDto {
  name: string;
  description: string;
  base_salary: number;
}

export interface UpdatePositionDto {
  name?: string;
  description?: string;
  base_salary?: number;
}