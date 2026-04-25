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

export interface ClockLogPaginated {
  id: number;
  employee_id: number;
  employee_name: string;
  timestamp: string;
  log_type: string;
  status: 'pending' | 'valid' | 'anomaly' | 'corrected' | 'orphan';
  source: 'java_import' | 'excel_import' | 'manual';
  remarks?: string;
  import_session_id?: number;
}

export interface ClockLogStats {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  total: number;
}

export interface ImportSession {
  id: number;
  started_at: string;
  completed_at?: string;
  source: 'java_import' | 'excel_import' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_records: number;
  created_count: number;
  skipped_count: number;
  anomaly_count: number;
  created_by: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  session_id: number;
  status: string;
  created: number;
  skipped: number;
  anomalies: number;
  errors: string[];
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
  },

  async getStats(initDate: string, endDate: string): Promise<ClockLogStats> {
    const params = new URLSearchParams({ initDate, endDate });
    // http.get unwraps { success, data } wrapper — returns data directly
    const response = await http.get(`/clock-logs/stats?${params.toString()}`);
    return response ?? { byStatus: {}, bySource: {}, total: 0 };
  },

  async getClockLogsPaginated(params: {
    initDate: string;
    endDate: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    employee_id?: number;
  }): Promise<PaginatedResponse<ClockLogPaginated>> {
    const searchParams = new URLSearchParams({
      initDate: params.initDate,
      endDate: params.endDate,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 20),
    });
    if (params.status?.length) searchParams.set('status', params.status.join(','));
    if (params.employee_id) searchParams.set('employee_id', String(params.employee_id));
    // http.get unwraps { success, data } wrapper — but paginated response has data + pagination fields at root
    // Backend returns { success, data: [...], total, page, pageSize } — requestJson unwraps 'data' only
    // Use raw to preserve full response shape
    const raw = await http.raw(`/clock-logs/paginated?${searchParams.toString()}`, { method: 'GET' });
    if (!raw.ok) return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
    try {
      const json = await raw.json();
      return json ?? { success: true, data: [], total: 0, page: 1, pageSize: 20 };
    } catch {
      return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
    }
  },

  async getImportSessions(limit: number = 5): Promise<ImportSession[]> {
    // http.get unwraps { success, data } wrapper — returns data array directly
    const response = await http.get(`/clock-logs/import-sessions?limit=${limit}`);
    return Array.isArray(response) ? response : [];
  },

  async importLogs(logs: ClockLog[], source: string = 'excel_import'): Promise<ImportResult> {
    return await http.post('/clock-logs/import', { logs, source });
  },

  async updateClockLogStatus(id: number, status: string, justification: string): Promise<void> {
    await http.patch(`/clock-logs/${id}/status`, { status, justification });
  },

  async getAuditLogsForClockLog(clockLogId: number): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({ entity: 'clock_log', limit: '50' });
    const response = await http.get(`/audit-logs?${params.toString()}`);
    const allLogs: unknown[] = response?.data ?? response ?? [];
    // Filter client-side by entity_id since the endpoint may not support entity_id filter
    return Array.isArray(allLogs)
      ? (allLogs as Record<string, unknown>[]).filter((log) => String(log.entity_id) === String(clockLogId))
      : [];
  },
};
