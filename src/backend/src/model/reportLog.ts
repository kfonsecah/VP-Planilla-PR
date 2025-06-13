export interface ReportLog {
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

export interface CreateReportLogDto {
  report_type: string;
  generated_by: number;
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  file_path: string;
  status: string;
}

export interface UpdateReportLogDto {
  report_type?: string;
  period_start?: Date;
  period_end?: Date;
  file_path?: string;
  status?: string;
}