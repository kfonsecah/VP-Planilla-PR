import { API_CONFIG } from '@/config';
import { http } from './http';

export interface PayrollPayload {
  payroll_type_id?: number;
  period_start?: string;
  period_end?: string;
  status?: string;
}

export interface Payroll {
  id: number;
  payroll_type_id: number;
  period_start: string;
  period_end: string;
  status: string;
  created_at?: string;
}

export const PayrollService = {
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
};
