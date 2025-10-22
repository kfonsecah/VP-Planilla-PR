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
  start_date: Date | string;
  end_date?: Date | string | null;
  status: 'active' | 'completed' | 'cancelled';
  version: number;
  // Enriched fields coming from frontend when joining with labor event
  labor_event_name?: string;
  labor_event_description?: string;
}

export interface LaborEventFormData {
  name?: string;
  description?: string;
  employee_id?: number;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  status?: 'active' | 'completed' | 'cancelled';
}