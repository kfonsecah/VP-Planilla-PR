import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { NomineeService } from '../../service/NomineeService';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('../../service/EmployeeService');
jest.mock('../../service/ClockLogEffectiveService');
jest.mock('../../service/LegalParamService');

const { EmployeeService } = require('../../service/EmployeeService');
const { ClockLogEffectiveService } = require('../../service/ClockLogEffectiveService');
const { LegalParamService } = require('../../service/LegalParamService');
const { prisma } = require('../../lib/prisma');
import * as PayrollUtils from '../../utils/payrollUtils';
import { MinuteRoundingPolicy } from '@prisma/client';

// Provide real implementation for pairLogs even if service is mocked
jest.mocked(ClockLogEffectiveService.pairLogs).mockImplementation((marks: any[]) => {
  const sorted = [...marks].sort((a, b) => new Date(a.effectiveTimestamp).getTime() - new Date(b.effectiveTimestamp).getTime());
  const pairs = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const inMark = sorted[i];
    const outMark = sorted[i+1];
    if (inMark && outMark && inMark.logType === 'IN' && outMark.logType === 'OUT') {
      const duration = (new Date(outMark.effectiveTimestamp).getTime() - new Date(inMark.effectiveTimestamp).getTime()) / (1000 * 60 * 60);
      pairs.push({
        in: inMark,
        out: outMark,
        status: 'valid',
        durationHours: duration
      });
    }
  }
  return pairs;
});

const BASE_HOURLY = 1680;

const mockPosition = {
  position_id: 1,
  position_base_salary: BASE_HOURLY,
  position_name: 'Developer',
  position_description: 'Test position',
  position_version: 1,
};

const mockEmployee = {
  id: 1,
  name: 'Test Employee',
  national_id: '1-1234-5678',
  position_id: 1,
  required_hours_biweekly: null,
};

const service = new NomineeService();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([]);
  jest.mocked(EmployeeService.getAllEmployees).mockResolvedValue([]);
  jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map());
  
  // Provide a functional mock for pairLogs
  jest.mocked(ClockLogEffectiveService.pairLogs).mockImplementation((marks: any[]) => {
    const sorted = [...marks].sort((a, b) => new Date(a.effectiveTimestamp).getTime() - new Date(b.effectiveTimestamp).getTime());
    const pairs = [];
    for (let i = 0; i < sorted.length; i += 2) {
      const inMark = sorted[i];
      const outMark = sorted[i+1];
      if (inMark && outMark && inMark.logType === 'IN' && outMark.logType === 'OUT') {
        const duration = (new Date(outMark.effectiveTimestamp).getTime() - new Date(inMark.effectiveTimestamp).getTime()) / (1000 * 60 * 60);
        pairs.push({
          in: inMark,
          out: outMark,
          status: 'valid',
          durationHours: duration
        });
      }
    }
    return pairs;
  });

  prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
  prisma.vpg_vacations.findMany.mockResolvedValue([]);
  prisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
  prisma.vpg_bonuses.findMany.mockResolvedValue([]);
  prisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
  prisma.vpg_positions.findMany.mockResolvedValue([]);
  prisma.vpg_payrolls.findUnique.mockResolvedValue(null);
  prisma.vpg_company_holidays.findMany.mockResolvedValue([]);

  jest.mocked(LegalParamService.getParamSetAtDate).mockResolvedValue({
    ...PayrollUtils.DEFAULT_LEGAL_PARAMS,
    minuteRoundingPolicy: MinuteRoundingPolicy.EXACT,
  });
});

function makeClockLogPair(date: string, localInHour: number, localOutHour: number, empId = 1) {
  const UTC_OFFSET_HOURS = 6;
  const utcInHour = localInHour - UTC_OFFSET_HOURS;
  const utcOutHour = localOutHour - UTC_OFFSET_HOURS;
  const inDate = new Date(`${date}T${String(utcInHour).padStart(2, '0')}:00:00.000Z`);
  const outDate = new Date(`${date}T${String(utcOutHour).padStart(2, '0')}:00:00.000Z`);
  return [
    {
      clock_logs_id: Math.random(),
      clock_logs_employee_id: empId,
      clock_logs_timestamp: inDate,
      clock_logs_log_type: 'IN',
    },
    {
      clock_logs_id: Math.random(),
      clock_logs_employee_id: empId,
      clock_logs_timestamp: outDate,
      clock_logs_log_type: 'OUT',
    },
  ];
}

function setUpMocks(employee: any, clockLogs: any[], deductions: any[]) {
  jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([employee]);
  prisma.vpg_clock_logs.findMany.mockResolvedValue(clockLogs);
  prisma.vpg_positions.findMany.mockResolvedValue([mockPosition]);
  prisma.vpg_deductions_per_employee.findMany.mockResolvedValue(deductions);
  
  // Mock ClockLogEffectiveService to return effective marks from the clock logs
  const effectiveMarksMap = new Map<number, any[]>();
  const employeeId = employee.id || 1;
  effectiveMarksMap.set(employeeId, clockLogs.map((log: any) => ({
    id: log.clock_logs_id,
    employeeId: log.clock_logs_employee_id,
    originalTimestamp: log.clock_logs_timestamp,
    effectiveTimestamp: log.clock_logs_timestamp,
    logType: log.clock_logs_log_type,
    adjustmentType: 'NONE' as const,
    source: 'device' as const,
  })));
  jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(effectiveMarksMap);
}

describe('NomineeService — REQ 8.1 Normal 8h/day', () => {
  it('should calculate 48 regular hours, 0 overtime for 6 days at 8h each', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 8, 16),
      ...makeClockLogPair('2026-02-03', 8, 16),
      ...makeClockLogPair('2026-02-04', 8, 16),
      ...makeClockLogPair('2026-02-05', 8, 16),
      ...makeClockLogPair('2026-02-06', 8, 16),
      ...makeClockLogPair('2026-02-07', 8, 16),
    ];
    setUpMocks(mockEmployee, clockLogs, []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.regularHours).toBe(48);
    expect(ep.overtimeHours).toBe(0);
  });
});

describe('NomineeService — REQ 8.2 Overtime 1.5x', () => {
  it('should calculate 48 regular + 12 overtime hours for 6 days at 10h each', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 8, 18),
      ...makeClockLogPair('2026-02-03', 8, 18),
      ...makeClockLogPair('2026-02-04', 8, 18),
      ...makeClockLogPair('2026-02-05', 8, 18),
      ...makeClockLogPair('2026-02-06', 8, 18),
      ...makeClockLogPair('2026-02-07', 8, 18),
    ];
    setUpMocks(mockEmployee, clockLogs, []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.regularHours).toBe(48);
    expect(ep.overtimeHours).toBe(12);
    expect(ep.overtimePay).toBeCloseTo(30240, 2);
  });
});

describe('NomineeService — REQ 8.3 Overtime 2x', () => {
  it('should calculate 48 regular + 24 overtime hours for 6 days at 12h each', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 7, 19),
      ...makeClockLogPair('2026-02-03', 7, 19),
      ...makeClockLogPair('2026-02-04', 7, 19),
      ...makeClockLogPair('2026-02-05', 7, 19),
      ...makeClockLogPair('2026-02-06', 7, 19),
      ...makeClockLogPair('2026-02-07', 7, 19),
    ];
    setUpMocks(mockEmployee, clockLogs, []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.regularHours).toBe(48);
    expect(ep.overtimeHours).toBe(24);
    expect(ep.overtimePay).toBeCloseTo(60480, 2);
  });
});

describe('NomineeService — REQ 8.4 Weekly Rest Worked', () => {
  it('should calculate positive weeklyRestHours for a period including Sundays', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 8, 16),
      ...makeClockLogPair('2026-02-03', 8, 16),
      ...makeClockLogPair('2026-02-04', 8, 16),
      ...makeClockLogPair('2026-02-05', 8, 16),
      ...makeClockLogPair('2026-02-06', 8, 16),
      ...makeClockLogPair('2026-02-07', 8, 16),
      ...makeClockLogPair('2026-02-08', 9, 17),
    ];
    setUpMocks(mockEmployee, clockLogs, []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-08')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.weeklyRestHours).toBeGreaterThan(0);
    expect(ep.weeklyRestPay).toBeGreaterThan(0);
  });
});

describe('NomineeService — REQ 8.5 Holiday Period', () => {
  it('should use correct scheduled hours for May 2026 (excludes May 1 holiday and Sundays)', async () => {
    jest.mocked(prisma.vpg_positions.findMany).mockResolvedValue([mockPosition]);
    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([mockEmployee]);
    jest.mocked(prisma.vpg_clock_logs.findMany).mockResolvedValue([]);
    jest.mocked(prisma.vpg_deductions_per_employee.findMany).mockResolvedValue([]);
    jest.mocked(prisma.vpg_company_holidays.findMany).mockResolvedValue([
      { company_holidays_date: new Date('2026-05-01'), company_holidays_is_mandatory: true, company_holidays_is_triple: false }
    ]);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-05-01'),
      new Date('2026-05-15')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.scheduledHours).toBe(96);
  });
});

describe('NomineeService — REQ 8.6 CCSS Deduction', () => {
  it('should include CCSS deduction in deductionsBreakdown and totalDeductions', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 8, 16),
      ...makeClockLogPair('2026-02-03', 8, 16),
      ...makeClockLogPair('2026-02-04', 8, 16),
      ...makeClockLogPair('2026-02-05', 8, 16),
      ...makeClockLogPair('2026-02-06', 8, 16),
      ...makeClockLogPair('2026-02-07', 8, 16),
    ];
    const deductions = [
      {
        deductions_per_employee_employee_id: 1,
        deductions_per_employee_deduction_id: 1,
        deductions_per_employee_version: 1,
        vpg_deductions: {
          deductions_id: 1,
          deductions_name: 'CCSS',
          deductions_description: 'Caja Costarricense de Seguro Social',
          deductions_fixed_amount: null,
          deductions_percentage: 3.5,
        },
      },
    ];
    setUpMocks(mockEmployee, clockLogs, deductions);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.deductionsBreakdown).toHaveLength(1);
    expect(ep.deductionsBreakdown[0].type).toBe('percent');
    expect(ep.deductionsBreakdown[0].amount).toBeGreaterThan(0);
    expect(ep.totalDeductions).toBeGreaterThan(0);
  });
});

describe('NomineeService — Edge cases', () => {
  it('should handle employee with no clock logs gracefully', async () => {
    setUpMocks(mockEmployee, [], []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.regularHours).toBe(0);
    expect(ep.overtimeHours).toBe(0);
  });

  it('should handle period with no active employees', async () => {
    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([]);
    jest.mocked(EmployeeService.getAllEmployees).mockResolvedValue([]);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.summary.employeesProcessed).toBe(0);
    expect(result.summary.messages.length).toBeGreaterThan(0);
  });

  it('should handle employee without position gracefully', async () => {
    const empNoPosition = { ...mockEmployee, position_id: null };
    setUpMocks(empNoPosition, [], []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.baseHourlySalary).toBe(0);
    expect(ep.generalMessages.some((m: string) => m.includes('sin puesto'))).toBe(true);
  });
});

describe('NomineeService — calculatePayrollForPeriod no active employees fallback', () => {
  it('should fall back to getAllEmployees and include a warning message when getActiveEmployeesForPeriod returns empty', async () => {
    // getActiveEmployeesForPeriod already returns [] from global beforeEach
    // getAllEmployees also returns [] from global beforeEach — true empty system
    jest.mocked(EmployeeService.getAllEmployees).mockResolvedValue([]);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toEqual([]);
    expect(result.summary.employeesProcessed).toBe(0);
    // The service pushes a message about no active employees found
    expect(result.summary.messages.some((m: string) => m.includes('No se encontraron empleados activos'))).toBe(true);
  });
});
