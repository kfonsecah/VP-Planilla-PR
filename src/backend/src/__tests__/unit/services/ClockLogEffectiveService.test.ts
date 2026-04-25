import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogEffectiveService } from '../../../service/ClockLogEffectiveService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('ClockLogEffectiveService', () => {
  const employeeId = 101;
  const startDate = new Date('2026-02-01T00:00:00.000Z');
  const endDate = new Date('2026-02-28T23:59:59.999Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEffectiveLogs', () => {
    it('should return original logs when no adjustments exist', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T17:00:00.000Z'),
          clock_logs_log_type: 'OUT',
          clock_logs_source: 'java_import',
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue([]);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].effectiveTimestamp).toEqual(logs[0].clock_logs_timestamp);
      expect(result[0].adjustmentType).toBe('NONE');
      expect(result[1].effectiveTimestamp).toEqual(logs[1].clock_logs_timestamp);
      expect(result[1].adjustmentType).toBe('NONE');
    });

    it('should apply EDIT adjustment to logs', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T08:15:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
      ];

      const adjustments = [
        {
          adjustment_id: 1,
          adjustment_clock_log_id: 1,
          adjustment_type: 'EDIT',
          adjustment_new_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date(),
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(adjustments as any);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].originalTimestamp).toEqual(logs[0].clock_logs_timestamp);
      expect(result[0].effectiveTimestamp).toEqual(adjustments[0].adjustment_new_timestamp);
      expect(result[0].adjustmentType).toBe('EDIT');
    });

    it('should adjust logType when adjustment_log_type is present', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
      ];

      const adjustments = [
        {
          adjustment_id: 1,
          adjustment_clock_log_id: 1,
          adjustment_type: 'EDIT',
          adjustment_new_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          adjustment_log_type: 'OUT',
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date(),
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(adjustments as any);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].logType).toBe('OUT'); // Changed from IN to OUT
    });

    it('should filter out VOIDed logs', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
      ];

      const adjustments = [
        {
          adjustment_id: 1,
          adjustment_clock_log_id: 1,
          adjustment_type: 'VOID',
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date(),
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(adjustments as any);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(0);
    });

    it('should pick the latest ACTIVE adjustment per log', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T08:15:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
      ];

      const adjustments = [
        {
          adjustment_id: 2,
          adjustment_clock_log_id: 1,
          adjustment_type: 'EDIT',
          adjustment_new_timestamp: new Date('2026-02-02T08:05:00.000Z'),
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date('2026-03-02T10:00:00.000Z'), // Latest
        },
        {
          adjustment_id: 1,
          adjustment_clock_log_id: 1,
          adjustment_type: 'EDIT',
          adjustment_new_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date('2026-03-01T10:00:00.000Z'),
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(adjustments as any);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].effectiveTimestamp).toEqual(adjustments[0].adjustment_new_timestamp);
    });

    it('should include manual ADD logs (source=manual) correctly', async () => {
      const logs = [
        {
          clock_logs_id: 10,
          clock_logs_employee_id: employeeId,
          clock_logs_timestamp: new Date('2026-02-02T09:00:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'manual', // ADD log
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue([]);

      const result = await ClockLogEffectiveService.getEffectiveLogs(employeeId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('manual');
      expect(result[0].adjustmentType).toBe('NONE');
    });
  });

  describe('getEffectiveMarksForAllEmployees', () => {
    it('should group effective marks by employee ID', async () => {
      const logs = [
        {
          clock_logs_id: 1,
          clock_logs_employee_id: 101,
          clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
        {
          clock_logs_id: 2,
          clock_logs_employee_id: 102,
          clock_logs_timestamp: new Date('2026-02-02T08:30:00.000Z'),
          clock_logs_log_type: 'IN',
          clock_logs_source: 'java_import',
        },
      ];

      const adjustments = [
        {
          adjustment_id: 1,
          adjustment_clock_log_id: 2,
          adjustment_type: 'EDIT',
          adjustment_new_timestamp: new Date('2026-02-02T08:15:00.000Z'),
          adjustment_status: 'ACTIVE',
          adjustment_created_at: new Date(),
        },
      ];

      prisma.vpg_clock_logs.findMany.mockResolvedValue(logs as any);
      prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(adjustments as any);

      const result = await ClockLogEffectiveService.getEffectiveMarksForAllEmployees(startDate, endDate);

      expect(result.size).toBe(2);
      expect(result.get(101)).toHaveLength(1);
      expect(result.get(101)![0].adjustmentType).toBe('NONE');
      
      expect(result.get(102)).toHaveLength(1);
      expect(result.get(102)![0].adjustmentType).toBe('EDIT');
      expect(result.get(102)![0].effectiveTimestamp).toEqual(adjustments[0].adjustment_new_timestamp);
    });

    it('should return an empty map if no logs found', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([]);

      const result = await ClockLogEffectiveService.getEffectiveMarksForAllEmployees(startDate, endDate);

      expect(result.size).toBe(0);
    });
  });
});
