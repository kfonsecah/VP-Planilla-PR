import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { IntegrityService } from '../../../service/IntegrityService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('IntegrityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.vpg_employees.findMany.mockResolvedValue([]);
    prisma.vpg_positions.findMany.mockResolvedValue([]);
    prisma.vpg_payroll_employee.findMany.mockResolvedValue([]);
    prisma.vpg_payrolls.findMany.mockResolvedValue([]);
    prisma.vpg_clock_logs.count.mockResolvedValue(0);
    prisma.vpg_clock_logs.findMany.mockResolvedValue([]);
  });

  describe('runAudit', () => {
    it('should detect EMP-001: Missing National ID', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([
        { employee_id: 1, employee_first_name: 'Juan', employee_national_id: '' }
      ]);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'EMP-001');
      
      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
      expect(alert?.sampleIds).toContain(1);
      expect(prisma.vpg_employees.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { employee_national_id: '' }
      }));
    });

    it('should detect EMP-002: Invalid ID Format', async () => {
      prisma.vpg_employees.findMany.mockImplementation((params: any) => {
        if (params.where?.employee_national_id === '') return Promise.resolve([]);
        return Promise.resolve([
          { employee_id: 2, employee_national_id: '123' } // Invalid format
        ]);
      });

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'EMP-002');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
      expect(alert?.sampleIds).toContain(2);
    });

    it('should detect POS-001: Missing INS Metadata', async () => {
      prisma.vpg_positions.findMany.mockResolvedValue([
        { position_id: 10, position_name: 'Dev', position_occupation_code: '', position_risk_class: '' }
      ]);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'POS-001');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
      expect(prisma.vpg_positions.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          OR: [
            { position_occupation_code: null },
            { position_occupation_code: '' },
            { position_risk_class: null },
            { position_risk_class: '' }
          ]
        }
      }));
    });

    it('should detect PAY-001: Calculation Drift', async () => {
      prisma.vpg_payroll_employee.findMany.mockResolvedValue([
        {
          payroll_employee_id: 100,
          payroll_employee_gross_salary: 1000.05,
          payroll_employee_overtime_pay: 500,
          payroll_employee_weekly_rest_pay: 200,
          payroll_employee_bonuses: 300.07 // Total = 1000.07 -> drift 0.02 > 0.01
        }
      ]);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'PAY-001');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
    });

    it('should not detect PAY-001 if drift is within tolerance (0.01)', async () => {
      prisma.vpg_payroll_employee.findMany.mockResolvedValue([
        {
          payroll_employee_id: 101,
          payroll_employee_gross_salary: 1000.00,
          payroll_employee_overtime_pay: 500,
          payroll_employee_weekly_rest_pay: 200,
          payroll_employee_bonuses: 300.005 // Drift 0.005 < 0.01
        }
      ]);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'PAY-001');

      expect(alert?.affectedCount || 0).toBe(0);
    });

    it('should detect PAY-002: Missing Snapshots', async () => {
      prisma.vpg_payrolls.findMany.mockResolvedValue([
        { payrolls_id: 50 }
      ]);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'PAY-002');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
      expect(prisma.vpg_payrolls.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          payrolls_status: { in: ['APROBADA', 'PAGADA'] },
          vpgPayrollParamSnapshots: { none: {} }
        }
      }));
    });

    it('should detect CLK-001: Orphan Marks', async () => {
      prisma.vpg_clock_logs.count.mockResolvedValue(5);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'CLK-001');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(5);
      expect(prisma.vpg_clock_logs.count).toHaveBeenCalledWith({
        where: { clock_logs_status: 'orphan' }
      });
    });

    it('should detect CLK-002: Open Sessions (> 16 hours)', async () => {
      prisma.vpg_clock_logs.findMany.mockResolvedValue([
        { clock_logs_id: 500, clock_logs_employee_id: 1, clock_logs_timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000) }
      ]);
      // Mock search for following OUT mark
      prisma.vpg_clock_logs.findFirst.mockResolvedValue(null);

      const result = await IntegrityService.runAudit();
      const alert = result.find(a => a.code === 'CLK-002');

      expect(alert).toBeDefined();
      expect(alert?.affectedCount).toBe(1);
    });
  });

  describe('getDashboardStatus', () => {
    it('should return health score and summary', async () => {
      // Mock runAudit indirectly by mocking prisma to return some data
      prisma.vpg_employees.findMany.mockResolvedValue([
        { employee_id: 1, employee_first_name: 'Juan', employee_national_id: '' } // EMP-001
      ]);
      prisma.vpg_payroll_employee.findMany.mockResolvedValue([
        {
          payroll_employee_id: 100,
          payroll_employee_gross_salary: 1000.05,
          payroll_employee_overtime_pay: 500,
          payroll_employee_weekly_rest_pay: 200,
          payroll_employee_bonuses: 300.07 // PAY-001 (WARN)
        }
      ]);

      const status = await IntegrityService.getDashboardStatus();

      expect(status.healthScore).toBeLessThan(100);
      expect(status.totalAlerts).toBeGreaterThan(0);
      expect(status.alerts.length).toBeGreaterThan(0);
    });
  });
});
