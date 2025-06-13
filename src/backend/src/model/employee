export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  email: string;
  position_id: number;
  hire_date: Date;
  status: 'A' | 'I' | 'T'; // Active, Inactive, Terminated
  version: number;
}

export interface CreateEmployeeDto {
  first_name: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  email: string;
  position_id: number;
  hire_date: Date;
  status: 'A' | 'I' | 'T';
}

export interface UpdateEmployeeDto {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  national_id?: string;
  email?: string;
  position_id?: number;
  hire_date?: Date;
  status?: 'A' | 'I' | 'T';
}