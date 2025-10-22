import { http } from './http';

export interface Bonus {
  id: number;
  employee_id: number;
  payroll_id?: number;
  year: number;
  month: number;
  description: string;
  amount: number;
  granted_at?: string | null;
}

export const BonusesService = {
  async getBonus(id: number): Promise<Bonus> {
    try {
      return await http.get(`/bonuses/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener bonificación');
    }
  },

  async getAllBonuses(): Promise<Bonus[]> {
    try {
      return await http.get('/bonuses');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar bonificaciones');
    }
  },

  async createBonus(payload: Partial<Bonus>): Promise<Bonus> {
    try {
      return await http.post('/bonuses', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear bonificación');
    }
  },

  async updateBonus(id: number, payload: Partial<Bonus>): Promise<Bonus> {
    try {
      return await http.put(`/bonuses/${id}`, payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar bonificación');
    }
  },

  async deleteBonus(id: number): Promise<void> {
    try {
      await http.delete(`/bonuses/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar bonificación');
    }
  },
};
