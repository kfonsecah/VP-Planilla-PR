export interface EmployeeLaborEvent {
  id: number;
  employee_id: number;
  labor_event_id: number;
  start_date: Date;
  end_date: Date | null;
  status: string;
  version: number;
}