export interface LaborEvent {
  id: number;
  name: string;
  description: string;
  version: number;
}

export interface CreateLaborEventDto {
  name: string;
  description: string;
}

export interface UpdateLaborEventDto {
  name?: string;
  description?: string;
}