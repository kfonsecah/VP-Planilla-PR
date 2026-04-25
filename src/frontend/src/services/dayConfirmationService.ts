import { http } from './http';

export const dayConfirmationService = {
  upsert: async (employeeId: number, confirmationDate: string, notes?: string) => {
    return await http.post('/day-confirmations', { employeeId, confirmationDate, notes });
  },
  get: async (employeeId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', String(employeeId));
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return await http.get(`/day-confirmations?${params.toString()}`);
  }
}
