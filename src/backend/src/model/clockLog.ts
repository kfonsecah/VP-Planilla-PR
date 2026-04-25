export interface ClockLogs {
  id: number;
  employee_id: number;
  timestamp: Date;
  log_type: 'IN' | 'OUT';
  remarks?: string;
  version: number;
  status: 'pending' | 'valid' | 'anomaly' | 'corrected' | 'orphan';
  source: 'java_import' | 'excel_import' | 'manual' | 'device';
  import_session_id?: number;
}