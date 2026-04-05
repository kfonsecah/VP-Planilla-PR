import { Request, Response } from 'express';
import { ClockLogsController } from '../../../controller/ClockLogsController';
import { ClockLogsService } from '../../../service/ClockLogsService';

// Mock the service module - define mocks inside factory to avoid hoisting issues
jest.mock('../../../service/ClockLogsService', () => {
  return {
    ClockLogsService: jest.fn().mockImplementation(() => ({
      bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
      getStats: jest.fn().mockResolvedValue([]),
      getClockLogs: jest.fn().mockResolvedValue([]),
    })),
  };
});

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
  // Reset default return values after clearAllMocks
  const MockService = ClockLogsService as jest.Mock;
  const mockInstance = MockService.mock.results[0]?.value;
  if (mockInstance) {
    mockInstance.bulkCreate.mockResolvedValue({ created: 0 });
    mockInstance.getStats.mockResolvedValue([]);
    mockInstance.getClockLogs.mockResolvedValue([]);
  }
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
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          skipped: expect.arrayContaining([
            expect.stringContaining('UNKNOWN_TYPE'),
          ]),
        }),
      );
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
      expect(jsonCall.skipped).toHaveLength(2);
      expect(jsonCall.skipped[0]).toContain('INVALID');
      expect(jsonCall.skipped[1]).toContain('GARBAGE');
    });
  });

  describe('getStats', () => {
    it('should return { byStatus, bySource, total } shape on success', async () => {
      const MockService = ClockLogsService as jest.Mock;
      
      // Set up the mock to return the desired value whenever a new instance is created
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([
          { status: 'pending', source: 'manual', count: 5 },
          { status: 'valid', source: 'java_import', count: 10 },
          { status: 'valid', source: 'manual', count: 3 },
        ]),
        getClockLogs: jest.fn().mockResolvedValue([]),
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
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should return 400 when endDate is missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01' },
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
      );
    });

    it('should return 400 when both params are missing', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: {},
      });
      const res = createMockResponse();

      await controller.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOrphans', () => {
    it('should return paginated orphan logs with proper response shape', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([]),
        getClockLogs: jest.fn().mockResolvedValue([]),
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

    it('should return 400 for invalid initDate', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: 'invalid-date', endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid endDate', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01', endDate: 'invalid' },
      });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle internal server errors', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        getOrphans: jest.fn().mockRejectedValue(new Error('DB error')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

       await controller.getOrphans(req, res);

       expect(res.status).toHaveBeenCalledWith(500);
     });

    // Pagination validation tests
    it('should clamp page to minimum 1 when page=0', async () => {
      const MockService = ClockLogsService as jest.Mock;
      const mockGetOrphans = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 });
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([]),
        getClockLogs: jest.fn().mockResolvedValue([]),
        getOrphans: mockGetOrphans,
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { page: '0' } });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      // Ensure service was called with page=1 (clamped)
      expect(mockGetOrphans).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('should return 400 when pageSize is 0', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '0' } });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize must be >= 1' });
    });

    it('should return 400 when pageSize is negative', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '-5' } });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize must be >= 1' });
    });

    it('should return 400 when pageSize exceeds maximum (200)', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '201' } });
      const res = createMockResponse();

      await controller.getOrphans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize cannot exceed 200' });
    });

   });

  describe('getAnomalies', () => {
    it('should return paginated anomaly logs with proper response shape', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([]),
        getClockLogs: jest.fn().mockResolvedValue([]),
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

    it('should return 400 for invalid initDate', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: 'invalid', endDate: '2026-02-28' },
      });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid endDate', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        query: { initDate: '2026-02-01', endDate: 'invalid' },
      });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle internal server errors', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        getAnomalies: jest.fn().mockRejectedValue(new Error('DB error')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

       await controller.getAnomalies(req, res);

       expect(res.status).toHaveBeenCalledWith(500);
     });

    // Pagination validation tests
    it('should clamp page to minimum 1 when page is negative', async () => {
      const MockService = ClockLogsService as jest.Mock;
      const mockGetAnomalies = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 });
      MockService.mockImplementation(() => ({
        bulkCreate: jest.fn().mockResolvedValue({ created: 0 }),
        getStats: jest.fn().mockResolvedValue([]),
        getClockLogs: jest.fn().mockResolvedValue([]),
        getAnomalies: mockGetAnomalies,
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { page: '-2' } });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      expect(mockGetAnomalies).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('should return 400 when pageSize is 0', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '0' } });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize must be >= 1' });
    });

    it('should return 400 when pageSize is negative', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '-10' } });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize must be >= 1' });
    });

    it('should return 400 when pageSize exceeds maximum (200)', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({ query: { pageSize: '500' } });
      const res = createMockResponse();

      await controller.getAnomalies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'pageSize cannot exceed 200' });
    });

   });

  describe('resolveOrphan', () => {
    it('should return 400 for invalid orphan ID', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: 'abc' },
        body: { action: 'discard', justification: 'Test' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID de marca inválido' });
    });

    it('should return 404 when orphan not found', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        resolveOrphan: jest.fn().mockRejectedValue(new Error('Marca no encontrada')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '999' },
        body: { action: 'discard', justification: 'Test' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Marca no encontrada' });
    });

    it('should return 400 when log is not an orphan', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        resolveOrphan: jest.fn().mockRejectedValue(new Error('La marca no tiene status orphan')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: { action: 'discard', justification: 'Test' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La marca no tiene status orphan' });
    });

    it('should return 400 when complement data missing for assign_complement', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: { action: 'assign_complement', justification: 'Test' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'complementTimestamp y complementLogType son requeridos para assign_complement'
      });
    });

    it('should return 400 for invalid complement timestamp', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: {
          action: 'assign_complement',
          justification: 'Test',
          complementTimestamp: 'invalid',
          complementLogType: 'OUT'
        },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Timestamp de complemento inválido' });
    });

    it('should successfully discard orphan', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        resolveOrphan: jest.fn().mockResolvedValue({
          success: true,
          message: 'Huérfana descartada exitosamente'
        }),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
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

    it('should successfully assign complement', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        resolveOrphan: jest.fn().mockResolvedValue({
          success: true,
          message: 'Huérfana resuelta con complemento exitosamente'
        }),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: {
          action: 'assign_complement',
          justification: 'Missing OUT',
          complementTimestamp: '2026-02-10T17:00:00Z',
          complementLogType: 'OUT'
        },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Huérfana resuelta con complemento exitosamente'
      });
    });

    it('should propagate internal server errors', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        resolveOrphan: jest.fn().mockRejectedValue(new Error('Unexpected error')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '500' },
        body: { action: 'discard', justification: 'Test' },
      });
      const res = createMockResponse();

      await controller.resolveOrphan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('createManualLog', () => {
    it('should create manual log and return 201 with clockLogId', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        createManualLog: jest.fn().mockResolvedValue({ clockLogId: 123 }),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
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

    it('should return 400 for invalid timestamp', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          employee_id: 1,
          timestamp: 'invalid-date',
          log_type: 'IN',
          justification: 'test',
        },
        user: { id: 2 },
      });
      const res = createMockResponse();

      await controller.createManualLog(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Timestamp inválido' });
    });

    it('should return 404 when service throws not found error', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        createManualLog: jest.fn().mockRejectedValue(new Error('Employee not found')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          employee_id: 999,
          timestamp: '2025-01-01T10:00:00Z',
          log_type: 'IN',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.createManualLog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Marca no encontrada' });
    });

    it('should return 500 for other errors', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        createManualLog: jest.fn().mockRejectedValue(new Error('Database error')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        body: {
          employee_id: 1,
          timestamp: '2025-01-01T10:00:00Z',
          log_type: 'IN',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.createManualLog(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('updateClockLogStatus', () => {
    it('should update status and return success', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        updateClockLogStatus: jest.fn().mockResolvedValue({ success: true }),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
        createManualLog: jest.fn(),
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

    it('should return 400 for invalid clock log ID', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: 'abc' },
        body: {
          status: 'corrected',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.updateClockLogStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID de marca inválido' });
    });

    it('should return 400 for negative or zero ID', async () => {
      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '0' },
        body: {
          status: 'corrected',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.updateClockLogStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID de marca inválido' });
    });

    it('should return 404 when log not found', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        updateClockLogStatus: jest.fn().mockRejectedValue(new Error('Marca no encontrada')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
        createManualLog: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '999' },
        body: {
          status: 'corrected',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.updateClockLogStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Marca no encontrada' });
    });

    it('should return 500 for other errors', async () => {
      const MockService = ClockLogsService as jest.Mock;
      MockService.mockImplementation(() => ({
        updateClockLogStatus: jest.fn().mockRejectedValue(new Error('Database error')),
        bulkCreate: jest.fn(),
        getStats: jest.fn(),
        getClockLogs: jest.fn(),
        getOrphans: jest.fn(),
        getAnomalies: jest.fn(),
        resolveOrphan: jest.fn(),
        createManualLog: jest.fn(),
      }));

      const controller = new ClockLogsController();
      const req = createMockRequest({
        params: { id: '456' },
        body: {
          status: 'corrected',
          justification: 'test',
        },
        user: { id: 1 },
      });
      const res = createMockResponse();

      await controller.updateClockLogStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });
});
