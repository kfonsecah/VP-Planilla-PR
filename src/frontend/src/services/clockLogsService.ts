import { http } from './http';

export interface ClockLog {
  id: number;
  employee_id: number | string | null;
  timestamp: string;
  log_type: string;
  remarks?: string;
  version: number;
  employee_name?: string;
}
export const ClockLogsService = {
  async getClockLogs(startDate: string, endDate: string): Promise<ClockLog[]> {
    if (!startDate || !endDate) return [];

    const params = new URLSearchParams({
      startDate,
      endDate
    });

    try {
      const response = await http.get(`/clock-logs?${params.toString()}`);
      if (!response) return [];
      if (Array.isArray(response)) return response as ClockLog[];
      if (response?.data && Array.isArray(response.data)) return response.data as ClockLog[];
      return [];
    } catch (error: any) {
      // Until the backend endpoint exists we swallow the error so the UI can work with Excel imports.
      console.warn('[ClockLogsService] No se pudieron obtener marcas del backend:', error?.message || error);
      return [];
    }
  }
};
