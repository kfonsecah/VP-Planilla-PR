import { http } from './http';

export interface Position {
  id: number;
  name: string;
  description?: string | null;
  base_salary?: number | null;
  occupation_code?: string | null;
  risk_class?: string | null;
  version?: number;
}

export const PositionsService = {
  async createPosition(payload: Partial<Position>): Promise<Position> {
    try {
      return await http.post('/positions', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear posición');
    }
  },

  async getAllPositions(): Promise<Position[]> {
    try {
      return await http.get('/positions');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar posiciones');
    }
  },

  async getPositionById(id: number): Promise<Position> {
    try {
      return await http.get(`/positions/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener posición');
    }
  },

  async updatePosition(id: number, payload: Partial<Position>): Promise<Position> {
    // Use raw request to inspect status codes (e.g., 409 conflict)
    try {
      const res = await http.raw(`/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // parse message
        let msg = 'Conflict';
        try {
          const data = await res.json();
          msg = data?.message || JSON.stringify(data);
        } catch {
          msg = await res.text().catch(() => 'Conflict');
        }
        const err = new Error(msg) as Error & { status: number };
        err.status = 409;
        throw err;
      }

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          msg = data?.message || JSON.stringify(data);
        } catch {
          msg = await res.text().catch(() => msg);
        }
        throw new Error(msg);
      }

      const text = await res.text();
      if (!text) throw new Error('Empty response from server');
      return JSON.parse(text) as Position;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Error al actualizar posición');
    }
  },

  async deletePosition(id: number): Promise<void> {
    try {
      await http.delete(`/positions/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar posición');
    }
  },
};
