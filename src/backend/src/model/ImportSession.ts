export interface ImportSession {
  id: number;
  started_at: Date;
  completed_at?: Date;
  source: 'java_import' | 'excel_import' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_records: number;
  created_count: number;
  skipped_count: number;
  anomaly_count: number;
  created_by: number;
}
