/**
 * Tipos relacionados con empleados
 */

export interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  status: EmployeeStatus;
}

export type EmployeeStatus = 
  | 'active'
  | 'vacation'
  | 'incomplete_assistance'
  | 'incapacity_maternity';

export interface EmployeeFormData {
  employee_first_name: string;
  employee_middle_name: string;
  employee_last_name: string;
  employee_national_id: string;
  employee_social_code: string;
  employee_email: string;
  employee_phone: string;
  employee_position_id: string;
  employee_hire_date: string;
  employee_gender: string;
  employee_schedule: string;
}

export interface EmployeeStats {
  total: number;
  onVacation: number;
  incompleteAssistance: number;
  incapacityMaternity: number;
}

export interface EmployeeProfileData {
  id: string;
  name: string;
  position: string;
  phone: string;
  status: string;
  incidences: {
    faltaTiempo: number;
    llegadaTardia: number;
    sobraTiempo: number;
    sinMarcas: number;
  };
  attendanceRecords: AttendanceRecord[];
}

export interface AttendanceRecord {
  date: string;
  schedule: string;
  entryTime: string;
  exitTime: string;
  total: string;
  balance: string;
  isWeekend?: boolean;
}

export interface StatusBadgeConfig {
  text: string;
  className: string;
}
