import { http } from './http';

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
    return http.get(`/legal-params/${key}`);
  },

  /**
   * Updates the value of a specific legal parameter.
   * @param key The unique key of the parameter.
   * @param value The new value to set.
   * @returns Success status of the update.
   */
  updateParam: async (key: string, value: string | number | boolean): Promise<{ success: boolean }> => {
    return http.patch(`/legal-params/${key}`, { value });
  },
};
