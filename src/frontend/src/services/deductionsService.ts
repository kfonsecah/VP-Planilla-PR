import { http } from './http';

export interface Deduction {
  id: number;
  name: string;
  description?: string | null;
  fixed_amount?: number | null;
  percentage?: number | null;
}

export const DeductionsService = {
  async createDeduction(payload: Partial<Deduction>): Promise<Deduction> {
    try {
      return await http.post('/deduction/create', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear deducción');
    }
  },

  async getAllDeductions(): Promise<Deduction[]> {
    try {
      return await http.get('/deductions');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar deducciones');
    }
  },

  async updateDeduction(id: number, payload: Partial<Deduction>): Promise<Deduction> {
    try {
      return await http.put(`/deductions/${id}`, payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar deducción');
    }
  },

  async deleteDeduction(id: number): Promise<void> {
    try {
      await http.delete(`/deductions/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar deducción');
    }
  },
};
