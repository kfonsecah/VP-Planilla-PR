export interface ReportVersion {
  id: number;
  report_log_id: number;
  created_at: Date;
  file_path: string;
  remarks?: string;
}