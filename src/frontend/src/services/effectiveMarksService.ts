import { http } from './http';

export interface EffectiveClockLog {
  id: string;
  employee_id: string;
  employee_name: string;
  branch_name: string;
  log_date: string;
  original: {
    in_time: string | null;
    out_time: string | null;
    /** Database ID of the IN clock log record — used by VOID/EDIT actions */
    in_log_id: number | null;
    /** Database ID of the OUT clock log record — used by VOID/EDIT actions */
    out_log_id: number | null;
    status: 'valid' | 'anomaly' | 'orphan' | 'pending' | 'corrected';
    source: 'java_import' | 'excel_import' | 'manual' | 'device';
  };
  adjusted?: {
    in_time: string | null;
    out_time: string | null;
    adjustment_id: string;
    reason: string;
  };
  calculated_hours: number | null;
}

export interface EffectiveMarksFilters {
  initDate: string;
  endDate: string;
  branch_id?: number;
  employee_id?: number;
  status?: string[];
}

export interface PaginatedEffectiveResponse {
  success: boolean;
  data: EffectiveClockLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const EffectiveMarksService = {
  async getEffectiveMarks(params: EffectiveMarksFilters & { page?: number; pageSize?: number }): Promise<PaginatedEffectiveResponse> {
    const searchParams = new URLSearchParams({
      initDate: params.initDate,
      endDate: params.endDate,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 20),
    });

    if (params.branch_id) {
      searchParams.set('branch_id', String(params.branch_id));
    }
    if (params.employee_id) {
      searchParams.set('employee_id', String(params.employee_id));
    }
    if (params.status && params.status.length > 0) {
      searchParams.set('status', params.status.join(','));
    }

    try {
      // ALWAYS use http.raw() to preserve pagination metadata
      const queryString = searchParams.toString();
      const raw = await http.raw(`/clock-logs/effective${queryString ? '?' + queryString : ''}`, { method: 'GET' });

      if (!raw.ok) {
        console.warn('[EffectiveMarksService] Request failed:', raw.status, raw.statusText);
        return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
      }

      const json = await raw.json();
      return json ?? { success: true, data: [], total: 0, page: 1, pageSize: 20 };
    } catch (error: unknown) {
      console.warn('[EffectiveMarksService] Error fetching effective marks:', error instanceof Error ? error.message : error);
      return { success: false, data: [], total: 0, page: 1, pageSize: 20 };
    }
  }
};
