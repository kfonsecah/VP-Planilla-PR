import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogsImportService } from '../../../service/ClockLogsImportService';
import { ImportSessionService } from '../../../service/ImportSessionService';
import { ClockLogsService } from '../../../service/ClockLogsService';
import { ClockLogAnalysisService } from '../../../service/ClockLogAnalysisService';
import { ClockAliasService } from '../../../service/ClockAliasService';

// Mock prisma
jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

// Mock other services
jest.mock('../../../service/ImportSessionService');
jest.mock('../../../service/ClockLogsService');
jest.mock('../../../service/ClockLogAnalysisService');
jest.mock('../../../service/ClockAliasService');

describe('ClockLogsImportService', () => {
  const service = new ClockLogsImportService();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no alias match (existing tests unaffected)
    (ClockAliasService.resolveEmployeeByAlias as jest.Mock).mockResolvedValue(null);
  });

  describe('resolveEmployeeId', () => {
    it('should resolve by numeric ID if it exists and is not fired', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue({ employee_id: 101 });
      
      const result = await service.resolveEmployeeId(101, 'Some Name');
      
      expect(result).toBe(101);
      expect(prisma.vpg_employees.findFirst).toHaveBeenCalledWith({
        where: { employee_id: 101, employee_fired: false },
        select: { employee_id: true }
      });
    });

    it('should fall back to name search if numeric ID does not exist', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null);
      prisma.vpg_employees.findMany.mockResolvedValue([
        {
          employee_id: 202,
          employee_first_name: 'Juan',
          employee_middle_name: 'Pérez',
          employee_last_name: 'Gómez'
        }
      ]);
      
      const result = await service.resolveEmployeeId(999, 'Juan Pérez Gómez');
      
      expect(result).toBe(202);
      expect(prisma.vpg_employees.findMany).toHaveBeenCalled();
    });

    it('should resolve by name (first + last) ignoring middle name', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null);
      prisma.vpg_employees.findMany.mockResolvedValue([
        {
          employee_id: 303,
          employee_first_name: 'Maria',
          employee_middle_name: 'Elena',
          employee_last_name: 'Sosa'
        }
      ]);
      
      const result = await service.resolveEmployeeId(null, 'Maria Sosa');
      
      expect(result).toBe(303);
    });

    it('should resolve by name ignoring accents and case', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null);
      prisma.vpg_employees.findMany.mockResolvedValue([
        {
          employee_id: 404,
          employee_first_name: 'José',
          employee_middle_name: null,
          employee_last_name: 'Muñoz'
        }
      ]);
      
      const result = await service.resolveEmployeeId(null, 'jose munoz');
      
      expect(result).toBe(404);
    });

    it('should return null if neither ID nor name match', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null);
      prisma.vpg_employees.findMany.mockResolvedValue([]);
      
      const result = await service.resolveEmployeeId(null, 'Unknown Person');
      
      expect(result).toBeNull();
    });

    it('should resolve via alias table when numeric ID fails and alias exists', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null); // numeric ID not found
      (ClockAliasService.resolveEmployeeByAlias as jest.Mock).mockResolvedValue(77);

      const result = await service.resolveEmployeeId(999, 'Juan');

      expect(result).toBe(77);
      // findMany (name scan) must NOT have been called — alias was faster
      expect(prisma.vpg_employees.findMany).not.toHaveBeenCalled();
    });

    it('should fall back to name scan when numeric ID fails and alias not found', async () => {
      prisma.vpg_employees.findFirst.mockResolvedValue(null);
      (ClockAliasService.resolveEmployeeByAlias as jest.Mock).mockResolvedValue(null);
      prisma.vpg_employees.findMany.mockResolvedValue([
        {
          employee_id: 202,
          employee_first_name: 'Ana',
          employee_middle_name: null,
          employee_last_name: 'López',
        }
      ]);

      const result = await service.resolveEmployeeId(null, 'Ana López');

      expect(result).toBe(202);
      expect(prisma.vpg_employees.findMany).toHaveBeenCalled();
    });
  });

  describe('processImport', () => {
    const mockLogs = [
      { employee_id: 1, employee_name: 'Juan', timestamp: '2024-03-15T08:00:00Z', log_type: 'ENTRADA' },
      { employee_id: null, employee_name: 'Maria Sosa', timestamp: '2024-03-15T17:00:00Z', log_type: 'SALIDA' }
    ];

    it('should process import successfully', async () => {
      (ImportSessionService.createSession as jest.Mock).mockResolvedValue({ id: 10 });
      (ImportSessionService.updateSession as jest.Mock).mockResolvedValue({});
      
      // Mock resolveEmployeeId behavior via prisma
      prisma.vpg_employees.findFirst.mockResolvedValue({ employee_id: 1 });
      prisma.vpg_employees.findMany.mockResolvedValue([
        { employee_id: 2, employee_first_name: 'Maria', employee_middle_name: null, employee_last_name: 'Sosa' }
      ]);

      const bulkCreateMock = jest.fn().mockResolvedValue({ created: 2 });
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        bulkCreate: bulkCreateMock
      }));

      (ClockLogAnalysisService.runPostImportAnalysis as jest.Mock).mockResolvedValue({ total: 0 });

      const result = await service.processImport(mockLogs, 'java_import', 1);

      expect(result.session_id).toBe(10);
      expect(result.status).toBe('completed');
      expect(result.created).toBe(2);
      expect(bulkCreateMock).toHaveBeenCalled();
      expect(ImportSessionService.updateSession).toHaveBeenCalledWith(10, expect.objectContaining({ status: 'completed' }));
    });

    it('should report partial success if some logs are skipped', async () => {
      (ImportSessionService.createSession as jest.Mock).mockResolvedValue({ id: 11 });
      
      // Juan exists, Maria doesn't
      prisma.vpg_employees.findFirst.mockResolvedValueOnce({ employee_id: 1 });
      prisma.vpg_employees.findMany.mockResolvedValue([]);

      const bulkCreateMock = jest.fn().mockResolvedValue({ created: 1 });
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        bulkCreate: bulkCreateMock
      }));

      (ClockLogAnalysisService.runPostImportAnalysis as jest.Mock).mockResolvedValue({ total: 0 });

      const result = await service.processImport(mockLogs, 'java_import', 1);

      expect(result.status).toBe('partial');
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors[0]).toMatch(/No se encontró empleado/);
    });

    it('should mark session as failed if an error occurs', async () => {
      (ImportSessionService.createSession as jest.Mock).mockResolvedValue({ id: 12 });
      prisma.vpg_employees.findFirst.mockRejectedValue(new Error('Fatal error'));

      await expect(service.processImport(mockLogs, 'java_import', 1)).rejects.toThrow('Fatal error');

      expect(ImportSessionService.updateSession).toHaveBeenCalledWith(12, { status: 'failed' });
    });
  });

  describe('processImport with no log_type (inference)', () => {
    beforeEach(() => {
      // Setup session mocks
      (ImportSessionService.createSession as jest.Mock).mockResolvedValue({ id: 99 });
      (ImportSessionService.updateSession as jest.Mock).mockResolvedValue(undefined);
      (ClockLogAnalysisService.runPostImportAnalysis as jest.Mock).mockResolvedValue({ total: 0 });

      const mockBulkCreate = jest.fn().mockResolvedValue({ created: 2 });
      (ClockLogsService as jest.Mock).mockImplementation(() => ({
        bulkCreate: mockBulkCreate,
      }));

      // Resolve employee lookup
      prisma.vpg_employees.findFirst.mockResolvedValue({ employee_id: 1 });
      (ClockAliasService.resolveEmployeeByAlias as jest.Mock).mockResolvedValue(null);
    });

    it('should infer IN and OUT for two rows without log_type for same employee+day', async () => {
      const logs = [
        { employee_id: 1, timestamp: '2026-04-01T08:00:00Z', employee_name: 'Test', log_type: undefined },
        { employee_id: 1, timestamp: '2026-04-01T17:00:00Z', employee_name: 'Test', log_type: undefined },
      ];

      const result = await service.processImport(logs as any, 'excel_import', 1);

      // Both rows should be created (not skipped)
      expect(result.skipped).toBe(0);
      // bulkCreate was called with 2 rows having log_type IN and OUT
      const bulkCreateInstance = (ClockLogsService as jest.Mock).mock.results[0].value;
      const callArgs = bulkCreateInstance.bulkCreate.mock.calls[0][0] as any[];
      const sorted = [...callArgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      expect(sorted[0].log_type).toBe('IN');
      expect(sorted[1].log_type).toBe('OUT');
    });
  });
});
