import { ClockLogsService } from '@/services/clockLogsService';
import { http } from '@/services/http';

jest.mock('@/services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    raw: jest.fn(),
  },
}));

describe('ClockLogsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return stats object when successful', async () => {
      const mockStats = { byStatus: { pending: 5 }, bySource: { manual: 10 }, total: 15 };
      (http.get as jest.Mock).mockResolvedValue(mockStats);

      const result = await ClockLogsService.getStats('2026-02-01', '2026-02-28');

      expect(result).toEqual(mockStats);
      expect(http.get).toHaveBeenCalledWith('/clock-logs/stats?initDate=2026-02-01&endDate=2026-02-28');
    });

    it('should return default empty object when response is null/undefined', async () => {
      (http.get as jest.Mock).mockResolvedValue(null);

      const result = await ClockLogsService.getStats('2026-02-01', '2026-02-28');

      expect(result).toEqual({ byStatus: {}, bySource: {}, total: 0 });
    });
  });

  describe('getClockLogsPaginated', () => {
    const defaultParams = {
      initDate: '2026-02-01',
      endDate: '2026-02-28',
      page: 1,
      pageSize: 20,
    };

    it('should return paginated response on success', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, employee_id: 101, employee_name: 'Ana García', timestamp: '2026-02-02T08:00:00Z', log_type: 'IN', status: 'anomaly', source: 'java_import' }],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      const rawMock = { ok: true, json: jest.fn().mockResolvedValue(mockResponse) };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      const result = await ClockLogsService.getClockLogsPaginated(defaultParams);

      expect(result).toEqual(mockResponse);
      expect(http.raw).toHaveBeenCalledWith(`/clock-logs/paginated?initDate=${defaultParams.initDate}&endDate=${defaultParams.endDate}&page=1&pageSize=20`, { method: 'GET' });
    });

    it('should include status filter when provided', async () => {
      const rawMock = { ok: true, json: jest.fn().mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 }) };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      await ClockLogsService.getClockLogsPaginated({
        ...defaultParams,
        status: ['anomaly', 'orphan'],
      });

      expect(http.raw).toHaveBeenCalledWith(
        expect.stringContaining('/clock-logs/paginated?initDate='),
        { method: 'GET' }
      );
      // Verify that the URL contains status=anomaly%2Corphan
      const calledUrl = (http.raw as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('status=anomaly%2Corphan');
    });

    it('should include employee_id filter when provided', async () => {
      const rawMock = { ok: true, json: jest.fn().mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 }) };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      await ClockLogsService.getClockLogsPaginated({
        ...defaultParams,
        employee_id: 101,
      });

      const calledUrl = (http.raw as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('employee_id=101');
    });

    it('should return error envelope when raw.ok is false', async () => {
      const rawMock = { ok: false };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      const result = await ClockLogsService.getClockLogsPaginated(defaultParams);

      expect(result).toEqual({
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
    });

    it('should handle json parsing failure gracefully', async () => {
      const rawMock = { ok: true, json: jest.fn().mockRejectedValue(new Error('parse error')) };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      const result = await ClockLogsService.getClockLogsPaginated(defaultParams);

      expect(result).toEqual({ success: false, data: [], total: 0, page: 1, pageSize: 20 });
    });

    it('should fallback when json returns null', async () => {
      const rawMock = { ok: true, json: jest.fn().mockResolvedValue(null) };
      (http.raw as jest.Mock).mockResolvedValue(rawMock);

      const result = await ClockLogsService.getClockLogsPaginated(defaultParams);

      expect(result).toEqual({ success: true, data: [], total: 0, page: 1, pageSize: 20 });
    });
  });

  describe('getImportSessions', () => {
    it('should return array of import sessions', async () => {
      const mockSessions = [
        { id: 1, started_at: '2026-04-05T10:00:00Z', source: 'java_import', status: 'completed', created_count: 10, skipped_count: 0 },
      ];
      (http.get as jest.Mock).mockResolvedValue(mockSessions);

      const result = await ClockLogsService.getImportSessions(5);

      expect(result).toEqual(mockSessions);
      expect(http.get).toHaveBeenCalledWith('/clock-logs/import-sessions?limit=5');
    });

    it('should return default limit 5 when not specified', async () => {
      const mockSessions: any[] = [];
      (http.get as jest.Mock).mockResolvedValue(mockSessions);

      await ClockLogsService.getImportSessions();

      expect(http.get).toHaveBeenCalledWith('/clock-logs/import-sessions?limit=5');
    });

    it('should return empty array if response is not array', async () => {
      (http.get as jest.Mock).mockResolvedValue({ success: true, data: [] });

      const result = await ClockLogsService.getImportSessions(5);

      expect(result).toEqual([]);
    });
  });

  describe('importLogs', () => {
    it('should call POST /clock-logs/import with logs and source, return response', async () => {
      const mockResponse = { session_id: 1, status: 'completed', created: 10, skipped: 0, anomalies: 0, errors: [] };
      (http.post as jest.Mock).mockResolvedValue(mockResponse);
      const logs = [{ employee_id: 1, timestamp: '2026-02-02T08:00:00Z', log_type: 'IN' } as any];

      const result = await ClockLogsService.importLogs(logs, 'excel_import');

      expect(result).toEqual(mockResponse);
      expect(http.post).toHaveBeenCalledWith('/clock-logs/import', { logs, source: 'excel_import' });
    });

    it('should default source to excel_import if not provided', async () => {
      const mockResponse = { session_id: 2 };
      (http.post as jest.Mock).mockResolvedValue(mockResponse);
      const logs = [] as any[];

      await ClockLogsService.importLogs(logs);

      expect(http.post).toHaveBeenCalledWith('/clock-logs/import', { logs, source: 'excel_import' });
    });
  });

  describe('updateClockLogStatus', () => {
    it('should call PATCH with correct URL and body', async () => {
      (http.patch as jest.Mock).mockResolvedValue({});

      await ClockLogsService.updateClockLogStatus(123, 'corrected', 'Justification text');

      expect(http.patch).toHaveBeenCalledWith('/clock-logs/123/status', { status: 'corrected', justification: 'Justification text' });
    });
  });

  describe('getAuditLogsForClockLog', () => {
    it('should return filtered audit logs matching entity_id', async () => {
      const allLogs = [
        { entity_id: 1, action: 'create' },
        { entity_id: 2, action: 'update' },
        { entity_id: 1, action: 'delete' },
      ];
      (http.get as jest.Mock).mockResolvedValue(allLogs);

      const result = await ClockLogsService.getAuditLogsForClockLog(1);

      expect(result).toEqual([{ entity_id: 1, action: 'create' }, { entity_id: 1, action: 'delete' }]);
      expect(http.get).toHaveBeenCalledWith('/audit-logs?entity=clock_log&limit=50');
    });

    it('should handle response as { success, data } wrapper', async () => {
      const wrapped = { success: true, data: [{ entity_id: 2, action: 'edit' }] };
      (http.get as jest.Mock).mockResolvedValue(wrapped);

      const result = await ClockLogsService.getAuditLogsForClockLog(2);

      expect(result).toEqual([{ entity_id: 2, action: 'edit' }]);
    });

    it('should return empty array for empty response', async () => {
      (http.get as jest.Mock).mockResolvedValue([]);

      const result = await ClockLogsService.getAuditLogsForClockLog(999);

      expect(result).toEqual([]);
    });
  });
});
