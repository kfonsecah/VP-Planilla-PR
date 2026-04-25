import { Employee, EmployeeFormData } from '../types/employee';
import { http } from './http';

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    return await http.get('/employee');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  // Normalize fields to match backend schema (uses employee_ prefix)
  const normalizedNationalId = (employeeData.employee_national_id || '').replace(/\D/g, '');
  const normalizedSocialCode = (employeeData.employee_social_code || '').replace(/\D/g, '');
  const positionId = employeeData.employee_position_id ? parseInt(employeeData.employee_position_id, 10) : undefined;
  const hireDate = employeeData.employee_hire_date ? new Date(employeeData.employee_hire_date) : undefined;

  const requiredHours = employeeData.employee_required_hours_biweekly 
    ? parseFloat(employeeData.employee_required_hours_biweekly) 
    : null;

  // Backend schema expects employee_ prefix
  const payload = {
    employee_first_name: employeeData.employee_first_name,
    employee_last_name: employeeData.employee_last_name,
    employee_middle_name: employeeData.employee_middle_name || '',
    employee_national_id: normalizedNationalId || null,
    employee_social_code: normalizedSocialCode || null,
    employee_email: employeeData.employee_email,
    employee_position_id: typeof positionId === 'number' && !Number.isNaN(positionId) ? positionId : null,
    employee_hire_date: hireDate ? hireDate.toISOString() : null,
    employee_phone: employeeData.employee_phone || null,
    employee_gender: employeeData.employee_gender || null,
    employee_required_hours_biweekly: requiredHours && !Number.isNaN(requiredHours) ? requiredHours : null,
    employee_status: 'A'
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
  phone?: string | null;
  hire_date?: string;
  position_id?: number | null;
  gender?: string | null;
  required_hours_biweekly?: number | null;
  status?: string;
  fired?: boolean;
  exit_date?: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const updateEmployee = async (id: string | number, employeeData: Partial<EmployeeFormData> & { status?: string }): Promise<Employee> => {
  // Backend schema expects employee_ prefix, and only sends fields with actual values
  const payload: Record<string, unknown> = {};

  if (employeeData.employee_first_name) {
    payload.employee_first_name = employeeData.employee_first_name;
  }
  
  if (employeeData.employee_last_name) {
    payload.employee_last_name = employeeData.employee_last_name;
  }
  
  if (employeeData.employee_middle_name !== undefined) {
    payload.employee_middle_name = employeeData.employee_middle_name || '';
  }
  
  if (employeeData.employee_national_id) {
    const normalizedNationalId = (employeeData.employee_national_id || '').replace(/\D/g, '');
    payload.employee_national_id = normalizedNationalId;
  }
  
  if (employeeData.employee_social_code) {
    const normalizedSocialCode = (employeeData.employee_social_code || '').replace(/\D/g, '');
    payload.employee_social_code = normalizedSocialCode;
  }
  
  if (employeeData.employee_email) {
    payload.employee_email = employeeData.employee_email;
  }
  
  if (employeeData.employee_hire_date) {
    const hireDate = new Date(employeeData.employee_hire_date);
    if (!isNaN(hireDate.getTime())) {
      payload.employee_hire_date = hireDate.toISOString();
    }
  }
  
  if (employeeData.employee_position_id) {
    const positionId = parseInt(employeeData.employee_position_id, 10);
    if (!Number.isNaN(positionId)) {
      payload.employee_position_id = positionId;
    }
  }

  if (employeeData.employee_required_hours_biweekly) {
    const requiredHours = parseFloat(employeeData.employee_required_hours_biweekly);
    if (!Number.isNaN(requiredHours)) {
      payload.employee_required_hours_biweekly = requiredHours;
    }
  }

  // Handle both prefixed (modal: employee_phone) and non-prefixed (edit page: phone)
  const phoneVal = 'employee_phone' in employeeData
    ? (employeeData as Record<string, unknown>).employee_phone
    : (employeeData as Record<string, unknown>).phone;
  if (phoneVal !== undefined) {
    payload.employee_phone = (phoneVal as string) || null;
  }

  const genderVal = 'employee_gender' in employeeData
    ? (employeeData as Record<string, unknown>).employee_gender
    : (employeeData as Record<string, unknown>).gender;
  if (genderVal !== undefined) {
    payload.employee_gender = (genderVal as string) || null;
  }

  if (employeeData.status) {
    payload.employee_status = employeeData.status;
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

/**
 * Marca un empleado como despedido (soft-dismiss):
 * fired = true, exit_date = fecha indicada (default hoy)
 */
export const fireEmployee = async (
  id: string | number,
  exitDate?: string
): Promise<void> => {
  try {
    const payload = {
      fired: true,
      exit_date: exitDate ? new Date(exitDate).toISOString() : new Date().toISOString(),
    };
    await http.put(`/employee/${id}`, payload);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to dismiss employee');
  }
};
