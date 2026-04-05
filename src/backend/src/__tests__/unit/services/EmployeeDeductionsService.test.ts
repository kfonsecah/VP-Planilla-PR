import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
// Note: service file is EmployeeDeductions.ts (no 'Service' suffix in filename)
import { EmployeeDeductionsService } from '../../../service/EmployeeDeductions';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaEmployeeDeduction = {
  deductions_per_employee_employee_id: 10,
  deductions_per_employee_deduction_id: 3,
  deductions_per_employee_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_deductions_per_employee.create.mockResolvedValue(mockPrismaEmployeeDeduction);
  prisma.vpg_deductions_per_employee.delete.mockResolvedValue(mockPrismaEmployeeDeduction);
});

describe('EmployeeDeductionsService', () => {
  describe('assignDeductionToEmployee', () => {
    it('should create record and return DeductionsPerEmployee with correct field mapping', async () => {
      const result = await EmployeeDeductionsService.assignDeductionToEmployee(10, 3);

      expect(result.employee_id).toBe(10);
      expect(result.deduction_id).toBe(3);
      expect(result.version).toBe(1);
    });

    it('should propagate DB errors on assign', async () => {
      prisma.vpg_deductions_per_employee.create.mockRejectedValue(new Error('DB error'));

      await expect(
        EmployeeDeductionsService.assignDeductionToEmployee(10, 3),
      ).rejects.toThrow('DB error');
    });

    it('should call create with correct composite data (employee_id and deduction_id)', async () => {
      await EmployeeDeductionsService.assignDeductionToEmployee(10, 3);

      expect(prisma.vpg_deductions_per_employee.create).toHaveBeenCalledWith({
        data: {
          deductions_per_employee_employee_id: 10,
          deductions_per_employee_deduction_id: 3,
          deductions_per_employee_version: 1,
        },
      });
    });
  });

  describe('removeDeductionFromEmployee', () => {
    it('should delete record successfully and resolve without error', async () => {
      await expect(
        EmployeeDeductionsService.removeDeductionFromEmployee(10, 3),
      ).resolves.toBeUndefined();

      expect(prisma.vpg_deductions_per_employee.delete).toHaveBeenCalledTimes(1);
    });

    it('should propagate DB errors on remove', async () => {
      prisma.vpg_deductions_per_employee.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(
        EmployeeDeductionsService.removeDeductionFromEmployee(10, 3),
      ).rejects.toThrow('Delete failed');
    });

    it('should call delete with correct composite where key', async () => {
      await EmployeeDeductionsService.removeDeductionFromEmployee(10, 3);

      expect(prisma.vpg_deductions_per_employee.delete).toHaveBeenCalledWith({
        where: {
          deductions_per_employee_employee_id_deductions_per_employee_deduction_id: {
            deductions_per_employee_employee_id: 10,
            deductions_per_employee_deduction_id: 3,
          },
        },
      });
    });
  });
});
