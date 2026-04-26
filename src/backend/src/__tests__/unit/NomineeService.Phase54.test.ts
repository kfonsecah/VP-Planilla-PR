import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { NomineeService } from '../../service/NomineeService';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('../../service/EmployeeService');
jest.mock('../../service/ClockLogEffectiveService');

const { EmployeeService } = require('../../service/EmployeeService');
const { ClockLogEffectiveService } = require('../../service/ClockLogEffectiveService');
const { prisma } = require('../../lib/prisma');

const service = new NomineeService();

describe('NomineeService Phase 54 — PAY-11 & PAY-13', () => {
  const startDate = new Date('2026-02-01T00:00:00Z');
  const endDate = new Date('2026-02-15T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    jest.mocked(EmployeeService.getAllEmployees).mockResolvedValue([
      { id: 1, name: 'Employee 1', national_id: '1', position_id: 1 },
      { id: 2, name: 'Employee 2', national_id: '2', position_id: 1 },
    ]);
    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([
      { id: 1, name: 'Employee 1', national_id: '1', position_id: 1 },
    ]);
    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map());
    prisma.vpg_vacations.findMany.mockResolvedValue([]);
    prisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
    prisma.vpg_bonuses.findMany.mockResolvedValue([]);
    prisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
    prisma.vpg_positions.findMany.mockResolvedValue([{
        position_id: 1,
        position_base_salary: 1000,
        position_name: 'Test',
        position_version: 1
    }]);
    prisma.vpg_company_holidays.findMany.mockResolvedValue([]);
  });

  it('PAY-13: should filter employees by selectedEmployeeIds when provided', async () => {
    const selectedIds = [2];
    const result = await service.calculatePayrollForPeriod(startDate, endDate, undefined, selectedIds);

    expect(EmployeeService.getAllEmployees).toHaveBeenCalled();
    expect(result.summary.employeesProcessed).toBe(1);
    expect(result.employees[0].employeeId).toBe('2');
  });

  it('PAY-11: should use ClockLogEffectiveService to get effective marks', async () => {
    const effectiveMarksMap = new Map();
    effectiveMarksMap.set(1, [
      {
        id: 101,
        employeeId: 1,
        effectiveTimestamp: new Date('2026-02-02T08:00:00Z'),
        logType: 'IN',
      },
      {
        id: 102,
        employeeId: 1,
        effectiveTimestamp: new Date('2026-02-02T16:00:00Z'),
        logType: 'OUT',
      }
    ]);

    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(effectiveMarksMap);

    await service.calculatePayrollForPeriod(startDate, endDate);

    expect(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).toHaveBeenCalledWith(startDate, endDate);
  });
});
