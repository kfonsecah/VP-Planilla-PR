import { http } from './http';

export interface Vacation {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  days: number;
  paid: boolean;
  status?: string;
  created_at?: string;
}

export const VacationsService = {
  async getAll(): Promise<Vacation[]> {
    try {
      return await http.get('/vacations');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error cargando vacaciones');
    }
  },

  async getById(id: number): Promise<Vacation> {
    try {
      return await http.get(`/vacations/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error cargando vacación');
    }
  },

  async create(payload: Partial<Vacation>): Promise<Vacation> {
    try {
      return await http.post('/vacations', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creando vacaciones');
    }
  },

  async update(id: number, payload: Partial<Vacation>): Promise<Vacation> {
    try {
      return await http.put(`/vacations/${id}`, payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error actualizando vacaciones');
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await http.delete(`/vacations/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error eliminando vacaciones');
    }
  }
};
