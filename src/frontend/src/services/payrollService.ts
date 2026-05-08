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

export interface ParamSnapshot {
  param_key: string;
  param_value: string;
  param_valid_from: string;
  source_decree?: string | null;
}

export interface PayrollWithSnapshot {
  payroll: Payroll;
  snapshot: ParamSnapshot[];
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
   * @param payrollEmployeeId - ID of the specific payroll_employee record (PK)
   * @param override - Override values
   */
  async saveEmployeeOverride(
    payrollId: number,
    payrollEmployeeId: number,
    override: {
      regularHours?: number;
      overtimeHours?: number;
      weeklyRestHours?: number;
      totalDeductions?: number;
    }
  ): Promise<unknown> {
    try {
      return await http.patch(`/payroll/${payrollId}/employee/${payrollEmployeeId}/override`, override);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al guardar ajuste de empleado');
    }
  },

  async resendPayslip(payrollId: number, employeeId: number): Promise<{ success: boolean; message: string }> {
    try {
      return (await http.post(`/payrolls/${payrollId}/resend-payslip/${employeeId}`, {})) as { success: boolean; message: string };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al reenviar comprobante');
    }
  },

  /**
   * Download the payslip PDF for an employee and trigger a browser file download.
   * Uses http.raw to handle the binary PDF response.
   * @param payrollId - ID of the payroll
   * @param employeeId - ID of the employee
   */
  async downloadPayslipPdf(payrollId: number, employeeId: number): Promise<void> {
    const res = await http.raw(`/payrolls/${payrollId}/payslip/${employeeId}/pdf`, { method: 'GET' });
    if (!res.ok) {
      let message = `Error ${res.status} al descargar comprobante`;
      try {
        const data = await res.json() as { error?: string };
        if (data.error) message = data.error;
      } catch { /* ignore parse error */ }
      throw new Error(message);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `comprobante-${payrollId}-${employeeId}.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Get payroll parameter snapshot captured at approval time.
   * Returns empty snapshot for payrolls approved before Phase 64.
   */
  async getPayrollSnapshot(payrollId: number): Promise<PayrollWithSnapshot> {
    try {
      // http.get unwraps response.data — returns { payroll, snapshot } directly
      const response = await http.get(`/payroll/${payrollId}/snapshot`);
      return (response as unknown as PayrollWithSnapshot) || { payroll: {} as Payroll, snapshot: [] };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener parámetros de planilla');
    }
  },
};
