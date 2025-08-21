import { API_CONFIG } from '@/config';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';

export interface LaborEventsResponse {
  laborEvents: LaborEvent[];
  employeeEvents: EmployeeLaborEvent[];
}

export class LaborEventsService {
  static async getAllLaborEvents(): Promise<LaborEventsResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events`);
    if (!response.ok) {
      throw new Error('Error al cargar eventos');
    }
    return response.json();
  }

  static async createLaborEvent(data: { name: string; description: string }): Promise<LaborEvent> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear tipo de evento');
    }
    
    return response.json();
  }

  static async updateLaborEvent(id: number, data: { name?: string; description?: string }): Promise<LaborEvent> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar el tipo de evento');
    }
    
    return response.json();
  }

  static async assignLaborEventToEmployee(data: {
    employee_id: number;
    labor_event_id: number;
    start_date: string;
    end_date: string | null;
    status: string;
  }): Promise<EmployeeLaborEvent> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al asignar evento');
    }
    
    return response.json();
  }

  static async updateEmployeeLaborEvent(id: number, data: {
    start_date?: string;
    end_date?: string;
    status?: string;
    employee_id?: number;
  }): Promise<EmployeeLaborEvent> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar evento');
    }
    
    return response.json();
  }

  static async deleteEmployeeLaborEvent(id: number): Promise<void> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/assign/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar asignación');
    }
  }

  static async deleteLaborEvent(id: number): Promise<void> {
    const response = await fetch(`${API_CONFIG.baseUrl}/labor-events/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar evento');
    }
  }
}