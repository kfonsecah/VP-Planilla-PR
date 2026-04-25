import { http } from './http';

export interface ClockAlias {
  id: number;
  employee_id: number;
  name: string;
  created_at: string;
  version: number;
}

export const ClockAliasService = {
  /**
   * Retrieves all aliases for a given employee.
   * @param employeeId - The employee's ID (string or number).
   * @returns Array of ClockAlias objects, or empty array if none.
   * @throws ApiError on network or server error.
   */
  async getAliases(employeeId: string | number): Promise<ClockAlias[]> {
    if (!employeeId) return [];
    const response = await http.get(`/employees/${employeeId}/aliases`);
    return (response ?? []) as ClockAlias[];
  },

  /**
   * Creates a new alias for an employee.
   * @param employeeId - The employee's ID.
   * @param aliasName - The alias name to register.
   * @returns The newly created ClockAlias.
   * @throws ApiError with statusCode 409 if alias already exists.
   */
  async createAlias(employeeId: string | number, aliasName: string): Promise<ClockAlias> {
    const response = await http.post(`/employees/${employeeId}/aliases`, { alias_name: aliasName });
    return response as ClockAlias;
  },

  /**
   * Deletes an alias by ID for an employee.
   * @param employeeId - The employee's ID.
   * @param aliasId - The alias ID to delete.
   * @returns void on success.
   * @throws ApiError on failure.
   */
  async deleteAlias(employeeId: string | number, aliasId: number): Promise<void> {
    await http.delete(`/employees/${employeeId}/aliases/${aliasId}`);
  },
};
