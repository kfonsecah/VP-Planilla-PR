export interface Employee {
  id: number;
  name: string;
  last_name: string;
  middle_name: string; 
  national_id: string;
  social_code: string;
  email: string;
  position_id: number;
  hire_date: Date;
  exit_date?: Date;
  fired: boolean;
  status: string; // e.g., 'active', 'inactive'
  version: number;
}