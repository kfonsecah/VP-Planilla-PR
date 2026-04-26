import { http } from './http';

export interface PayrollPayload {
  payroll_type_id?: number;
  period_start?: string;
  period_end?: string;
  payment_date?: string;
  status?: string;
}

export interface Payroll {
  id: number;
  payroll_type?: number;
  payroll_type_id?: number;  // Alias for compatibility
  period_start: string;
  period_end: string;
  payment_date?: string;
  status: string;
  created_at?: string;
  version?: number;
}

export interface PayrollEmployee {
  id: number;
  payroll_id: number;
  employee_id: number;
  employee_name: string;
  employee_identification: string;
  position_name?: string;
  total_hours?: number;
  overtime_hours?: number;
  weekly_rest_hours?: number;
  overtime_pay?: number;
  weekly_rest_pay?: number;
  bonuses?: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  version: number;
}

export const PayrollService = {
  async getAllPayrolls(): Promise<Payroll[]> {
    try {
      const response = await http.get('/payrolls');
      // http.get ya desenvuelve { data } y retorna directamente el arreglo
      return (response as unknown as Payroll[]) || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener planillas');
    }
  },

  async createPayroll(payload: PayrollPayload): Promise<Payroll> {
    try {
      return await http.post('/payroll/create', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear la planilla');
    }
  },

  async getPayrollById(id: number): Promise<Payroll> {
    try {
      return await http.get(`/payroll/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener planilla');
    }
  },

  async updatePayroll(id: number, payload: Partial<PayrollPayload>): Promise<Payroll> {
    try {
      return await http.put(`/payroll/${id}`, payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar planilla');
    }
  },

  async getPayrollEmployees(payrollId: number): Promise<PayrollEmployee[]> {
    try {
      const response = await http.get(`/payroll/${payrollId}/employees`);
      // http.get ya retorna el arreglo de empleados
      return (response as unknown as PayrollEmployee[]) || [];
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener empleados de la planilla');
    }
  },

  // State machine transitions (Phase 36)
  async approvePayroll(payrollId: number): Promise<Payroll> {
    try {
      return await http.post(`/payroll/${payrollId}/approve`, {});
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al aprobar la planilla');
    }
  },

  async markAsPaid(payrollId: number): Promise<Payroll> {
    try {
      return await http.post(`/payroll/${payrollId}/pay`, {});
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al marcar como pagada');
    }
  },

  async reopenPayroll(payrollId: number, reason: string): Promise<Payroll> {
    try {
      return await http.post(`/payroll/${payrollId}/reopen`, { reason });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al reopen la planilla');
    }
  },

  /**
   * Save per-employee hour/deduction override for a payroll in BORRADOR state.
   * @param payrollId - ID of the payroll
   * @param employeeId - ID of the employee to override
   * @param override - Override values (all optional)
   * @returns Updated payroll_employee record
   */
  async saveEmployeeOverride(
    payrollId: number,
    employeeId: number,
    override: {
      regularHours?: number;
      overtimeHours?: number;
      weeklyRestHours?: number;
      totalDeductions?: number;
    }
  ): Promise<unknown> {
    try {
      return await http.patch(`/payroll/${payrollId}/employee/${employeeId}/override`, override);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al guardar ajuste de empleado');
    }
  },
};
