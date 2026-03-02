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

export interface AttendanceSummary {
  employee_id: number | string;
  employee_name: string;
  date: string;
  logs: ClockLog[];
  hours_worked: number;
  check_in: string | null;
  check_out: string | null;
  inconsistencies: string[];
}

export const ClockLogsService = {
  async getClockLogs(startDate: string, endDate: string): Promise<ClockLog[]> {
    if (!startDate || !endDate) return [];

    const params = new URLSearchParams({
      initDate: startDate,
      endDate
    });

    try {
      const response = await http.get(`/clock-logs?${params.toString()}`);
      if (!response) return [];
      if (Array.isArray(response)) return response as ClockLog[];
      if (response?.data && Array.isArray(response.data)) return response.data as ClockLog[];
      return [];
    } catch (error: unknown) {
      console.warn('[ClockLogsService] No se pudieron obtener marcas del backend:', error instanceof Error ? error.message : error);
      return [];
    }
  },

  async getAttendanceSummary(startDate: string, endDate: string): Promise<AttendanceSummary[]> {
    const params = new URLSearchParams({ initDate: startDate, endDate });

    try {
      const response = await http.get(`/clock-logs/attendance-summary?${params.toString()}`);
      if (!response) return [];
      if (Array.isArray(response)) return response as AttendanceSummary[];
      if (response?.data && Array.isArray(response.data)) return response.data as AttendanceSummary[];
      return [];
    } catch (error: unknown) {
      console.warn('[ClockLogsService] No se pudo obtener resumen de asistencia:', error instanceof Error ? error.message : error);
      return [];
    }
  },

  async updateClockLog(id: number, data: { timestamp: string; log_type: string; remarks?: string }): Promise<ClockLog> {
    return await http.put(`/clock-logs/${id}`, data);
  },

  async bulkSave(logs: ClockLog[]): Promise<{ created: number; skipped?: string[] }> {
    if (!logs.length) return { created: 0 };

    try {
      const response = await http.post('/clock-logs/bulk', { logs });
      return response ?? { created: 0 };
    } catch (error: unknown) {
      console.error('[ClockLogsService] Error al guardar marcas en BD:', error instanceof Error ? error.message : error);
      throw error;
    }
  }
};
