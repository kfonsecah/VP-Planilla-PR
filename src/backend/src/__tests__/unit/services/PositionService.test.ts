import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PositionService } from '../../../service/PositionService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

// Prisma Decimal mock: supports .toDecimalPlaces(n).toNumber() chain
const mockDecimal = { toDecimalPlaces: (_: number) => ({ toNumber: () => 1500.00 }) };

const mockPrismaPosition = {
  position_id: 1,
  position_name: 'Developer',
  position_description: 'Software developer',
  position_base_salary: mockDecimal,
  position_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_positions.findUnique.mockResolvedValue(mockPrismaPosition);
  prisma.vpg_positions.findMany.mockResolvedValue([]);
  prisma.vpg_positions.create.mockResolvedValue(mockPrismaPosition);
  prisma.vpg_positions.updateMany.mockResolvedValue({ count: 1 });
  prisma.vpg_positions.deleteMany.mockResolvedValue({ count: 1 });
});

describe('PositionService', () => {
  describe('getPositionById', () => {
    it('should return a position with base_salary as number (Decimal chain resolved)', async () => {
      const result = await PositionService.getPositionById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('Developer');
      expect(result!.base_salary).toBe(1500.00);
      expect(result!.version).toBe(1);
      expect(prisma.vpg_positions.findUnique).toHaveBeenCalledWith({
        where: { position_id: 1 },
      });
    });

    it('should return null when position not found', async () => {
      prisma.vpg_positions.findUnique.mockResolvedValue(null);

      const result = await PositionService.getPositionById(999);

      expect(result).toBeNull();
    });

    it('should propagate DB errors', async () => {
      prisma.vpg_positions.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(PositionService.getPositionById(1)).rejects.toThrow('DB error');
    });
  });

  describe('getAllPositions', () => {
    it('should return mapped array with Decimal converted to number', async () => {
      prisma.vpg_positions.findMany.mockResolvedValue([mockPrismaPosition]);

      const result = await PositionService.getAllPositions();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].base_salary).toBe(1500.00);
    });

    it('should return empty array when no positions', async () => {
      prisma.vpg_positions.findMany.mockResolvedValue([]);

      const result = await PositionService.getAllPositions();

      expect(result).toEqual([]);
    });
  });

  describe('createPosition', () => {
    it('should create a position and return mapped result', async () => {
      const input = {
        name: 'Developer',
        description: 'Software developer',
        base_salary: 1500.00,
      };

      const result = await PositionService.createPosition(input);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Developer');
      expect(result.base_salary).toBe(1500.00);
      expect(prisma.vpg_positions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position_name: 'Developer',
          position_base_salary: 1500.00,
          position_version: 1,
        }),
      });
    });
  });

  describe('updatePosition', () => {
    it('should return updated position when updateMany returns count=1', async () => {
      prisma.vpg_positions.updateMany.mockResolvedValue({ count: 1 });
      // findUnique is called internally by getPositionById after updateMany
      prisma.vpg_positions.findUnique.mockResolvedValue(mockPrismaPosition);

      const input = { id: 1, name: 'Senior Developer', description: 'Senior software developer', base_salary: 2000, version: 1 };

      const result = await PositionService.updatePosition(input);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
    });

    it('should return null when updateMany returns count=0 (version mismatch)', async () => {
      prisma.vpg_positions.updateMany.mockResolvedValue({ count: 0 });

      const input = { id: 1, name: 'Developer', description: 'Software developer', base_salary: 1500, version: 99 };

      const result = await PositionService.updatePosition(input);

      expect(result).toBeNull();
      expect(prisma.vpg_positions.findUnique).not.toHaveBeenCalled();
    });

    it('should propagate DB errors on update', async () => {
      prisma.vpg_positions.updateMany.mockRejectedValue(new Error('Update failed'));

      const input = { id: 1, name: 'Developer', description: 'Software developer', base_salary: 1500, version: 1 };

      await expect(PositionService.updatePosition(input)).rejects.toThrow('Update failed');
    });
  });

  describe('deletePosition', () => {
    it('should return true when deleteMany returns count=1', async () => {
      prisma.vpg_positions.deleteMany.mockResolvedValue({ count: 1 });

      const result = await PositionService.deletePosition(1);

      expect(result).toBe(true);
      expect(prisma.vpg_positions.deleteMany).toHaveBeenCalledWith({
        where: { position_id: 1 },
      });
    });

    it('should return false when deleteMany returns count=0', async () => {
      prisma.vpg_positions.deleteMany.mockResolvedValue({ count: 0 });

      const result = await PositionService.deletePosition(999);

      expect(result).toBe(false);
    });
  });
});
