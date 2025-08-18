export interface ReportTarget {
  id: number;
  institution: string;
  endpoint_url: string;
  auth_token: string;
  contact_email: string;
  version: number;
}