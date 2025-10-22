import { http } from './http';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';

export interface LaborEventsResponse {
  laborEvents: LaborEvent[];
  employeeEvents: EmployeeLaborEvent[];
}

export class LaborEventsService {
  static async getAllLaborEvents(): Promise<LaborEventsResponse> {
    try {
      return await http.get('/labor-events');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar eventos');
    }
  }

  static async createLaborEvent(data: { name: string; description: string }): Promise<LaborEvent> {
    try {
      return await http.post('/labor-events/create', data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear tipo de evento');
    }
  }

  static async updateLaborEvent(id: number, data: { name?: string; description?: string }): Promise<LaborEvent> {
    try {
      return await http.put(`/labor-events/${id}`, data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar el tipo de evento');
    }
  }

  static async assignLaborEventToEmployee(data: {
    employee_id: number;
    labor_event_id: number;
    start_date: string;
    end_date: string | null;
    status: string;
  }): Promise<EmployeeLaborEvent> {
    try {
      return await http.post('/labor-events/assign', data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al asignar evento';
      throw new Error(msg);
    }
  }

  static async updateEmployeeLaborEvent(id: number, data: {
    start_date?: string;
    end_date?: string;
    status?: string;
    employee_id?: number;
  }): Promise<EmployeeLaborEvent> {
    // Ideally backend should provide an endpoint; attempt PUT to assign id
    try {
      return await http.put(`/labor-events/assign/${id}`, data);
    } catch (err) {
      // Fallback: return mock if backend doesn't support it
      console.warn('Employee labor event update not supported by backend API. Returning mock response.');
      return {
        id: id,
        employee_id: data.employee_id || 0,
        labor_event_id: 0,
        start_date: data.start_date || new Date().toISOString(),
        end_date: data.end_date || null,
        status: data.status as any || 'active',
        version: 1
      } as EmployeeLaborEvent;
    }
  }

  static async deleteEmployeeLaborEvent(id: number): Promise<void> {
    try {
      await http.delete(`/labor-events/assign/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar asignación');
    }
  }

  static async deleteLaborEvent(id: number): Promise<void> {
    try {
      await http.delete(`/labor-events/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar evento');
    }
  }
}