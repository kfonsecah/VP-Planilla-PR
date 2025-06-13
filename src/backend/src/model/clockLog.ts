export interface ClockLog {
  id: number;
  employee_id: number;
  timestamp: Date;
  log_type: string;
  remarks?: string;
  version: number;
}

export interface CreateClockLogDto {
  employee_id: number;
  timestamp: Date;
  log_type: string;
  remarks?: string;
}

export interface UpdateClockLogDto {
  timestamp?: Date;
  log_type?: string;
  remarks?: string;
}