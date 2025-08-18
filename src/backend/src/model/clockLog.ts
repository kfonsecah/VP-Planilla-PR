export interface ClockLogs {
  id: number;
  employee_id: number;
  timestamp: Date;
  log_type: string;
  remarks?: string;
  version: number;
}