export interface EmployeeDocument {
  id: number;
  employee_id: number;
  file_path: string;
  document_type: string;
  uploaded_at: Date;
  version: number;
}
