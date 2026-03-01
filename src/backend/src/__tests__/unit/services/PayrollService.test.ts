import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Payroll } from '../../../model/payroll';

// Create mock instance
const prismaMock = mockDeep<PrismaClient>();

// Mock the PrismaClient module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Import PayrollService after mocking
import { PayrollService } from '../../../service/PayrollService';

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
        status: 'PENDIENTE',
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: new Date('2026-02-01'),
        payrolls_period_end: new Date('2026-02-28'),
        payrolls_payment_date: new Date('2026-03-05'),
        payrolls_status: 'PENDIENTE',
        payrolls_version: 1,
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
        status: 'PENDIENTE',
        version: 1,
      });

      expect(prismaMock.vpg_payrolls.create).toHaveBeenCalledWith({
        data: {
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-02-01'),
          payrolls_period_end: new Date('2026-02-28'),
          payrolls_payment_date: new Date('2026-03-05'),
          payrolls_status: 'PENDIENTE',
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
        status: 'PENDIENTE',
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
        status: 'PROCESANDO',
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 5,
        payrolls_payroll_type_id: 2,
        payrolls_period_start: new Date('2026-01-01'),
        payrolls_period_end: new Date('2026-01-15'),
        payrolls_payment_date: new Date('2026-01-20'),
        payrolls_status: 'PROCESANDO',
        payrolls_version: 1,
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
          payrolls_status: 'PENDIENTE',
          payrolls_version: 1,
        },
        {
          payrolls_id: 2,
          payrolls_payroll_type_id: 2,
          payrolls_period_start: new Date('2026-02-01'),
          payrolls_period_end: new Date('2026-02-28'),
          payrolls_payment_date: new Date('2026-03-05'),
          payrolls_status: 'COMPLETADO',
          payrolls_version: 1,
        },
        {
          payrolls_id: 1,
          payrolls_payroll_type_id: 1,
          payrolls_period_start: new Date('2026-01-01'),
          payrolls_period_end: new Date('2026-01-31'),
          payrolls_payment_date: new Date('2026-02-05'),
          payrolls_status: 'COMPLETADO',
          payrolls_version: 1,
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
        payrolls_status: 'PROCESANDO',
        payrolls_version: 2,
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
        status: 'PROCESANDO',
        version: 2,
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
      // Arrange
      const statuses = ['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'CANCELADO'];
      
      for (const status of statuses) {
        const payrollData: Payroll = {
          id: 0,
          payroll_type: 1,
          period_start: new Date('2026-02-01'),
          period_end: new Date('2026-02-28'),
          payment_date: new Date('2026-03-05'),
          status: status,
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
        status: 'PENDIENTE',
        version: 1,
      };

      const mockCreatedPayroll = {
        payrolls_id: 1,
        payrolls_payroll_type_id: 1,
        payrolls_period_start: sameDate,
        payrolls_period_end: sameDate,
        payrolls_payment_date: new Date('2026-02-20'),
        payrolls_status: 'PENDIENTE',
        payrolls_version: 1,
      };

      prismaMock.vpg_payrolls.create.mockResolvedValue(mockCreatedPayroll);

      // Act
      const result = await PayrollService.createPayroll(payrollData);

      // Assert
      expect(result.period_start).toEqual(result.period_end);
    });
  });
});
