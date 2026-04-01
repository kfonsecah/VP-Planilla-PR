import { http } from './http';

/**
 * Interface for Payroll Type
 */
export interface PayrollType {
  id: number;
  name: string;
  description: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload for creating/updating Payroll Type
 */
export interface PayrollTypePayload {
  name: string;
  description: string;
  frequency: string;
}

/**
 * Service for managing Payroll Types
 * Corresponds to backend endpoints:
 * - POST /api/payroll-type/create
 * - GET /api/payroll-type/:id
 * - GET /api/payroll-types
 * - PUT /api/payroll-type/:id
 */
export const PayrollTypesService = {
  /**
   * Create a new payroll type
   * POST /api/payroll-type/create
   */
  async createPayrollType(payload: PayrollTypePayload): Promise<PayrollType> {
    try {
      return await http.post('/payroll-type/create', payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear tipo de planilla');
    }
  },

  /**
   * Get a specific payroll type by ID
   * GET /api/payroll-type/:id
   */
  async getPayrollType(id: number): Promise<PayrollType> {
    try {
      return await http.get(`/payroll-type/${id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al obtener tipo de planilla');
    }
  },

  /**
   * Get all payroll types
   * GET /api/payroll-types
   */
  async getAllPayrollTypes(): Promise<PayrollType[]> {
    try {
      return await http.get('/payroll-types');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al cargar tipos de planilla');
    }
  },

  /**
   * Update an existing payroll type
   * PUT /api/payroll-type/:id
   */
  async updatePayrollType(id: number, payload: Partial<PayrollTypePayload>): Promise<PayrollType> {
    try {
      return await http.put(`/payroll-type/${id}`, payload);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar tipo de planilla');
    }
  },
};
