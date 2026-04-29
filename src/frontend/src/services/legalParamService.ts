import { http } from './http';
import { LegalParam } from '../types/legalParam';

/**
 * Service to manage legal parameters from the backend.
 * Provides methods to retrieve and update specific legal configuration keys.
 */
export const LegalParamService = {
  /**
   * Retrieves the value of a specific legal parameter.
   * @param key The unique key of the parameter.
   * @returns The parameter value.
   */
  getParam: async (key: string): Promise<{ value: number | string }> => {
    return http.get(`/legal-params?key=${key}`);
  },

  /**
   * Updates the value of a specific legal parameter.
   * @param key The unique key of the parameter.
   * @param value The new value to set.
   * @param confirmationPassword Optional password if the parameter is critical.
   * @returns Success status of the update.
   */
  updateParam: async (key: string, value: string | number | boolean, confirmationPassword?: string): Promise<{ success: boolean }> => {
    return http.patch(`/legal-params/${key}`, { value, confirmationPassword });
  },

  /**
   * Create a new legal parameter record.
   */
  upsertParam: async (data: Partial<LegalParam> & { confirmationPassword?: string }): Promise<LegalParam> => {
    return http.post(`/legal-params`, data);
  },

  /**
   * Update a parameter value.
   */
  patchParam: async (key: string, data: Partial<LegalParam> & { confirmationPassword?: string }): Promise<LegalParam> => {
    return http.patch(`/legal-params/${key}`, data);
  },

  getActiveParams: async (): Promise<LegalParam[]> => {
    return http.get(`/legal-params/active`);
  },

  getParamHistory: async (key: string): Promise<LegalParam[]> => {
    return http.get(`/legal-params/history/${key}`);
  },

  bulkUpsertMinWages: async (data: { updates: { key: string; value: number }[]; validFrom: string; source_decree: string; confirmationPassword?: string }): Promise<{ success: boolean }> => {
    return http.post(`/legal-params/min-wages/bulk`, data);
  },
};
