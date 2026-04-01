import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { DeductionsService } from '../../../service/DeductionsService';
import { Deduction } from '../../../model/deduction';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaDeduction = {
  deductions_id: 1,
  deductions_name: 'CCSS',
  deductions_description: 'Caja Costarricense de Seguro Social',
  deductions_percentage: 9.34,
  deductions_fixed_amount: null,
  deductions_version: 1,
};

function makeDeduction(input: Partial<Deduction> = {}): Deduction {
  return {
    id: 1,
    name: 'CCSS',
    description: 'Caja Costarricense de Seguro Social',
    percentage: 9.34,
    version: 1,
    ...input,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_deductions.findUnique.mockResolvedValue(null);
  prisma.vpg_deductions.findMany.mockResolvedValue([]);
  prisma.vpg_deductions.create.mockResolvedValue(mockPrismaDeduction);
  prisma.vpg_deductions.update.mockResolvedValue(mockPrismaDeduction);
  prisma.vpg_deductions.delete.mockResolvedValue(mockPrismaDeduction);
});

describe('DeductionsService', () => {
  describe('createDeduction', () => {
    it('should create a deduction with percentage', async () => {
      const input = makeDeduction({ percentage: 9.34 });

      const result = await DeductionsService.createDeduction(input);

      expect(result.name).toBe('CCSS');
      expect(result.percentage).toBe(9.34);
      expect(prisma.vpg_deductions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deductions_name: 'CCSS',
          deductions_percentage: 9.34,
        }),
      });
    });

    it('should create a deduction with fixed amount', async () => {
      const mockFixedDeduction = { ...mockPrismaDeduction, deductions_percentage: null, deductions_fixed_amount: 5000 };
      prisma.vpg_deductions.create.mockResolvedValue(mockFixedDeduction);
      const input = makeDeduction({ percentage: undefined, fixed_amount: 5000 });

      const result = await DeductionsService.createDeduction(input);

      expect(result.fixed_amount).toBe(5000);
      const call = prisma.vpg_deductions.create.mock.lastCall;
      expect(call[0].data.deductions_fixed_amount).toBe(5000);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_deductions.create.mockRejectedValue(new Error('DB error'));

      await expect(DeductionsService.createDeduction(makeDeduction())).rejects.toThrow('DB error');
    });
  });

  describe('getAllDeductions', () => {
    it('should return all deductions', async () => {
      prisma.vpg_deductions.findMany.mockResolvedValue([mockPrismaDeduction]);

      const result = await DeductionsService.getAllDeductions();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('CCSS');
      expect(result[0].percentage).toBe(9.34);
    });

    it('should return empty array when no deductions', async () => {
      prisma.vpg_deductions.findMany.mockResolvedValue([]);

      const result = await DeductionsService.getAllDeductions();

      expect(result).toEqual([]);
    });

    it('should handle null percentage as undefined', async () => {
      prisma.vpg_deductions.findMany.mockResolvedValue([{ ...mockPrismaDeduction, deductions_percentage: null, deductions_fixed_amount: 1000 }]);

      const result = await DeductionsService.getAllDeductions();

      expect(result[0].percentage).toBeUndefined();
      expect(result[0].fixed_amount).toBe(1000);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_deductions.findMany.mockRejectedValue(new Error('DB error'));

      await expect(DeductionsService.getAllDeductions()).rejects.toThrow('DB error');
    });
  });

  describe('getDeductionById', () => {
    it('should return deduction when found', async () => {
      prisma.vpg_deductions.findUnique.mockResolvedValue(mockPrismaDeduction);

      const result = await DeductionsService.getDeductionById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('CCSS');
      expect(prisma.vpg_deductions.findUnique).toHaveBeenCalledWith({ where: { deductions_id: 1 } });
    });

    it('should return null when not found', async () => {
      prisma.vpg_deductions.findUnique.mockResolvedValue(null);

      const result = await DeductionsService.getDeductionById(999);

      expect(result).toBeNull();
    });

    it('should throw if database fails', async () => {
      prisma.vpg_deductions.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(DeductionsService.getDeductionById(1)).rejects.toThrow('DB error');
    });
  });

  describe('updateDeduction', () => {
    it('should update deduction fields', async () => {
      const updated = { ...mockPrismaDeduction, deductions_name: 'INSS' };
      prisma.vpg_deductions.update.mockResolvedValue(updated);

      const result = await DeductionsService.updateDeduction(1, { name: 'INSS' });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('INSS');
      expect(prisma.vpg_deductions.update).toHaveBeenCalledWith({
        where: { deductions_id: 1 },
        data: expect.objectContaining({ deductions_name: 'INSS' }),
      });
    });

    it('should throw P2025 when not found', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prisma.vpg_deductions.update.mockRejectedValue(error);

      await expect(DeductionsService.updateDeduction(999, { name: 'X' })).rejects.toThrow('Record not found');
    });
  });

  describe('deleteDeduction', () => {
    it('should delete and return deduction', async () => {
      const result = await DeductionsService.deleteDeduction(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(prisma.vpg_deductions.delete).toHaveBeenCalledWith({ where: { deductions_id: 1 } });
    });

    it('should throw P2025 when not found', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prisma.vpg_deductions.delete.mockRejectedValue(error);

      await expect(DeductionsService.deleteDeduction(999)).rejects.toThrow('Record not found');
    });
  });
});
