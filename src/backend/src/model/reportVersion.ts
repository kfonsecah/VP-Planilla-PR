export interface ReportVersion {
  id: number;
  report_log_id: number;
  created_at: Date;
  file_path: string;
  remarks?: string;
}

export interface CreateReportVersionDto {
  report_log_id: number;
  created_at: Date;
  file_path: string;
  remarks?: string;
}

export interface UpdateReportVersionDto {
  file_path?: string;
  remarks?: string;
}