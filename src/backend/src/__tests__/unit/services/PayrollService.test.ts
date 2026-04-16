import { PrismaClient, PayrollStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Payroll } from '../../../model/payroll';

// Create mock instance
const prismaMock = mockDeep<PrismaClient>();

// Mock the PrismaClient module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  PayrollStatus: {
    BORRADOR: 'BORRADOR',
    APROBADA: 'APROBADA',
    PAGADA: 'PAGADA',
  },
}));

// Mock the lib/prisma module
jest.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
}));

// Import PayrollService after mocking
import { PayrollService } from '../../../service/PayrollService';

// Helper: base nullable approval fields for vpg_payrolls mocks
const nullablePayrollFields = {
  payrolls_approved_by: null,
  payrolls_approved_at: null,
  payrolls_notes: null,
  payrolls_reopened_at: null,
  payrolls_reopen_reason: null,
};

describe('PayrollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayroll', () => {
    it('should create a payroll successfully with valid data', async () => {
      // Arrange
      const payrollData: Payroll = {
        id: 0,
        payroll_type: 1,
        period_start: new Date('2026-02-01'),
        period_end: new Date('2026-02-28'),
        payment_date: new Date('2026-03-05'),
        status: PayrollStatus.BORRADOR,
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: new Date('2026-02-01'),
        payrolls_period_end: new Date('2026-02-28'),
        payrolls_payment_date: new Date('2026-03-05'),
        payrolls_status: PayrollStatus.BORRADOR,
        payrolls_version: 1,
        ...nullablePayrollFields,
      };

      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result).toEqual({
        id: 1,
        payroll_type: 1,
        period_start: new Date('2026-02-01'),
        period_end: new Date('2026-02-28'),
        payment_date: new Date('2026-03-05'),
        status: PayrollStatus.BORRADOR,
        version: 1,
      });

      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({
        data: {
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-02-01'),
          payrolls_period_end: new Date('2026-02-28'),
          payrolls_payment_date: new Date('2026-03-05'),
          payrolls_status: PayrollStatus.BORRADOR,
          payrolls_version: 1,
        },
      });
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      const payrollData: Payroll = {
        id: 0,
        payroll_type: 1,
        period_start: new Date('2026-02-01'),
        period_end: new Date('2026-02-28'),
        payment_date: new Date('2026-03-05'),
        status: PayrollStatus.BORRADOR,
        version: 1,
      };

      const dbError = new Error('Database connection failed');
      prismaMock.vpg_payrolls.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(PayrollService.createPayroll(payrollData)).rejects.toThrow('Database connection failed');
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledTimes(1);
    });

    it('should create payroll with default version 1', async () => {
      // Arrange
      const payrollData: Payroll = {
        id: 0,
        payroll_type: 2,
        period_start: new Date('2026-01-01'),
        period_end: new Date('2026-01-15'),
        payment_date: new Date('2026-01-20'),
        status: PayrollStatus.APROBADA,
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 5,
        payrolls_payroll_type_id: 2,
        payrolls_period_start: new Date('2026-01-01'),
        payrolls_period_end: new Date('2026-01-15'),
        payrolls_payment_date: new Date('2026-01-20'),
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 1,
        ...nullablePayrollFields,
      };

      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result.version).toBe(1);
      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payrolls_version: 1,
          }),
        })
      );
    });
  });

  describe('getAllPayrolls', () => {
    it('should retrieve all payrolls ordered by ID descending', async () => {
      // Arrange
      const mockPayrolls = [
        {
          payrolls_id: 3,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-03-01'),
          payrolls_period_end: new Date('2026-03-31'),
          payrolls_payment_date: new Date('2026-04-05'),
          payrolls_status: PayrollStatus.BORRADOR,
          payrolls_version: 1,
          vpg_payroll_employee: [],
          ...nullablePayrollFields,
        },
        {
          payrolls_id: 2,
          payrolls_payroll_type_id: 2,
          payrolls_period_start: new Date('2026-02-01'),
          payrolls_period_end: new Date('2026-02-28'),
          payrolls_payment_date: new Date('2026-03-05'),
          payrolls_status: PayrollStatus.PAGADA,
          payrolls_version: 1,
          vpg_payroll_employee: [],
          ...nullablePayrollFields,
        },
        {
          payrolls_id: 1,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-01-01'),
          payrolls_period_end: new Date('2026-01-31'),
          payrolls_payment_date: new Date('2026-02-05'),
          payrolls_status: PayrollStatus.PAGADA,
          payrolls_version: 1,
          vpg_payroll_employee: [],
          ...nullablePayrollFields,
        },
      ];

      prismaMock.vpg_payrolls.findMany.mockResolvedValue(mockPayrolls);

      // Act
      const result = await PayrollService.getAllPayrolls();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);

      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledWith({
        include: {
          vpg_payroll_employee: true,
        },
        orderBy: {
          payrolls_id: 'desc',
        },
      });
      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no payrolls exist', async () => {
      // Arrange
      prismaMock.vpg_payrolls.findMany.mockResolvedValue([]);

      // Act
      const result = await PayrollService.getAllPayrolls();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledTimes(1);
    });

    it('should correctly map database fields to model fields', async () => {
      // Arrange
      const mockPayroll = {
        payrolls_id: 10,
        payrolls_payroll_type_id: 3,
        payrolls_period_start: new Date('2026-02-15'),
        payrolls_period_end: new Date('2026-02-28'),
        payrolls_payment_date: new Date('2026-03-01'),
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 2,
        vpg_payroll_employee: [],
        ...nullablePayrollFields,
      };

      prismaMock.vpg_payrolls.findMany.mockResolvedValue([mockPayroll]);

      // Act
      const result = await PayrollService.getAllPayrolls();

      // Assert
      expect(result[0]).toEqual({
        id: 10,
        payroll_type: 3,
        period_start: new Date('2026-02-15'),
        period_end: new Date('2026-02-28'),
        payment_date: new Date('2026-03-01'),
        status: PayrollStatus.APROBADA,
        version: 2,
        total_employees: 0,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
        total_bonuses: 0,
        total_hours: 0,
        total_overtime_hours: 0,
        total_weekly_rest_hours: 0,
        total_overtime_pay: 0,
        total_weekly_rest_pay: 0,
      });
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database query timeout');
      prismaMock.vpg_payrolls.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(PayrollService.getAllPayrolls()).rejects.toThrow('Database query timeout');
      expect(prismaMock.vpg_payrolls.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle different payroll statuses', async () => {
      // Arrange — all valid PayrollStatus enum values
      const statuses = [PayrollStatus.BORRADOR, PayrollStatus.APROBADA, PayrollStatus.PAGADA];

      for (const status of statuses) {
        const payrollData: Payroll = {
          id: 0,
          payroll_type: 1,
          period_start: new Date('2026-02-01'),
          period_end: new Date('2026-02-28'),
          payment_date: new Date('2026-03-05'),
          status,
          version: 1,
        };

        const mockCreatedPayroll = {
          payrolls_id: 1,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-02-01'),
          payrolls_period_end: new Date('2026-02-28'),
          payrolls_payment_date: new Date('2026-03-05'),
          payrolls_status: status,
          payrolls_version: 1,
          ...nullablePayrollFields,
        };

        prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

        // Act
        const result = await PayrollService.createPayroll(payrollData);

        // Assert
        expect(result.status).toBe(status);
      }
    });

    it('should handle payroll with same period dates', async () => {
      // Arrange
      const sameDate = new Date('2026-02-15');
      const payrollData: Payroll = {
        id: 0,
        payroll_type: 1,
        period_start: sameDate,
        period_end: sameDate,
        payment_date: new Date('2026-02-20'),
        status: PayrollStatus.BORRADOR,
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: sameDate,
        payrolls_period_end: sameDate,
        payrolls_payment_date: new Date('2026-02-20'),
        payrolls_status: PayrollStatus.BORRADOR,
        payrolls_version: 1,
        ...nullablePayrollFields,
      };

      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result.period_start).toEqual(result.period_end);
    });
  });

  describe('approvePayroll', () => {
    it('should throw error when payroll not found', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(null as any);
      await expect(PayrollService.approvePayroll(999, 1)).rejects.toThrow('Payroll not found');
    });

    it('should throw error when status is not BORRADOR', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue({
        payrolls_id: 1,
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 1,
        ...nullablePayrollFields,
      } as any);
      await expect(PayrollService.approvePayroll(1, 1)).rejects.toThrow('Solo las planillas en estado BORRADOR pueden ser aprobadas');
    });

    it('should successfully approve BORRADOR payroll', async () => {
      const existingPayroll = {
        payrolls_id: 1,
        payrolls_status: PayrollStatus.BORRADOR,
        payrolls_version: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: new Date('2026-02-01'),
        payrolls_period_end: new Date('2026-02-28'),
        payrolls_payment_date: new Date('2026-03-05'),
        ...nullablePayrollFields,
      };
      
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(existingPayroll as any);
      prismaMock.vpg_payrolls.update.mockResolvedValue({
        ...existingPayroll,
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_approved_by: 1,
        payrolls_approved_at: new Date(),
        payrolls_version: 2,
      } as any);

      const result = await PayrollService.approvePayroll(1, 1);
      
      expect(result.status).toBe(PayrollStatus.APROBADA);
      expect(result.approved_by).toBe(1);
      expect(result.version).toBe(2);
    });
  });

  describe('markAsPaid', () => {
    it('should throw error when payroll not found', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(null as any);
      await expect(PayrollService.markAsPaid(999)).rejects.toThrow('Payroll not found');
    });

    it('should throw error when status is not APROBADA', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue({
        payrolls_id: 1,
        payrolls_status: PayrollStatus.BORRADOR,
        payrolls_version: 1,
        payrolls_period_start: new Date('2026-02-01'),
        payrolls_period_end: new Date('2026-02-28'),
        ...nullablePayrollFields,
      } as any);
      await expect(PayrollService.markAsPaid(1)).rejects.toThrow('Solo las planillas en estado APROBADA pueden ser marcadas como pagadas');
    });

    it('should successfully mark APROBADA payroll as paid', async () => {
      const existingPayroll = {
        payrolls_id: 1,
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: new Date('2026-02-01'),
        payrolls_period_end: new Date('2026-02-28'),
        payrolls_payment_date: new Date('2026-03-05'),
        ...nullablePayrollFields,
      };
      
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(existingPayroll as any);
      prismaMock.vpg_payrolls.update.mockResolvedValue({
        ...existingPayroll,
        payrolls_status: PayrollStatus.PAGADA,
        payrolls_version: 2,
      } as any);

      const result = await PayrollService.markAsPaid(1);
      
      expect(result.status).toBe(PayrollStatus.PAGADA);
      expect(result.version).toBe(2);
    });
  });

  describe('reopenPayroll', () => {
    it('should throw error when payroll not found', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(null as any);
      await expect(PayrollService.reopenPayroll(999, 1, 'Reason for reopening')).rejects.toThrow('Payroll not found');
    });

    it('should throw error when status is not APROBADA', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue({
        payrolls_id: 1,
        payrolls_status: PayrollStatus.BORRADOR,
        payrolls_version: 1,
        ...nullablePayrollFields,
      } as any);
      await expect(PayrollService.reopenPayroll(1, 1, 'Reason for reopening')).rejects.toThrow('Solo las planillas en estado APROBADA pueden ser reopenidas');
    });

    it('should throw error when reason is less than 10 characters', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue({
        payrolls_id: 1,
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 1,
        ...nullablePayrollFields,
      } as any);
      await expect(PayrollService.reopenPayroll(1, 1, 'short')).rejects.toThrow('El motivo de reapertura debe tener al menos 10 caracteres');
    });
  });

  describe('recalculatePayroll', () => {
    it('should throw error when payroll not found', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue(null as any);
      await expect(PayrollService.recalculatePayroll(999, 1, 'Reason for recalc')).rejects.toThrow('Payroll not found');
    });

    it('should throw error when status is not BORRADOR', async () => {
      prismaMock.vpg_payrolls.findUnique.mockResolvedValue({
        payrolls_id: 1,
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_version: 1,
        vpg_payroll_employee: [],
        ...nullablePayrollFields,
      } as any);
      await expect(PayrollService.recalculatePayroll(1, 1, 'Reason for recalc')).rejects.toThrow('Solo las planillas en estado BORRADOR pueden ser recalculadas');
    });
  });

  describe('calculateAguinaldo', () => {
    it('should calculate correct total for full year', async () => {
      const mockPayrolls = [
        {
          payrolls_id: 1,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2025-12-01'),
          payrolls_period_end: new Date('2025-12-31'),
          payrolls_payment_date: new Date('2026-01-05'),
          payrolls_status: PayrollStatus.APROBADA,
          payrolls_version: 1,
          vpg_payroll_employee: [
            { payroll_employee_employee_id: 1, payroll_employee_gross_salary: 100000 },
          ],
          ...nullablePayrollFields,
        },
        {
          payrolls_id: 2,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-01-01'),
          payrolls_period_end: new Date('2026-01-31'),
          payrolls_payment_date: new Date('2026-02-05'),
          payrolls_status: PayrollStatus.APROBADA,
          payrolls_version: 1,
          vpg_payroll_employee: [
            { payroll_employee_employee_id: 1, payroll_employee_gross_salary: 100000 },
          ],
          ...nullablePayrollFields,
        },
      ];
      
      prismaMock.vpg_payrolls.findMany.mockResolvedValue(mockPayrolls as any);
      
      const result = await PayrollService.calculateAguinaldo(1, 2026);
      
      // 2 months * 100000 / 12 = 16666.67
      expect(result.total).toBeCloseTo(16666.67, 0);
      expect(result.months).toBe(2);
    });

    it('should calculate proportional for partial year', async () => {
      const mockPayrolls = [
        {
          payrolls_id: 1,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-01-01'),
          payrolls_period_end: new Date('2026-01-31'),
          payrolls_payment_date: new Date('2026-02-05'),
          payrolls_status: PayrollStatus.APROBADA,
          payrolls_version: 1,
          vpg_payroll_employee: [
            { payroll_employee_employee_id: 1, payroll_employee_gross_salary: 100000 },
          ],
          ...nullablePayrollFields,
        },
      ];
      
      prismaMock.vpg_payrolls.findMany.mockResolvedValue(mockPayrolls as any);
      
      const result = await PayrollService.calculateAguinaldo(1, 2026);
      
      // 1 month * 100000 / 12 = 8333.33
      expect(result.total).toBeCloseTo(8333.33, 0);
      expect(result.months).toBe(1);
    });
  });
});
