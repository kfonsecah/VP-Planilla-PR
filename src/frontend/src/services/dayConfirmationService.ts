import { http } from './http';

export const dayConfirmationService = {
  upsert: async (employeeId: number, confirmationDate: string, notes?: string) => {
    return await http.post('/api/day-confirmations', { employeeId, confirmationDate, notes });
  },
  get: async (employeeId: number, startDate: string, endDate: string) => {
    return await http.get(`/api/day-confirmations?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`);
  }
}
