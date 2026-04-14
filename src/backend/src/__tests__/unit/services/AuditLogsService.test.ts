import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { AuditLogsService } from '../../../service/AuditLogsService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockAuditLogRow = {
  audit_logs_id: 1,
  audit_logs_user_id: 1,
  audit_logs_action: 'CREATE',
  audit_logs_entity: 'vpg_employees',
  audit_logs_entity_id: 5,
  audit_logs_timestamp: new Date('2026-01-01'),
  audit_logs_details: '{"field":"value"}',
  vpg_users: {
    user_id: 1,
    user_username: 'admin',
    user_email: 'admin@vp.com',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_audit_logs.findMany.mockResolvedValue([]);
  prisma.vpg_audit_logs.count.mockResolvedValue(0);
  prisma.vpg_audit_logs.create.mockResolvedValue({ audit_logs_id: 1 } as any);
  prisma.vpg_audit_logs.findUnique.mockResolvedValue(null);
});

describe('AuditLogsService', () => {
  describe('getAuditLogs', () => {
    it('returns { data: [], total: 0, limit: 100, offset: 0 } with no filters', async () => {
      const result = await AuditLogsService.getAuditLogs();

      expect(result).toEqual({ data: [], total: 0, limit: 100, offset: 0 });
    });

    it('maps returned rows to the expected shape', async () => {
      prisma.vpg_audit_logs.findMany.mockResolvedValue([mockAuditLogRow] as any);
      prisma.vpg_audit_logs.count.mockResolvedValue(1);

      const result = await AuditLogsService.getAuditLogs();

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 1,
        user_id: 1,
        username: 'admin',
        user_email: 'admin@vp.com',
        action: 'CREATE',
        entity: 'vpg_employees',
        entity_id: 5,
        timestamp: new Date('2026-01-01'),
        details: '{"field":"value"}',
      });
    });

    it('passes userId filter to where clause', async () => {
      await AuditLogsService.getAuditLogs({ userId: 42 });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({ audit_logs_user_id: 42 }),
      );
    });

    it('passes action filter with contains/insensitive to where clause', async () => {
      await AuditLogsService.getAuditLogs({ action: 'create' });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({
          audit_logs_action: { contains: 'create', mode: 'insensitive' },
        }),
      );
    });

    it('passes entity filter with contains/insensitive to where clause', async () => {
      await AuditLogsService.getAuditLogs({ entity: 'employees' });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({
          audit_logs_entity: { contains: 'employees', mode: 'insensitive' },
        }),
      );
    });

    it('passes startDate filter as gte on audit_logs_timestamp', async () => {
      const startDate = new Date('2026-01-01');
      await AuditLogsService.getAuditLogs({ startDate });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({
          audit_logs_timestamp: { gte: startDate },
        }),
      );
    });

    it('passes endDate filter as lte on audit_logs_timestamp', async () => {
      const endDate = new Date('2026-03-31');
      await AuditLogsService.getAuditLogs({ endDate });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({
          audit_logs_timestamp: { lte: endDate },
        }),
      );
    });

    it('passes both startDate and endDate as gte/lte on audit_logs_timestamp', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-03-31');
      await AuditLogsService.getAuditLogs({ startDate, endDate });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].where).toEqual(
        expect.objectContaining({
          audit_logs_timestamp: { gte: startDate, lte: endDate },
        }),
      );
    });

    it('passes custom limit and offset as take/skip to findMany', async () => {
      await AuditLogsService.getAuditLogs({ limit: 25, offset: 50 });

      const call = prisma.vpg_audit_logs.findMany.mock.lastCall;
      expect(call[0].take).toBe(25);
      expect(call[0].skip).toBe(50);
    });

    it('returns limit and offset from filters in the result', async () => {
      const result = await AuditLogsService.getAuditLogs({ limit: 25, offset: 50 });
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(50);
    });

    it('propagates DB errors', async () => {
      prisma.vpg_audit_logs.findMany.mockRejectedValue(new Error('DB error'));

      await expect(AuditLogsService.getAuditLogs()).rejects.toThrow('DB error');
    });
  });

  describe('createAuditLog', () => {
    it('creates an audit log with correct fields', async () => {
      await AuditLogsService.createAuditLog({
        userId: 1,
        action: 'CREATE',
        entity: 'vpg_employees',
        entityId: 5,
        details: '{"field":"value"}',
      });

      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            audit_logs_user_id: 1,
            audit_logs_action: 'CREATE',
            audit_logs_entity: 'vpg_employees',
            audit_logs_entity_id: 5,
            audit_logs_details: '{"field":"value"}',
          }),
        }),
      );
    });

    it('sets audit_logs_details to null when details is not provided', async () => {
      await AuditLogsService.createAuditLog({
        userId: 1,
        action: 'test',
        entity: 'test',
        entityId: 1
      });

      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            audit_logs_details: null
          })
        })
      );
    });

    it('uses the provided transaction client when tx is passed', async () => {
      const mockTx = {
        vpg_audit_logs: {
          create: jest.fn().mockResolvedValue({})
        }
      };

      await AuditLogsService.createAuditLog({
        userId: 1,
        action: 'tx_test',
        entity: 'tx_entity',
        entityId: 100
      }, mockTx);

      expect(mockTx.vpg_audit_logs.create).toHaveBeenCalled();
      expect(prisma.vpg_audit_logs.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            audit_logs_action: 'tx_test'
          })
        })
      );
    });
    });

  describe('getAuditLogById', () => {
    it('returns the mapped audit log when found', async () => {
      prisma.vpg_audit_logs.findUnique.mockResolvedValue(mockAuditLogRow as any);

      const result = await AuditLogsService.getAuditLogById(1);

      expect(result).toEqual({
        id: 1,
        user_id: 1,
        username: 'admin',
        user_email: 'admin@vp.com',
        action: 'CREATE',
        entity: 'vpg_employees',
        entity_id: 5,
        timestamp: new Date('2026-01-01'),
        details: '{"field":"value"}',
      });
    });

    it('returns null when the audit log is not found', async () => {
      prisma.vpg_audit_logs.findUnique.mockResolvedValue(null);

      const result = await AuditLogsService.getAuditLogById(999);

      expect(result).toBeNull();
    });

    it('propagates DB errors', async () => {
      prisma.vpg_audit_logs.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(AuditLogsService.getAuditLogById(1)).rejects.toThrow('DB error');
    });

    it('calls findUnique with include for vpg_users with correct select fields', async () => {
      await AuditLogsService.getAuditLogById(1);

      expect(prisma.vpg_audit_logs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { audit_logs_id: 1 },
          include: {
            vpg_users: {
              select: {
                user_id: true,
                user_username: true,
                user_email: true,
              },
            },
          },
        }),
      );
    });
  });
});
