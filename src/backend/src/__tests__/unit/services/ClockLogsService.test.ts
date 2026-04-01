import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogsService } from '../../../service/ClockLogsService';

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
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
  prisma.vpg_clock_logs.createMany.mockResolvedValue({ count: 0 });
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

    it('should map snake_case DB fields to camelCase output', async () => {
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
  });
});
