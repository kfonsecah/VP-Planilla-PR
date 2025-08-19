export interface LaborEvent {
  id: number;
  name: string;
  description: string;
  version: number;
}

export interface EmployeeLaborEvent {
  id: number;
  employee_id: number;
  labor_event_id: number;
  start_date: Date;
  end_date?: Date | null;
  status: 'active' | 'completed' | 'cancelled';
  version: number;
}

export interface LaborEventFormData {
  name?: string;
  description?: string;
  employee_id?: number;
  start_date: Date;
  end_date?: Date;
  status?: 'active' | 'completed' | 'cancelled';
}