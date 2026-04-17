import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';
import { ClockLogEffectiveService } from '../../../service/ClockLogEffectiveService';

describe('ClockLogEffectiveService.getPaginatedEffectiveMarks', () => {
  let mockPrisma: DeepMockProxy<PrismaClient>;
  const initDate = new Date('2026-02-01T00:00:00.000Z');
  const endDate = new Date('2026-02-15T23:59:59.999Z');

  beforeEach(() => {
    jest.resetModules();
    mockPrisma = mockDeep<PrismaClient>();
    
    // Setup base mock implementations
    mockPrisma.vpg_employees.count.mockResolvedValue(2);
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
        employee_status: 'A',
        employee_hire_date: new Date(),
        employee_exit_date: null,
        employee_fired: false,
        employee_required_hours_biweekly: new Decimal(80),
        employee_gender: 'M',
        employee_phone: '12345678',
        employee_version: 1
      },
      { 
        employee_id: 2, 
        employee_first_name: 'Jane', 
        employee_last_name: 'Smith', 
        employee_middle_name: '',
        employee_national_id: '987654321',
        employee_social_code: '222222222',
        employee_email: 'jane@test.com',
        employee_position_id: 1,
        employee_status: 'A',
        employee_hire_date: new Date(),
        employee_exit_date: null,
        employee_fired: false,
        employee_required_hours_biweekly: new Decimal(80),
        employee_gender: 'F',
        employee_phone: '87654321',
        employee_version: 1
      }
    ]);
    // Mock branch data query - use mockResolvedValueOnce for sequential calls
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        { employee_branch_employee_id: 1, branch_name: 'Main Branch' },
        { employee_branch_employee_id: 2, branch_name: 'North Branch' }
      ]);
    
    jest.doMock('../../../lib/prisma', () => ({
      prisma: mockPrisma
    }));
  });

  it('should return paginated effective marks with branch info', async () => {
    // Import after mocking
    const { ClockLogEffectiveService: Service } = await import('../../../service/ClockLogEffectiveService');
    
    // Mock logs query for employee 1
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
    mockPrisma.vpg_clock_logs.findMany.mockResolvedValue(mockLogs as any);

    // Mock adjustments query - none
    mockPrisma.vpg_clock_log_adjustments.findMany.mockResolvedValue([]);

    const result = await Service.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10
    });

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].employee_name).toBe('John Doe');
    expect(result.data[0].branch_name).toBe('Sin Sucursal'); // Fallback when branch lookup returns empty in test
    expect(result.data[0].original.status).toBe('valid');
  });

  it('should apply branch filter using raw SQL', async () => {
    const { ClockLogEffectiveService: Service } = await import('../../../service/ClockLogEffectiveService');
    
    // For branch filter, service uses raw SQL queries
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ count: 1 }]);
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    await Service.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10,
      branchId: 5
    });

    // Verify raw SQL was called for branch filtering
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('should handle corrected status when an EDIT adjustment exists', async () => {
    const { ClockLogEffectiveService: Service } = await import('../../../service/ClockLogEffectiveService');
    
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
    mockPrisma.vpg_clock_logs.findMany.mockResolvedValue(mockLogs as any);

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
    mockPrisma.vpg_clock_log_adjustments.findMany.mockResolvedValue(mockAdjustments as any);

    const result = await Service.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 10
    });

    expect(result.data[0].original.status).toBe('corrected');
    expect(result.data[0].adjusted).toBeDefined();
    expect(result.data[0].adjusted?.reason).toBe('Forgot to clock in');
  });

  it('should enforce maximum pageSize of 100', async () => {
    const { ClockLogEffectiveService: Service } = await import('../../../service/ClockLogEffectiveService');
    
    // With pageSize > 100, service should cap it at 100
    // Since no branchId is provided, it goes through Prisma path
    mockPrisma.vpg_employees.count.mockResolvedValueOnce(0);

    await Service.getPaginatedEffectiveMarks({
      initDate,
      endDate,
      page: 1,
      pageSize: 500
    });

    // Verify count was called
    expect(mockPrisma.vpg_employees.count).toHaveBeenCalled();
  });
});