export interface ReportTarget {
  id: number;
  institution: string;
  endpoint_url: string;
  auth_token: string;
  contact_email: string;
  version: number;
}

export interface CreateReportTargetDto {
  institution: string;
  endpoint_url: string;
  auth_token: string;
  contact_email: string;
}

export interface UpdateReportTargetDto {
  institution?: string;
  endpoint_url?: string;
  auth_token?: string;
  contact_email?: string;
}