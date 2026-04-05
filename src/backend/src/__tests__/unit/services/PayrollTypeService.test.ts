import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PayrollTypeService } from '../../../service/PayrollTypeService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaPayrollType = {
  payroll_types_id: 1,
  payroll_types_name: 'Quincenal',
  payroll_types_description: 'Pago quincenal',
  payroll_types_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  // CRITICAL: createPayrollType has a finally { await prisma.$disconnect() } block
  prisma.$disconnect.mockResolvedValue(undefined);
  prisma.vpg_payroll_types.findUnique.mockResolvedValue(null);
  prisma.vpg_payroll_types.findMany.mockResolvedValue([]);
  prisma.vpg_payroll_types.create.mockResolvedValue(mockPrismaPayrollType);
  prisma.vpg_payroll_types.update.mockResolvedValue(mockPrismaPayrollType);
});

describe('PayrollTypeService', () => {
  describe('createPayrollType', () => {
    it('should create a payroll type and return mapped result', async () => {
      const input = {
        id: 0,
        name: 'Quincenal',
        description: 'Pago quincenal',
        version: 1,
      };

      const result = await PayrollTypeService.createPayrollType(input);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Quincenal');
      expect(result.description).toBe('Pago quincenal');
      expect(result.version).toBe(1);
      expect(prisma.vpg_payroll_types.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payroll_types_name: 'Quincenal',
          payroll_types_description: 'Pago quincenal',
        }),
      });
    });

    it('should wrap DB failure in "Failed to create payroll type" message', async () => {
      prisma.vpg_payroll_types.create.mockRejectedValue(new Error('DB connection failed'));

      await expect(
        PayrollTypeService.createPayrollType({ id: 0, name: 'X', description: 'Y', version: 1 }),
      ).rejects.toThrow('Failed to create payroll type');
    });

    it('should call $disconnect in finally block even on success', async () => {
      await PayrollTypeService.createPayrollType({
        id: 0,
        name: 'Quincenal',
        description: 'Pago quincenal',
        version: 1,
      });

      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllPayrollTypes', () => {
    it('should return mapped array of payroll types', async () => {
      prisma.vpg_payroll_types.findMany.mockResolvedValue([mockPrismaPayrollType]);

      const result = await PayrollTypeService.getAllPayrollTypes();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Quincenal');
    });

    it('should return empty array when no payroll types', async () => {
      prisma.vpg_payroll_types.findMany.mockResolvedValue([]);

      const result = await PayrollTypeService.getAllPayrollTypes();

      expect(result).toEqual([]);
    });

    it('should propagate DB errors', async () => {
      prisma.vpg_payroll_types.findMany.mockRejectedValue(new Error('DB error'));

      await expect(PayrollTypeService.getAllPayrollTypes()).rejects.toThrow('DB error');
    });
  });

  describe('getPayrollTypeById', () => {
    it('should return payroll type when found', async () => {
      prisma.vpg_payroll_types.findUnique.mockResolvedValue(mockPrismaPayrollType);

      const result = await PayrollTypeService.getPayrollTypeById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('Quincenal');
      expect(prisma.vpg_payroll_types.findUnique).toHaveBeenCalledWith({
        where: { payroll_types_id: 1 },
      });
    });

    it('should return null when payroll type not found', async () => {
      prisma.vpg_payroll_types.findUnique.mockResolvedValue(null);

      const result = await PayrollTypeService.getPayrollTypeById(999);

      expect(result).toBeNull();
    });
  });

  describe('updatePayrollType', () => {
    it('should update and return payroll type with version incremented by (data.version ?? 0) + 1', async () => {
      const updatedMock = { ...mockPrismaPayrollType, payroll_types_name: 'Mensual', payroll_types_version: 2 };
      prisma.vpg_payroll_types.update.mockResolvedValue(updatedMock);

      const result = await PayrollTypeService.updatePayrollType(1, { name: 'Mensual', version: 1 });

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Mensual');
      expect(result!.version).toBe(2);
      expect(prisma.vpg_payroll_types.update).toHaveBeenCalledWith({
        where: { payroll_types_id: 1 },
        data: expect.objectContaining({
          payroll_types_name: 'Mensual',
          payroll_types_version: 2, // (data.version=1) + 1 = 2
        }),
      });
    });
  });
});
