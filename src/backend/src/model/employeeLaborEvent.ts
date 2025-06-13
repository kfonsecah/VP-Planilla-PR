export interface EmployeeLaborEvent {
  id: number;
  employee_id: number;
  labor_event_id: number;
  start_date: Date;
  end_date?: Date;
  status: string;
  version: number;
}

export interface CreateEmployeeLaborEventDto {
  employee_id: number;
  labor_event_id: number;
  start_date: Date;
  end_date?: Date;
  status: string;
}

export interface UpdateEmployeeLaborEventDto {
  start_date?: Date;
  end_date?: Date;
  status?: string;
}