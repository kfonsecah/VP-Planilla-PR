export interface ReportLogs {
  id: number;
  report_type: string;
  generated_by: number;
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  file_path: string;
  status: string;
  version: number;
}