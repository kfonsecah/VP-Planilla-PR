import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { BonusesService } from '../../../service/BonusesService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaBonus = {
  bonuses_id: 1,
  bonuses_employee_id: 10,
  bonuses_payroll_id: 5,
  bonuses_year: 2026,
  bonuses_month: 1,
  bonuses_description: 'Bono de desempeño',
  bonuses_amount: 1500, // plain number — service casts with Number()
  bonuses_granted_at: new Date('2026-01-31'),
  bonuses_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_bonuses.findUnique.mockResolvedValue(null);
  prisma.vpg_bonuses.create.mockResolvedValue(mockPrismaBonus);
  prisma.vpg_bonuses.update.mockResolvedValue(mockPrismaBonus);
  prisma.vpg_bonuses.delete.mockResolvedValue(mockPrismaBonus);
});

describe('BonusesService', () => {
  describe('createBonus', () => {
    it('should create a bonus and return mapped result with amount as number', async () => {
      const input = {
        id: 0,
        employee_id: 10,
        payroll_id: 5,
        year: 2026,
        month: 1,
        description: 'Bono de desempeño',
        amount: 1500,
        granted_at: new Date('2026-01-31'),
        version: 1,
      };

      const result = await BonusesService.createBonus(input);

      expect(result.id).toBe(1);
      expect(result.employee_id).toBe(10);
      expect(result.amount).toBe(1500);
      expect(typeof result.amount).toBe('number');
      expect(prisma.vpg_bonuses.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bonuses_employee_id: 10,
          bonuses_amount: 1500,
          bonuses_version: 1,
        }),
      });
    });

    it('should propagate DB errors on create', async () => {
      prisma.vpg_bonuses.create.mockRejectedValue(new Error('DB error'));

      await expect(
        BonusesService.createBonus({
          id: 0, employee_id: 10, payroll_id: 5, year: 2026, month: 1,
          description: 'X', amount: 100, granted_at: new Date(), version: 1,
        }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getBonusById', () => {
    it('should return bonus when found', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(mockPrismaBonus);

      const result = await BonusesService.getBonusById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.employee_id).toBe(10);
      expect(result!.amount).toBe(1500);
    });

    it('should return null when bonus not found', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(null);

      const result = await BonusesService.getBonusById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateBonus', () => {
    it('should update bonus when it exists', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(mockPrismaBonus);
      const updatedMock = { ...mockPrismaBonus, bonuses_description: 'Bono actualizado', bonuses_version: 2 };
      prisma.vpg_bonuses.update.mockResolvedValue(updatedMock);

      const result = await BonusesService.updateBonus(1, { description: 'Bono actualizado' });

      expect(result).not.toBeNull();
      expect(result!.description).toBe('Bono actualizado');
      expect(result!.version).toBe(2);
      expect(prisma.vpg_bonuses.update).toHaveBeenCalledTimes(1);
    });

    it('should return null without calling update when bonus not found', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(null);

      const result = await BonusesService.updateBonus(999, { description: 'X' });

      expect(result).toBeNull();
      expect(prisma.vpg_bonuses.update).not.toHaveBeenCalled();
    });

    it('should propagate DB errors on findUnique during update', async () => {
      prisma.vpg_bonuses.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(BonusesService.updateBonus(1, { description: 'X' })).rejects.toThrow('DB error');
    });
  });

  describe('deleteBonus', () => {
    it('should delete bonus and return bonus data when it exists', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(mockPrismaBonus);

      const result = await BonusesService.deleteBonus(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.amount).toBe(1500);
      expect(prisma.vpg_bonuses.delete).toHaveBeenCalledWith({
        where: { bonuses_id: 1 },
      });
    });

    it('should return null without calling delete when bonus not found', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(null);

      const result = await BonusesService.deleteBonus(999);

      expect(result).toBeNull();
      expect(prisma.vpg_bonuses.delete).not.toHaveBeenCalled();
    });

    it('should propagate DB errors on delete', async () => {
      prisma.vpg_bonuses.findUnique.mockResolvedValue(mockPrismaBonus);
      prisma.vpg_bonuses.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(BonusesService.deleteBonus(1)).rejects.toThrow('Delete failed');
    });
  });
});
