export interface EmployeeDocument {
  id: number;
  employee_id: number;
  file_path: string;
  document_type: string;
  uploaded_at: Date;
}

export interface CreateEmployeeDocumentDto {
  employee_id: number;
  file_path: string;
  document_type: string;
  uploaded_at: Date;
}

export interface UpdateEmployeeDocumentDto {
  file_path?: string;
  document_type?: string;
}