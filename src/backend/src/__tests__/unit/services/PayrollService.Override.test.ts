import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PayrollService } from '../../../service/PayrollService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('PayrollService.saveEmployeeOverride — PAY-12', () => {
  const payrollId = 1;
  const employeeId = 101;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if payroll does not exist', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue(null);

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(`Planilla ${payrollId} no encontrada`);
  });

  it('should throw error if payroll is not in BORRADOR state', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' }); // Mock default before override

    // Reset findUnique for this specific test
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'APROBADA' });

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(/Solo se pueden ajustar planillas en estado BORRADOR/);
  });

  it('should throw error if employee is not in the payroll', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findFirst.mockResolvedValue(null);

    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, {}))
      .rejects.toThrow(`Empleado ${employeeId} no encontrado en planilla ${payrollId}`);
  });

  it('should throw error if regular + overtime hours exceed 24h', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findFirst.mockResolvedValue({
      payroll_employee_id: 1,
      payroll_employee_total_hours: 10,
      payroll_employee_overtime_hours: 5,
      payroll_employee_version: 1
    });

    // Override such that 20 + 5 > 24
    await expect(PayrollService.saveEmployeeOverride(payrollId, employeeId, { regularHours: 20 }))
      .rejects.toThrow('La suma de horas regulares y horas extra no puede exceder 24 horas');
  });

  it('should update correctly and recalculate net_salary', async () => {
    prisma.vpg_payrolls.findUnique.mockResolvedValue({ payrolls_status: 'BORRADOR' });
    prisma.vpg_payroll_employee.findFirst.mockResolvedValue({
      payroll_employee_id: 1,
      payroll_employee_total_hours: 8,
      payroll_employee_overtime_hours: 2,
      payroll_employee_gross_salary: 1000,
      payroll_employee_total_deductions: 100,
      payroll_employee_version: 1
    });

    prisma.vpg_payroll_employee.update.mockResolvedValue({ id: 1 });

    await PayrollService.saveEmployeeOverride(payrollId, employeeId, { 
      regularHours: 9, 
      totalDeductions: 200 
    });

    expect(prisma.vpg_payroll_employee.update).toHaveBeenCalledWith({
      where: { payroll_employee_id: 1 },
      data: expect.objectContaining({
        payroll_employee_hours_override: 9,
        payroll_employee_total_hours: 9,
        payroll_employee_total_deductions: 200,
        payroll_employee_net_salary: 800, // 1000 - 200
        payroll_employee_is_manually_adjusted: true,
        payroll_employee_version: 2
      })
    });
  });
});
