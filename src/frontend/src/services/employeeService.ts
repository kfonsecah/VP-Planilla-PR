import { Employee, EmployeeFormData } from '../types/employee';
import { http } from './http';

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    return await http.get('/employee');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
  }
};

export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  // Normalize fields to what backend/prisma expects
  const normalizedNationalId = (employeeData.employee_national_id || '').replace(/\D/g, '');
  const normalizedSocialCode = (employeeData.employee_social_code || '').replace(/\D/g, '');
  const positionId = employeeData.employee_position_id ? parseInt(employeeData.employee_position_id, 10) : undefined;
  const hireDate = employeeData.employee_hire_date ? new Date(employeeData.employee_hire_date) : undefined;

  const payload: any = {
    name: employeeData.employee_first_name,
    last_name: employeeData.employee_last_name,
    middle_name: employeeData.employee_middle_name,
    national_id: normalizedNationalId || null,
    social_code: normalizedSocialCode || null,
    email: employeeData.employee_email,
    hire_date: hireDate ? hireDate.toISOString() : null,
    position_id: typeof positionId === 'number' && !Number.isNaN(positionId) ? positionId : null,
    status: 'active'
  };

  try {
    return await http.post('/employee/create', payload);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create employee');
  }
};

export const getEmployeeById = async (id: string | number): Promise<Employee> => {
  try {
    return await http.get(`/employee/${id}`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employee');
  }
};

export interface EmployeeUpdateData {
  name?: string;
  last_name?: string;
  middle_name?: string;
  national_id?: string | null;
  social_code?: string | null;
  email?: string;
  hire_date?: string;
  position_id?: number | null;
  status?: string;
  fired?: boolean;
  exit_date?: string;
}

export const updateEmployee = async (id: string | number, employeeData: Partial<EmployeeFormData> & { status?: string }): Promise<Employee> => {
  // Normalize fields to what backend/prisma expects
  const payload: EmployeeUpdateData = {};

  if (employeeData.employee_first_name !== undefined) {
    payload.name = employeeData.employee_first_name;
  }
  
  if (employeeData.employee_last_name !== undefined) {
    payload.last_name = employeeData.employee_last_name;
  }
  
  if (employeeData.employee_middle_name !== undefined) {
    payload.middle_name = employeeData.employee_middle_name;
  }
  
  if (employeeData.employee_national_id !== undefined) {
    const normalizedNationalId = (employeeData.employee_national_id || '').replace(/\D/g, '');
    payload.national_id = normalizedNationalId || null;
  }
  
  if (employeeData.employee_social_code !== undefined) {
    const normalizedSocialCode = (employeeData.employee_social_code || '').replace(/\D/g, '');
    payload.social_code = normalizedSocialCode || null;
  }
  
  if (employeeData.employee_email !== undefined) {
    payload.email = employeeData.employee_email;
  }
  
  if (employeeData.employee_hire_date !== undefined) {
    const hireDate = new Date(employeeData.employee_hire_date);
    payload.hire_date = hireDate.toISOString();
  }
  
  if (employeeData.employee_position_id !== undefined) {
    const positionId = parseInt(employeeData.employee_position_id, 10);
    payload.position_id = !Number.isNaN(positionId) ? positionId : null;
  }
  
  if (employeeData.status !== undefined) {
    payload.status = employeeData.status;
  }

  try {
    return await http.put(`/employee/${id}`, payload);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update employee');
  }
};

export const deleteEmployee = async (id: string | number): Promise<void> => {
  try {
    const payload = {
      fired: true,
      exit_date: new Date().toISOString()
    };

    await http.put(`/employee/${id}`, payload);
    return;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete employee');
  }
};
