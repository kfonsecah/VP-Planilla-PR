import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogsService } from '../../../service/ClockLogsService';
import { AuditLogsService } from '../../../service/AuditLogsService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaClockLog = {
  clock_logs_id: 1,
  clock_logs_employee_id: 1,
  clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
  clock_logs_log_type: 'IN',
  clock_logs_remarks: 'On time',
  clock_logs_version: 1,
  clock_logs_status: 'pending',
  clock_logs_source: 'manual',
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
  prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 0 });
  prisma.vpg_clock_logs.groupBy.mockResolvedValue([]);
});

describe('ClockLogsService', () => {
  const service = new ClockLogsService();

  describe('getClockLogs', () => {
    it('should return clock logs within date range', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([mockPrismaClockLog]);

      const result = await service.getClockLogs({
        initDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].employee_id).toBe(1);
      expect(result[0].log_type).toBe('IN');
      expect(prisma.vpg_clock_logs.findMany).toHaveBeenCalledWith({
        where: {
          clock_logs_timestamp: {
            gte: new Date('2026-02-01'),
            lte: new Date('2026-02-28'),
          },
        },
      });
    });

    it('should return empty array when no logs in range', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([]);

      const result = await service.getClockLogs({
        initDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-31'),
      });

      expect(result).toEqual([]);
    });

    it('should map snake_case DB fields to camelCase output including status and source', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([mockPrismaClockLog]);

      const result = await service.getClockLogs({
        initDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      });

      expect(result[0]).toEqual({
        id: 1,
        employee_id: 1,
        timestamp: mockPrismaClockLog.clock_logs_timestamp,
        log_type: 'IN',
        remarks: 'On time',
        version: 1,
        status: 'pending',
        source: 'manual',
      });
    });

    it('should handle remarks as undefined when null', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([{ ...mockPrismaClockLog, clock_logs_remarks: null }]);

      const result = await service.getClockLogs({
        initDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      });

      expect(result[0].remarks).toBeUndefined();
    });

    it('should throw if database fails', async () => {
      prisma.vpg_clock_logs.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getClockLogs({ initDate: new Date('2026-02-01'), endDate: new Date('2026-02-28') }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple clock logs and return count', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkCreate([
        { employee_id: 1, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
        { employee_id: 1, timestamp: new Date('2026-02-02T17:00:00Z'), log_type: 'OUT' },
        { employee_id: 2, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
      ]);

      expect(result.created).toBe(3);
      expect(prisma.vpg_clock_logs.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            clock_logs_employee_id: 1,
            clock_logs_log_type: 'IN',
            clock_logs_version: 1,
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should handle empty array', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 0 });

      const result = await service.bulkCreate([]);

      expect(result.created).toBe(0);
    });

    it('should skip duplicates with skipDuplicates option', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 2 });

      await service.bulkCreate([
        { employee_id: 1, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
        { employee_id: 1, timestamp: new Date('2026-02-02T17:00:00Z'), log_type: 'OUT' },
      ]);

      const call = prisma.vpg_clock_logs.createMany.mock.lastCall;
      expect(call[0].skipDuplicates).toBe(true);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_clock_logs.createMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.bulkCreate([{ employee_id: 1, timestamp: new Date(), log_type: 'IN' }]),
      ).rejects.toThrow('DB error');
    });

    // NOTE: TRACK-01 requires bulkCreate to explicitly set clock_logs_status: 'pending'.
    // Current implementation relies on DB DEFAULT(pending) instead of setting it explicitly.
    // This is an implementation bug — the test below documents the expected behavior.
    // Once the implementation is fixed, this test should pass.
    it('should set clock_logs_status to pending in createMany data (TRACK-01) — ESCALATED: impl relies on DB default', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 1 });

      await service.bulkCreate([
        { employee_id: 1, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
      ]);

      const call = prisma.vpg_clock_logs.createMany.mock.lastCall;
      const data = call[0].data;
      expect(data).toHaveLength(1);
      // ESCALATED: Implementation does not set clock_logs_status explicitly.
      // Expected: data[0].clock_logs_status === 'pending'
      // Actual: data[0].clock_logs_status === undefined (relies on DB DEFAULT)
      // Fix needed in ClockLogsService.ts bulkCreate: add clock_logs_status: 'pending'
      expect(data[0].clock_logs_status).toBe('pending');
    });

    it('should set clock_logs_source from parameter in createMany data (TRACK-02)', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 2 });

      await service.bulkCreate(
        [
          { employee_id: 1, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
          { employee_id: 2, timestamp: new Date('2026-02-02T09:00:00Z'), log_type: 'OUT' },
        ],
        'java_import',
      );

      const call = prisma.vpg_clock_logs.createMany.mock.lastCall;
      const data = call[0].data;
      expect(data[0].clock_logs_source).toBe('java_import');
      expect(data[1].clock_logs_source).toBe('java_import');
    });

    it('should default clock_logs_source to manual when not provided (TRACK-02)', async () => {
      prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 1 });

      await service.bulkCreate([
        { employee_id: 1, timestamp: new Date('2026-02-02T08:00:00Z'), log_type: 'IN' },
      ]);

      const call = prisma.vpg_clock_logs.createMany.mock.lastCall;
      const data = call[0].data;
      expect(data[0].clock_logs_source).toBe('manual');
    });
  });

  describe('getStats', () => {
    it('should return grouped results by status and source', async () => {
      prisma.vpg_clock_logs.groupBy.mockResolvedValue([
        { clock_logs_status: 'pending', clock_logs_source: 'manual', _count: 5 },
        { clock_logs_status: 'valid', clock_logs_source: 'java_import', _count: 10 },
        { clock_logs_status: 'valid', clock_logs_source: 'manual', _count: 3 },
      ]);

      const result = await service.getStats(
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'pending', source: 'manual', count: 5 });
      expect(result[1]).toEqual({ status: 'valid', source: 'java_import', count: 10 });
      expect(result[2]).toEqual({ status: 'valid', source: 'manual', count: 3 });
    });

    it('should return empty array for no matching records', async () => {
      prisma.vpg_clock_logs.groupBy.mockResolvedValue([]);

      const result = await service.getStats(
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(result).toEqual([]);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_clock_logs.groupBy.mockRejectedValue(new Error('DB error'));

      await expect(
        service.getStats(new Date('2026-02-01'), new Date('2026-02-28')),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getOrphans', () => {
    const mockOrphanLogs = [
      {
        clock_logs_id: 1,
        clock_logs_employee_id: 101,
        clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
        clock_logs_log_type: 'IN',
        clock_logs_remarks: 'Missing OUT',
        clock_logs_status: 'orphan',
        clock_logs_source: 'java_import',
        vpg_employees: {
          employee_id: 101,
          employee_first_name: 'Juan',
          employee_last_name: 'Pérez',
          employee_social_code: '123456789'
        }
      },
      {
        clock_logs_id: 2,
        clock_logs_employee_id: 102,
        clock_logs_timestamp: new Date('2026-02-03T09:00:00.000Z'),
        clock_logs_log_type: 'OUT',
        clock_logs_remarks: null,
        clock_logs_status: 'orphan',
        clock_logs_source: 'excel_import',
        vpg_employees: {
          employee_id: 102,
          employee_first_name: 'María',
          employee_last_name: 'Gómez',
          employee_social_code: '987654321'
        }
      }
    ];

    it('should return paginated orphan logs with employee information', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue(mockOrphanLogs);
      prisma.vpg_clock_logs.count.mockResolvedValue(2);

      const result = await service.getOrphans({ page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 1,
        employee_id: 101,
        employee_name: 'Juan Pérez',
        employee_social_code: '123456789',
        timestamp: mockOrphanLogs[0].clock_logs_timestamp,
        log_type: 'IN',
        remarks: 'Missing OUT',
        status: 'orphan',
        source: 'java_import',
        import_session_id: undefined
      });
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should apply date filters when provided', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue(mockOrphanLogs);
      prisma.vpg_clock_logs.count.mockResolvedValue(2);

      const initDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      await service.getOrphans({ page: 1, pageSize: 20, initDate, endDate });

      expect(prisma.vpg_clock_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clock_logs_status: 'orphan',
            clock_logs_timestamp: { gte: initDate, lte: endDate }
          })
        })
      );
    });

    it('should return empty data array when no orphans exist', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
      prisma.vpg_clock_logs.count.mockResolvedValue(0);

      const result = await service.getOrphans({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_clock_logs.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getOrphans({})).rejects.toThrow('DB error');
    });
  });

  describe('getAnomalies', () => {
    const mockAnomalyLogs = [
      {
        clock_logs_id: 10,
        clock_logs_employee_id: 201,
        clock_logs_timestamp: new Date('2026-02-05T12:00:00.000Z'),
        clock_logs_log_type: 'IN',
        clock_logs_remarks: 'Outside normal hours',
        clock_logs_status: 'anomaly',
        clock_logs_source: 'manual',
        vpg_employees: {
          employee_id: 201,
          employee_first_name: 'Carlos',
          employee_last_name: 'Ramírez',
          employee_social_code: '111222333'
        }
      }
    ];

    it('should return paginated anomaly logs with employee information', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue(mockAnomalyLogs);
      prisma.vpg_clock_logs.count.mockResolvedValue(1);

      const result = await service.getAnomalies({ page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(10);
      expect(result.data[0].employee_name).toBe('Carlos Ramírez');
      expect(result.total).toBe(1);
    });

    it('should apply date filters when provided', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue(mockAnomalyLogs);
      prisma.vpg_clock_logs.count.mockResolvedValue(1);

      const initDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      await service.getAnomalies({ page: 1, pageSize: 10, initDate, endDate });

      expect(prisma.vpg_clock_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clock_logs_status: 'anomaly',
            clock_logs_timestamp: { gte: initDate, lte: endDate }
          })
        })
      );
    });

    it('should return empty data array when no anomalies exist', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
      prisma.vpg_clock_logs.count.mockResolvedValue(0);

      const result = await service.getAnomalies({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_clock_logs.findMany.mockRejectedValue(new Error('DB error'));

      await expect(service.getAnomalies({})).rejects.toThrow('DB error');
    });
  });

  describe('resolveOrphan', () => {
    const mockOrphan = {
      clock_logs_id: 500,
      clock_logs_employee_id: 50,
      clock_logs_timestamp: new Date('2026-02-10T08:00:00.000Z'),
      clock_logs_log_type: 'IN',
      clock_logs_remarks: null,
      clock_logs_status: 'orphan',
      clock_logs_source: 'java_import',
      clock_logs_import_session_id: null
    };

    beforeEach(() => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(null);
      prisma.vpg_clock_logs.update.mockResolvedValue({});
      prisma.vpg_clock_logs.create.mockResolvedValue({});
    });

    it('should throw if orphan not found', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveOrphan(999, 'discard', 'Not found')
      ).rejects.toThrow('Marca no encontrada');
    });

    it('should throw if log is not an orphan', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue({
        ...mockOrphan,
        clock_logs_status: 'valid'
      });

      await expect(
        service.resolveOrphan(500, 'discard', 'Not orphan')
      ).rejects.toThrow('La marca no tiene status orphan');
    });

    it('should discard orphan successfully', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphan);
      prisma.vpg_clock_logs.update.mockResolvedValue({});

      const result = await service.resolveOrphan(500, 'discard', 'Duplicate entry');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Huérfana descartada exitosamente');
      expect(prisma.vpg_clock_logs.update).toHaveBeenCalledWith({
        where: { clock_logs_id: 500 },
        data: {
          clock_logs_status: 'corrected',
          clock_logs_remarks: 'Duplicate entry'
        }
      });
    });

    it('should assign complement successfully', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphan);
      prisma.vpg_clock_logs.create.mockResolvedValue({});
      prisma.vpg_clock_logs.update.mockResolvedValue({});

      const complementData = {
        timestamp: new Date('2026-02-10T17:00:00.000Z'),
        logType: 'OUT' as const
      };

      const result = await service.resolveOrphan(
        500,
        'assign_complement',
        'Missing clock-out',
        complementData
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Huérfana resuelta con complemento exitosamente');
      
      // Verify create called for complementary log
      expect(prisma.vpg_clock_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clock_logs_employee_id: 50,
            clock_logs_timestamp: complementData.timestamp,
            clock_logs_log_type: 'OUT',
            clock_logs_remarks: 'Complemento asignado: Missing clock-out',
            clock_logs_status: 'valid',
            clock_logs_source: 'manual'
          })
        })
      );
      
      // Verify update called on original orphan
      expect(prisma.vpg_clock_logs.update).toHaveBeenCalledWith({
        where: { clock_logs_id: 500 },
        data: {
          clock_logs_status: 'valid',
          clock_logs_remarks: 'Resuelto: Missing clock-out'
        }
      });
    });

    it('should throw when complement log type matches orphan log type (IN orphan + IN complement)', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphan);

      const complementData = {
        timestamp: new Date('2026-02-10T17:00:00.000Z'),
        logType: 'IN' as const  // Same as orphan log_type
      };

      await expect(
        service.resolveOrphan(500, 'assign_complement', 'Test', complementData)
      ).rejects.toThrow('El tipo de marca complementaria debe ser opuesto al tipo de la marca huérfana');
    });

    it('should throw when complement log type matches orphan log type (OUT orphan + OUT complement)', async () => {
      const mockOrphanOUT = {
        ...mockOrphan,
        clock_logs_log_type: 'OUT' as const
      };
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphanOUT);

      const complementData = {
        timestamp: new Date('2026-02-10T08:00:00.000Z'),
        logType: 'OUT' as const  // Same as orphan log_type
      };

      await expect(
        service.resolveOrphan(500, 'assign_complement', 'Test', complementData)
      ).rejects.toThrow('El tipo de marca complementaria debe ser opuesto al tipo de la marca huérfana');
    });

    it('should assign complement with opposite type (OUT orphan + IN complement)', async () => {
      const mockOrphanOUT = {
        ...mockOrphan,
        clock_logs_log_type: 'OUT' as const
      };
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphanOUT);
      prisma.vpg_clock_logs.create.mockResolvedValue({});
      prisma.vpg_clock_logs.update.mockResolvedValue({});

      const complementData = {
        timestamp: new Date('2026-02-10T08:00:00.000Z'),
        logType: 'IN' as const  // Opposite of orphan
      };

      const result = await service.resolveOrphan(
        500,
        'assign_complement',
        'Missing clock-in',
        complementData
      );

      expect(result.success).toBe(true);
      expect(prisma.vpg_clock_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clock_logs_log_type: 'IN'
          })
        })
      );
    });

    it('should throw if complement data missing for assign_complement', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphan);

      await expect(
        service.resolveOrphan(500, 'assign_complement', 'Missing complement')
      ).rejects.toThrow('Datos de complemento incompletos');
    });

    it('should throw for invalid action', async () => {
      prisma.vpg_clock_logs.findUnique.mockResolvedValue(mockOrphan);

      await expect(
        service.resolveOrphan(500, 'invalid_action' as any, 'Test')
      ).rejects.toThrow('Acción no válida');
    });
   });

  describe('createManualLog', () => {
    it('should create manual log and audit entry', async () => {
      const mockCreate = jest.spyOn(prisma.vpg_clock_logs, 'create').mockResolvedValue({ clock_logs_id: 123, clock_logs_employee_id: 1, clock_logs_timestamp: new Date(), clock_logs_log_type: 'IN', clock_logs_remarks: null, clock_logs_status: 'valid', clock_logs_source: 'manual', clock_logs_version: 1, clock_logs_import_session_id: null } as any);
      const mockAudit = jest.spyOn(AuditLogsService, 'createAuditLog').mockResolvedValue(undefined as any);

      const service = new ClockLogsService();
      const result = await service.createManualLog({
        employee_id: 1,
        timestamp: new Date('2025-01-01T10:00:00Z'),
        log_type: 'IN',
        remarks: 'Test',
        created_by: 2,
        justification: 'Manual correction for testing',
      });

      expect(result).toEqual({ success: true, clockLogId: 123 });
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clock_logs_employee_id: 1,
          clock_logs_log_type: 'IN',
          clock_logs_status: 'valid',
          clock_logs_source: 'manual',
          clock_logs_import_session_id: null,
        }),
      });
      expect(mockAudit).toHaveBeenCalledWith({
        userId: 2,
        action: 'manual_correction',
        entity: 'clock_log',
        entityId: 123,
        details: expect.stringContaining('Created manual IN'),
      });
    });

    it('should throw if prisma create fails', async () => {
      const mockCreate = jest.spyOn(prisma.vpg_clock_logs, 'create').mockRejectedValue(new Error('DB error'));
      const service = new ClockLogsService();
      await expect(
        service.createManualLog({
          employee_id: 1,
          timestamp: new Date(),
          log_type: 'IN',
          created_by: 2,
          justification: 'Test',
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateClockLogStatus', () => {
    it('should update status and create audit log', async () => {
      const existing = { clock_logs_id: 456, clock_logs_status: 'orphan' as const, clock_logs_employee_id: 1, clock_logs_timestamp: new Date(), clock_logs_log_type: 'IN', clock_logs_remarks: null, clock_logs_source: 'manual', clock_logs_version: 1, clock_logs_import_session_id: null };
      const mockFind = jest.spyOn(prisma.vpg_clock_logs, 'findUnique').mockResolvedValue(existing as any);
      const mockUpdate = jest.spyOn(prisma.vpg_clock_logs, 'update').mockResolvedValue({ ...existing, clock_logs_status: 'corrected', clock_logs_remarks: 'Justification' } as any);
      const mockAudit = jest.spyOn(AuditLogsService, 'createAuditLog').mockResolvedValue(undefined as any);

      const service = new ClockLogsService();
      const result = await service.updateClockLogStatus({
        clockLogId: 456,
        newStatus: 'corrected',
        justification: 'Resolved manually',
        changed_by: 3,
      });

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { clock_logs_id: 456 },
        data: { clock_logs_status: 'corrected', clock_logs_remarks: 'Resolved manually' },
      });
      expect(mockAudit).toHaveBeenCalledWith({
        userId: 3,
        action: 'manual_correction',
        entity: 'clock_log',
        entityId: 456,
        details: expect.stringContaining('Changed status from orphan to corrected'),
      });
    });

    it('should throw if clock log not found', async () => {
      const mockFind = jest.spyOn(prisma.vpg_clock_logs, 'findUnique').mockResolvedValue(null);
      const service = new ClockLogsService();
      await expect(
        service.updateClockLogStatus({
          clockLogId: 999,
          newStatus: 'corrected',
          justification: 'Test',
          changed_by: 1,
        })
      ).rejects.toThrow('Marca no encontrada');
    });
  });
});
