import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockAliasService } from '../../../service/ClockAliasService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockAliasRow = {
  aliases_id: 1,
  aliases_employee_id: 10,
  aliases_name: 'juan',
  aliases_created_at: new Date('2026-01-01T00:00:00Z'),
  aliases_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ClockAliasService', () => {
  describe('create', () => {
    it('should normalize alias name and create alias when no duplicate exists', async () => {
      prisma.vpg_clock_aliases.findFirst.mockResolvedValue(null);
      prisma.vpg_clock_aliases.create.mockResolvedValue(mockAliasRow);

      const result = await ClockAliasService.create(10, 'JUAN');

      expect(prisma.vpg_clock_aliases.findFirst).toHaveBeenCalledWith({
        where: { aliases_employee_id: 10, aliases_name: 'juan' },
      });
      expect(prisma.vpg_clock_aliases.create).toHaveBeenCalledWith({
        data: { aliases_employee_id: 10, aliases_name: 'juan', aliases_version: 1 },
      });
      expect(result.id).toBe(1);
      expect(result.employee_id).toBe(10);
      expect(result.name).toBe('juan');
    });

    it('should throw ALIAS_DUPLICATE when alias already exists for employee', async () => {
      prisma.vpg_clock_aliases.findFirst.mockResolvedValue(mockAliasRow);

      await expect(ClockAliasService.create(10, 'Juan')).rejects.toThrow('ALIAS_DUPLICATE');
      expect(prisma.vpg_clock_aliases.create).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return aliases for employee ordered by name asc', async () => {
      prisma.vpg_clock_aliases.findMany.mockResolvedValue([mockAliasRow]);

      const result = await ClockAliasService.getAll(10);

      expect(prisma.vpg_clock_aliases.findMany).toHaveBeenCalledWith({
        where: { aliases_employee_id: 10 },
        orderBy: { aliases_name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].employee_id).toBe(10);
    });
  });

  describe('getById', () => {
    it('should return mapped alias when found', async () => {
      prisma.vpg_clock_aliases.findUnique.mockResolvedValue(mockAliasRow);

      const result = await ClockAliasService.getById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('juan');
    });

    it('should return null when alias not found', async () => {
      prisma.vpg_clock_aliases.findUnique.mockResolvedValue(null);

      const result = await ClockAliasService.getById(99);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete alias when it exists', async () => {
      prisma.vpg_clock_aliases.findUnique.mockResolvedValue(mockAliasRow);
      prisma.vpg_clock_aliases.delete.mockResolvedValue(mockAliasRow);

      await expect(ClockAliasService.delete(1)).resolves.not.toThrow();
      expect(prisma.vpg_clock_aliases.delete).toHaveBeenCalledWith({
        where: { aliases_id: 1 },
      });
    });

    it('should throw ALIAS_NOT_FOUND when alias does not exist', async () => {
      prisma.vpg_clock_aliases.findUnique.mockResolvedValue(null);

      await expect(ClockAliasService.delete(99)).rejects.toThrow('ALIAS_NOT_FOUND');
      expect(prisma.vpg_clock_aliases.delete).not.toHaveBeenCalled();
    });
  });

  describe('resolveEmployeeByAlias', () => {
    it('should return employee_id when alias is found (normalizes input)', async () => {
      prisma.vpg_clock_aliases.findFirst.mockResolvedValue(mockAliasRow);

      const result = await ClockAliasService.resolveEmployeeByAlias('JUAN');

      expect(prisma.vpg_clock_aliases.findFirst).toHaveBeenCalledWith({
        where: { aliases_name: 'juan' },
        select: { aliases_employee_id: true },
      });
      expect(result).toBe(10);
    });

    it('should return null when alias is not found', async () => {
      prisma.vpg_clock_aliases.findFirst.mockResolvedValue(null);

      const result = await ClockAliasService.resolveEmployeeByAlias('desconocido');

      expect(result).toBeNull();
    });
  });
});