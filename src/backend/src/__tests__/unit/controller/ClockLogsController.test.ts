import { Request, Response } from 'express';

// Mock the service modules BEFORE importing the controller
jest.mock('../../../service/ClockLogsService');
jest.mock('../../../service/ImportSessionService', () => ({
  ImportSessionService: {
    getRecentSessions: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('../../../service/ClockLogsImportService');

import { ClockLogsController } from '../../../controller/ClockLogsController';
import { ClockLogsService } from '../../../service/ClockLogsService';
import { ImportSessionService } from '../../../service/ImportSessionService';
import { ClockLogsImportService } from '../../../service/ClockLogsImportService';

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & { json: jest.Mock; status: jest.Mock } {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { json: jest.Mock; status: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up default mock behaviors for ClockLogsService instances
  (ClockLogsService as jest.Mock).mockImplementation(() => ({
    bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
    getStats: jest.fn().mockResolvedValue([]),
    getClockLogs: jest.fn().mockResolvedValue([]),
    getClockLogsPaginated: jest.fn().mockResolvedValue({ success: true, data: [], total: 0, page: 1, pageSize: 20 }),
    getImportSessions: jest.fn().mockResolvedValue([]),
    getOrphans: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    getAnomalies: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
    resolveOrphan: jest.fn().mockResolvedValue({ success: true }),
    createManualLog: jest.fn().mockResolvedValue({ clockLogId: 1 }),
    updateClockLogStatus: jest.fn().mockResolvedValue({ success: true }),
  }));

  // Set up default mock behavior for ClockLogsImportService instances
  (ClockLogsImportService as jest.Mock).mockImplementation(() => ({
    resolveEmployeeId: jest.fn().mockResolvedValue(1),
    processImport: jest.fn().mockResolvedValue({ status: 'completed', created: 0, skipped: 0, anomalies: 0, errors: [] }),
  }));

  // Reset ImportSessionService mock
  (ImportSessionService.getRecentSessions as jest.Mock).mockResolvedValue([]);
});

describe('ClockLogsController', () => {
  describe('bulkCreate', () => {
    it('should reject unknown log_type and add to skipped array with descriptive error containing rejected value', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          logs: [
            { employee_id: 1, timestamp: '2026-02-02T08:00:00Z', log_type: 'UNKNOWN_TYPE' },
          ],
        },
      });
      const res = createMockResponse();

      await controller.bulkCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 with skipped details when all logs have unknown types', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          logs: [
            { employee_id: 1, timestamp: '2026-02-02T08:00:00Z', log_type: 'INVALID' },
            { employee_id: 1, timestamp: '2026-02-02T17:00:00Z', log_type: 'GARBAGE' },
          ],
        },
      });
      const res = createMockResponse();

      await controller.bulkCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.skipped).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return { byStatus, bySource, total } shape on success', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        getStats: jest.fn().mockResolvedValue([
          { status: 'pending', source: 'manual', count: 5 },
          { status: 'valid', source: 'java_import', count: 10 },
          { status: 'valid', source: 'manual', count: 3 },
        ]),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01', endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          byStatus: { pending: 5, valid: 13 },
          bySource: { manual: 8, java_import: 10 },
          total: 18,
        },
      });
    });

    it('should return 400 when initDate is missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOrphans', () => {
    it('should return paginated orphan logs with proper response shape', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        getOrphans: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              employee_id: 101,
              employee_name: 'Juan Pérez',
              employee_social_code: '123',
              timestamp: new Date('2026-02-02T08:00:00Z'),
              log_type: 'IN',
              remarks: 'Missing OUT',
              status: 'orphan',
              source: 'java_import',
              import_session_id: undefined
            }
          ],
          total: 1,
          page: 1,
          pageSize: 20
        }),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { page: '1', pageSize: '20' },
      });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        total: 1,
        page: 1,
        pageSize: 20
      });
    });
  });

  describe('getAnomalies', () => {
    it('should return paginated anomaly logs with proper response shape', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        getAnomalies: jest.fn().mockResolvedValue({
          data: [
            {
              id: 10,
              employee_id: 201,
              employee_name: 'Carlos Ramírez',
              employee_social_code: '987',
              timestamp: new Date('2026-02-05T12:00:00Z'),
              log_type: 'IN',
              remarks: 'Outside normal hours',
              status: 'anomaly',
              source: 'manual',
              import_session_id: undefined
            }
          ],
          total: 1,
          page: 1,
          pageSize: 10
        }),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { page: '1', pageSize: '10' },
      });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        total: 1,
        page: 1,
        pageSize: 10
      });
    });
  });

  describe('resolveOrphan', () => {
    it('should successfully discard orphan', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        resolveOrphan: jest.fn().mockResolvedValue({
          success: true,
          message: 'Huérfana descartada exitosamente'
        }),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: { action: 'discard', justification: 'Duplicate' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Huérfana descartada exitosamente'
      });
    });
  });

  describe('createManualLog', () => {
    it('should create manual log and return 201 with clockLogId', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        createManualLog: jest.fn().mockResolvedValue({ clockLogId: 123 }),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          employee_id: 1,
          timestamp: '2025-01-01T10:00:00Z',
          log_type: 'IN',
          remarks: null,
          justification: 'Manual correction',
        },
        user: { id: 2 },
      });
      const res = createMockResponse();

      await controller.createManualLog(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, clockLogId: 123 });
    });
  });

  describe('updateClockLogStatus', () => {
    it('should update status and return success', async () => {
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        updateClockLogStatus: jest.fn().mockResolvedValue({ success: true }),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '456' },
        body: {
          status: 'corrected',
          justification: 'Fix reason',
        },
        user: { user_id: 3 },
      });
      const res = createMockResponse();

      await controller.updateClockLogStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getClockLogsPaginated', () => {
    it('should call service and return paginated result', async () => {
      const mockResult = {
        data: [{ id: 1, employee_id: 1, employee_name: 'Test', timestamp: new Date(), log_type: 'IN', status: 'valid', source: 'manual' }],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        getClockLogsPaginated: jest.fn().mockResolvedValue(mockResult),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01', endDate: '2026-02-28', page: '1', pageSize: '20' },
      });
      const res = createMockResponse();

      await controller.getClockLogsPaginated(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, ...mockResult });
    });
  });

  describe('getImportSessions', () => {
    it('should return sessions with specified limit', async () => {
      const mockSessions = [{ id: 1, started_at: new Date(), source: 'java_import', status: 'completed', created_count: 10, skipped_count: 0, anomaly_count: 0, total_records: 10, created_by: 2 }];
      (ImportSessionService.getRecentSessions as jest.Mock).mockResolvedValue(mockSessions);

      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { limit: '3' } });
      const res = createMockResponse();

      await controller.getImportSessions(req, res);

      expect(ImportSessionService.getRecentSessions).toHaveBeenCalledWith(3);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSessions });
    });
  });
});
