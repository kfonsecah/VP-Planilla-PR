import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { VacationService } from '../../../service/VacationService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaVacation = {
  vacations_id: 1,
  vacations_employee_id: 10,
  vacations_start_date: new Date('2026-01-01'),
  vacations_end_date: new Date('2026-01-15'),
  vacations_total_days: 14,
  vacations_paid: true,
  vacations_status: 'approved',
  vacations_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_vacations.findUnique.mockResolvedValue(null);
  prisma.vpg_vacations.findMany.mockResolvedValue([]);
  prisma.vpg_vacations.create.mockResolvedValue(mockPrismaVacation);
  prisma.vpg_vacations.update.mockResolvedValue(mockPrismaVacation);
  prisma.vpg_vacations.delete.mockResolvedValue(mockPrismaVacation);
});

describe('VacationService', () => {
  describe('getVacationById', () => {
    it('should return a vacation when found with correct field mapping', async () => {
      prisma.vpg_vacations.findUnique.mockResolvedValue(mockPrismaVacation);

      const result = await VacationService.getVacationById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.employee_id).toBe(10);
      expect(result!.total_days).toBe(14);
      expect(result!.paid).toBe(true);
      expect(result!.status).toBe('approved');
      expect(result!.version).toBe(1);
      expect(prisma.vpg_vacations.findUnique).toHaveBeenCalledWith({
        where: { vacations_id: 1 },
      });
    });

    it('should return null when vacation not found', async () => {
      prisma.vpg_vacations.findUnique.mockResolvedValue(null);

      const result = await VacationService.getVacationById(999);

      expect(result).toBeNull();
    });

    it('should propagate DB errors', async () => {
      prisma.vpg_vacations.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(VacationService.getVacationById(1)).rejects.toThrow('DB error');
    });
  });

  describe('getAllVacations', () => {
    it('should return mapped array of vacations', async () => {
      prisma.vpg_vacations.findMany.mockResolvedValue([mockPrismaVacation]);

      const result = await VacationService.getAllVacations();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].employee_id).toBe(10);
      expect(result[0].total_days).toBe(14);
    });

    it('should return empty array when no vacations', async () => {
      prisma.vpg_vacations.findMany.mockResolvedValue([]);

      const result = await VacationService.getAllVacations();

      expect(result).toEqual([]);
    });

    it("should silently return [] when error message contains 'does not exist'", async () => {
      prisma.vpg_vacations.findMany.mockRejectedValue(
        new Error('Table does not exist in the schema'),
      );

      const result = await VacationService.getAllVacations();

      expect(result).toEqual([]);
    });

    it("should silently return [] when error message contains 'p2021'", async () => {
      prisma.vpg_vacations.findMany.mockRejectedValue(
        new Error('P2021: table not found'),
      );

      const result = await VacationService.getAllVacations();

      expect(result).toEqual([]);
    });

    it('should propagate other DB errors (not swallow)', async () => {
      prisma.vpg_vacations.findMany.mockRejectedValue(new Error('Connection refused'));

      await expect(VacationService.getAllVacations()).rejects.toThrow('Connection refused');
    });
  });

  describe('createVacation', () => {
    it('should create a vacation and return mapped result', async () => {
      const input = {
        employee_id: 10,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-15'),
        total_days: 14,
        paid: true,
        status: 'approved',
      };

      const result = await VacationService.createVacation(input);

      expect(result.id).toBe(1);
      expect(result.employee_id).toBe(10);
      expect(result.total_days).toBe(14);
      expect(result.paid).toBe(true);
      expect(result.status).toBe('approved');
      expect(prisma.vpg_vacations.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateVacation', () => {
    it('should update a vacation and return updated record with incremented version', async () => {
      const updatedMock = { ...mockPrismaVacation, vacations_status: 'completed', vacations_version: 2 };
      prisma.vpg_vacations.update.mockResolvedValue(updatedMock);

      const input = {
        employee_id: 10,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-01-15'),
        total_days: 14,
        paid: true,
        status: 'completed',
      };

      const result = await VacationService.updateVacation(1, input);

      expect(result).not.toBeNull();
      expect(result!.status).toBe('completed');
      expect(result!.version).toBe(2);
      expect(prisma.vpg_vacations.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vacations_id: 1 },
        }),
      );
    });
  });

  describe('deleteVacation', () => {
    it('should return true when vacation is deleted successfully', async () => {
      const result = await VacationService.deleteVacation(1);

      expect(result).toBe(true);
      expect(prisma.vpg_vacations.delete).toHaveBeenCalledWith({
        where: { vacations_id: 1 },
      });
    });

    it('should propagate DB errors on delete', async () => {
      prisma.vpg_vacations.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(VacationService.deleteVacation(999)).rejects.toThrow('Delete failed');
    });
  });
});
