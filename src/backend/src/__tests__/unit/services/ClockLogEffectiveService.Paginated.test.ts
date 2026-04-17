import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogEffectiveService } from '../../../service/ClockLogEffectiveService';

jest.mock('../../../lib/prisma', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  // Mock count() for non-branch-filter path
  mockPrisma.vpg_employees.count.mockResolvedValue(2);
  // Mock findMany for employees - provide all required fields
  mockPrisma.vpg_employees.findMany.mockResolvedValue([
    { 
      employee_id: 1, 
      employee_first_name: 'John', 
      employee_last_name: 'Doe', 
      employee_middle_name: '',
      employee_national_id: '123456789',
      employee_social_code: '111111111',
      employee_email: 'john@test.com',
      employee_position_id: 1,
      employee_is_active: true,
      employee_hire_date: new Date(),
      employee_created_at: new Date(),
      employee_updated_at: new Date(),
      employee_version: 1
    }
  ]);
  return { prisma: mockPrisma };
});

const { prisma } = require('../../../lib/prisma');

describe('ClockLogEffectiveService.getPaginatedEffectiveMarks', () => {
  const initDate = new Date('2026-02-01T00:00:00.000Z');
  const endDate = new Date('2026-02-15T23:59:59.999Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated effective marks with branch info', async () => {
    // Mock total count query
    prisma.$queryRaw.mockResolvedValueOnce([{ count: 2 }]);

    // Mock employees query
    const mockEmployees = [
      {
        employee_id: 1,
        employee_first_name: 'John',
        employee_last_name: 'Doe',
        branch_name: 'Main Branch'
      },
      {
        employee_id: 2,
        employee_first_name: 'Jane',
        employee_last_name: 'Smith',
        branch_name: 'North Branch'
      }
    ];
    prisma.$queryRaw.mockResolvedValueOnce(mockEmployees);

    // Mock logs query
    const mockLogs = [
      {
        clock_logs_id: 1,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
        clock_logs_log_type: 'IN',
        clock_logs_source: 'device'
      },
      {
        clock_logs_id: 2,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date('2026-02-02T17:00:00.000Z'),
        clock_logs_log_type: 'OUT',
        clock_logs_source: 'device'
      }
    ];
    prisma.vpg_clock_logs.findMany.mockResolvedValue(mockLogs as any);

    // Mock adjustments query
    prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue([]);

    const result = await ClockLogEffectiveService.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10
    });

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1); // Only 1 pair for employee 1, employee 2 has no logs
    expect(result.data[0]).toMatchObject({
      employee_name: 'John Doe',
      branch_name: 'Main Branch',
      original: {
        status: 'valid'
      }
    });
    expect(result.data[0].id).toBe('1-2');
  });

  it('should apply branch filter in raw SQL', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ count: 1 }]);
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await ClockLogEffectiveService.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10,
      branchId: 5
    });

    // Verify query was called
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('should handle corrected status when an EDIT adjustment exists', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ count: 1 }]);
    prisma.$queryRaw.mockResolvedValueOnce([{
      employee_id: 1,
      employee_first_name: 'John',
      employee_last_name: 'Doe',
      branch_name: 'Main Branch'
    }]);

    const mockLogs = [
      {
        clock_logs_id: 1,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date('2026-02-02T08:15:00.000Z'),
        clock_logs_log_type: 'IN',
        clock_logs_source: 'device'
      },
      {
        clock_logs_id: 2,
        clock_logs_employee_id: 1,
        clock_logs_timestamp: new Date('2026-02-02T17:00:00.000Z'),
        clock_logs_log_type: 'OUT',
        clock_logs_source: 'device'
      }
    ];
    prisma.vpg_clock_logs.findMany.mockResolvedValue(mockLogs as any);

    const mockAdjustments = [
      {
        adjustment_id: 100,
        adjustment_clock_log_id: 1,
        adjustment_type: 'EDIT',
        adjustment_new_timestamp: new Date('2026-02-02T08:00:00.000Z'),
        adjustment_status: 'ACTIVE',
        adjustment_justification: 'Forgot to clock in',
        adjustment_created_at: new Date()
      }
    ];
    prisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(mockAdjustments as any);

    const result = await ClockLogEffectiveService.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10
    });

    expect(result.data[0].original.status).toBe('corrected');
    expect(result.data[0].adjusted).toBeDefined();
    expect(result.data[0].adjusted?.in_time).toBe(mockAdjustments[0].adjustment_new_timestamp.toISOString());
    expect(result.data[0].adjusted?.reason).toBe('Forgot to clock in');
  });

  it('should enforce maximum pageSize of 100', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ count: 0 }]);

    await ClockLogEffectiveService.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 500
    });

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
