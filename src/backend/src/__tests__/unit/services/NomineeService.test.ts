import { PrismaClient, ShiftType, EmployeeShiftType, MinuteRoundingPolicy } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';

// Create mock instance
const mockPrisma = mockDeep<PrismaClient>();

// Mock the PrismaClient module
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock the lib/prisma module
jest.mock('../../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock services
jest.mock('../../../service/LegalParamService');
jest.mock('../../../service/EmployeeService');
jest.mock('../../../service/ClockLogEffectiveService');

// Import services AFTER mocks
import { NomineeService } from '../../../service/NomineeService';
import { LegalParamService } from '../../../service/LegalParamService';
import { EmployeeService } from '../../../service/EmployeeService';
import { ClockLogEffectiveService } from '../../../service/ClockLogEffectiveService';

describe('NomineeService', () => {
  let nomineeService: NomineeService;
  const startDate = new Date('2026-05-01T00:00:00.000Z');
  const endDate = new Date('2026-05-15T00:00:00.000Z');

  beforeEach(() => {
    nomineeService = new NomineeService();
    jest.clearAllMocks();

    // Default mocks for preloads to avoid empty results or crashes
    mockPrisma.vpg_vacations.findMany.mockResolvedValue([]);
    mockPrisma.vpg_employee_labor_event.findMany.mockResolvedValue([]);
    mockPrisma.vpg_bonuses.findMany.mockResolvedValue([]);
    mockPrisma.vpg_deductions_per_employee.findMany.mockResolvedValue([]);
    mockPrisma.vpg_positions.findMany.mockResolvedValue([]);
    mockPrisma.vpg_company_holidays.findMany.mockResolvedValue([]);
    mockPrisma.vpg_enterprise.findFirst.mockResolvedValue({
      enterprise_pay_unworked_holidays: true,
      enterprise_ordinary_shift_type: ShiftType.DIURNA,
      enterprise_minute_rounding_policy: MinuteRoundingPolicy.EXACT,
    } as any);

    jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(new Map());
    jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([]);
    jest.mocked(EmployeeService.getAllEmployees).mockResolvedValue([]);
    jest.mocked(LegalParamService.getParamSetAtDate).mockResolvedValue({
      regularHoursPerDay: 8,
      regularHoursPerWeek: 48,
      otFactor: 1.5,
      holidayMandatoryFactor: 2.0,
      holidayTripleFactor: 3.0,
      ccssObreroSalud: 5.5,
      ccssObrerosPension: 4.33,
      ccssObreroBP: 1.0,
      minuteRoundingPolicy: MinuteRoundingPolicy.EXACT,
      globalMinWageRate: 1529.62,
      workingDaysPerWeek: 6,
      weeklyRestNumerator: 8,
      weeklyRestDenominator: 104,
      weeklyRestMultiplier: 2,
      aguinaldoDivisor: 12,
    });
  });

  describe('resolveEffectiveShiftType', () => {
    it('should return enterprise shift type when employee shift type is USE_ENTERPRISE_DEFAULT', () => {
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, ShiftType.DIURNA)).toBe(ShiftType.DIURNA);
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, ShiftType.MIXTA)).toBe(ShiftType.MIXTA);
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, ShiftType.NOCTURNA)).toBe(ShiftType.NOCTURNA);
    });

    it('should return employee shift type when it is not USE_ENTERPRISE_DEFAULT', () => {
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.DIURNA, ShiftType.MIXTA)).toBe(ShiftType.DIURNA);
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.MIXTA, ShiftType.DIURNA)).toBe(ShiftType.MIXTA);
      expect(NomineeService.resolveEffectiveShiftType(EmployeeShiftType.NOCTURNA, ShiftType.DIURNA)).toBe(ShiftType.NOCTURNA);
    });
  });

  describe('calculatePayrollForPeriod - N+1 Optimization', () => {
    it('should call LegalParamService.getParamSetAtDate exactly 3 times (once per shift type)', async () => {
      // Act
      await nomineeService.calculatePayrollForPeriod(startDate, endDate);

      // Assert
      expect(LegalParamService.getParamSetAtDate).toHaveBeenCalledTimes(3);
      expect(LegalParamService.getParamSetAtDate).toHaveBeenCalledWith(startDate, ShiftType.DIURNA);
      expect(LegalParamService.getParamSetAtDate).toHaveBeenCalledWith(startDate, ShiftType.MIXTA);
      expect(LegalParamService.getParamSetAtDate).toHaveBeenCalledWith(startDate, ShiftType.NOCTURNA);
    });
  });

  describe('Payroll Calculation Scenarios (Shift Types)', () => {
    const mockLegalParam = (daily: number) => ({
      regularHoursPerDay: daily,
      regularHoursPerWeek: daily * 6,
      otFactor: 1.5,
      holidayMandatoryFactor: 2.0,
      holidayTripleFactor: 3.0,
      ccssObreroSalud: 0.055,
      ccssObrerosPension: 0.04,
      ccssObreroBP: 0.01,
      minuteRoundingPolicy: MinuteRoundingPolicy.EXACT,
      globalMinWageRate: 1529.62,
      workingDaysPerWeek: 6,
      weeklyRestNumerator: 8,
      weeklyRestDenominator: 104,
      weeklyRestMultiplier: 2,
      aguinaldoDivisor: 12,
    });

    beforeEach(() => {
      jest.mocked(LegalParamService.getParamSetAtDate).mockImplementation((date, type) => {
        if (type === ShiftType.NOCTURNA) return Promise.resolve(mockLegalParam(6));
        if (type === ShiftType.MIXTA) return Promise.resolve(mockLegalParam(7));
        return Promise.resolve(mockLegalParam(8));
      });

      mockPrisma.vpg_positions.findMany.mockResolvedValue([
        { position_id: 1, position_name: 'Worker', position_base_salary: new Decimal(1000) }
      ] as any);
    });

    const setupScenario = (employeeShift: EmployeeShiftType, workedHours: number) => {
      const employee = {
        id: 1,
        name: 'Test Employee',
        shift_type: employeeShift,
        position_id: 1,
        national_id: '123',
      };
      jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([employee] as any);

      // Mock clock logs: one day with the specified hours
      const effectiveMarks = new Map();
      const inDate = new Date(startDate);
      inDate.setUTCHours(8, 0, 0, 0);
      const outDate = new Date(startDate);
      outDate.setUTCHours(8 + workedHours, 0, 0, 0);

      effectiveMarks.set(1, [
        { timestamp: inDate, type: 'IN' },
        { timestamp: outDate, type: 'OUT' }
      ]);
      jest.mocked(ClockLogEffectiveService.getEffectiveMarksForAllEmployees).mockResolvedValue(effectiveMarks);
      jest.mocked(ClockLogEffectiveService.pairLogs).mockReturnValue([
        {
          status: 'valid',
          in: { effectiveTimestamp: inDate },
          out: { effectiveTimestamp: outDate }
        }
      ] as any);
    };

    it('Scenario 1: NOCTURNA shift and 7h worked produces 6h regular + 1h OT', async () => {
      setupScenario(EmployeeShiftType.NOCTURNA, 7);
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(6);
      expect(emp.overtimeHours).toBe(1);
    });

    it('Scenario 2: MIXTA shift and 7h worked produces 7h regular + 0h OT', async () => {
      setupScenario(EmployeeShiftType.MIXTA, 7);
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(7);
      expect(emp.overtimeHours).toBe(0);
    });

    it('Scenario 3: DIURNA shift and 7h worked produces 7h regular + 0h OT', async () => {
      setupScenario(EmployeeShiftType.DIURNA, 7);
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(7);
      expect(emp.overtimeHours).toBe(0);
    });

    it('Scenario 4: DIURNA shift and 9h worked produces 8h regular + 1h OT', async () => {
      setupScenario(EmployeeShiftType.DIURNA, 9);
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(8);
      expect(emp.overtimeHours).toBe(1);
    });

    it('Scenario 5: USE_ENTERPRISE_DEFAULT with enterprise MIXTA and 7h worked produces 7h regular + 0h OT', async () => {
      mockPrisma.vpg_enterprise.findFirst.mockResolvedValue({
        enterprise_pay_unworked_holidays: true,
        enterprise_ordinary_shift_type: ShiftType.MIXTA,
        enterprise_minute_rounding_policy: MinuteRoundingPolicy.EXACT,
      } as any);
      setupScenario(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, 7);
      
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(7);
      expect(emp.overtimeHours).toBe(0);
    });

    it('Scenario 6: Regression - DIURNA (default) produces same results as before', async () => {
      // Assuming "before" was always DIURNA with 8h cap
      setupScenario(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, 8);
      const result = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp = result.employees[0];
      expect(emp.regularHours).toBe(8);
      expect(emp.overtimeHours).toBe(0);

      setupScenario(EmployeeShiftType.USE_ENTERPRISE_DEFAULT, 10);
      const result2 = await nomineeService.calculatePayrollForPeriod(startDate, endDate);
      const emp2 = result2.employees[0];
      expect(emp2.regularHours).toBe(8);
      expect(emp2.overtimeHours).toBe(2);
    });
  });
});
