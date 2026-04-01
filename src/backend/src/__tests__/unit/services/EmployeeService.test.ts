import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { EmployeeService } from '../../../service/EmployeeService';
import { Employee } from '../../../model/employee';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaEmployee = {
  employee_id: 1,
  employee_first_name: 'Juan',
  employee_middle_name: 'Carlos',
  employee_last_name: 'Perez',
  employee_national_id: '1-1234-5678',
  employee_social_code: '12345678901',
  employee_email: 'juan@test.com',
  employee_hire_date: new Date('2025-01-01'),
  employee_exit_date: null,
  employee_fired: false,
  employee_status: 'A',
  employee_required_hours_biweekly: 96,
  employee_version: 1,
  employee_position_id: 1,
};

function makeEmployee(input: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    name: 'Juan Carlos',
    last_name: 'Perez',
    middle_name: 'Carlos',
    national_id: '1-1234-5678',
    social_code: '12345678901',
    email: 'juan@test.com',
    position_id: 1,
    hire_date: new Date('2025-01-01'),
    fired: false,
    status: 'active',
    required_hours_biweekly: 96,
    version: 1,
    ...input,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_employees.findUnique.mockResolvedValue(null);
  prisma.vpg_employees.findMany.mockResolvedValue([]);
  prisma.vpg_employees.create.mockResolvedValue(mockPrismaEmployee);
  prisma.vpg_employees.update.mockResolvedValue(mockPrismaEmployee);
});

describe('EmployeeService', () => {
  describe('createEmployee', () => {
    it('should create an employee with all fields', async () => {
      const input = makeEmployee({ email: 'juan@test.com' });

      const result = await EmployeeService.createEmployee(input);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        name: 'Juan Carlos Perez',
        national_id: '1-1234-5678',
        email: 'juan@test.com',
      }));
      expect(prisma.vpg_employees.create).toHaveBeenCalledTimes(1);
    });

    it('should map status "active" to "A"', async () => {
      const input = makeEmployee({ status: 'active' });

      await EmployeeService.createEmployee(input);

      const call = prisma.vpg_employees.create.mock.lastCall;
      expect(call[0].data.employee_status).toBe('A');
    });

    it('should map status "vacation" to "V"', async () => {
      const input = makeEmployee({ status: 'vacation' });

      await EmployeeService.createEmployee(input);

      const call = prisma.vpg_employees.create.mock.lastCall;
      expect(call[0].data.employee_status).toBe('V');
    });

    it('should use existing single-char status if provided', async () => {
      const input = makeEmployee({ status: 'M' });

      await EmployeeService.createEmployee(input);

      const call = prisma.vpg_employees.create.mock.lastCall;
      expect(call[0].data.employee_status).toBe('M');
    });

    it('should throw if database fails', async () => {
      prisma.vpg_employees.create.mockRejectedValue(new Error('DB error'));
      const input = makeEmployee();

      await expect(EmployeeService.createEmployee(input)).rejects.toThrow('DB error');
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee when found', async () => {
      prisma.vpg_employees.findUnique.mockResolvedValue(mockPrismaEmployee);

      const result = await EmployeeService.getEmployeeById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('Juan Carlos Perez');
      expect(prisma.vpg_employees.findUnique).toHaveBeenCalledWith({ where: { employee_id: 1 } });
    });

    it('should return null when employee not found', async () => {
      prisma.vpg_employees.findUnique.mockResolvedValue(null);

      const result = await EmployeeService.getEmployeeById(999);

      expect(result).toBeNull();
    });

    it('should throw if database fails', async () => {
      prisma.vpg_employees.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(EmployeeService.getEmployeeById(1)).rejects.toThrow('DB error');
    });
  });

  describe('updateEmployee', () => {
    it('should update employee fields', async () => {
      prisma.vpg_employees.update.mockResolvedValue({ ...mockPrismaEmployee, employee_first_name: 'Pedro' });

      const result = await EmployeeService.updateEmployee(1, { name: 'Pedro' });

      expect(result).not.toBeNull();
      expect(result!.name).toContain('Pedro');
      expect(prisma.vpg_employees.update).toHaveBeenCalledWith({
        where: { employee_id: 1 },
        data: expect.objectContaining({ employee_first_name: 'Pedro' }),
      });
    });

    it('should throw P2025 when employee not found', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      prisma.vpg_employees.update.mockRejectedValue(error);

      await expect(EmployeeService.updateEmployee(999, { name: 'X' })).rejects.toThrow('Record not found');
    });

    it('should map status "active" to "A" on update', async () => {
      prisma.vpg_employees.update.mockResolvedValue({ ...mockPrismaEmployee, employee_status: 'A' });

      await EmployeeService.updateEmployee(1, { status: 'active' });

      const call = prisma.vpg_employees.update.mock.lastCall;
      expect(call[0].data.employee_status).toBe('A');
    });
  });

  describe('getAllEmployees', () => {
    it('should return all employees', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([mockPrismaEmployee]);

      const result = await EmployeeService.getAllEmployees();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(prisma.vpg_employees.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no employees', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([]);

      const result = await EmployeeService.getAllEmployees();

      expect(result).toEqual([]);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_employees.findMany.mockRejectedValue(new Error('DB error'));

      await expect(EmployeeService.getAllEmployees()).rejects.toThrow('DB error');
    });
  });

  describe('getActiveEmployeesForPeriod', () => {
    it('should return non-fired employees with A or V status', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([mockPrismaEmployee]);

      const result = await EmployeeService.getActiveEmployeesForPeriod(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );

      expect(result).toHaveLength(1);
      const call = prisma.vpg_employees.findMany.mock.lastCall;
      expect(call[0].where.employee_fired).toBe(false);
      expect(call[0].where.employee_status).toEqual({ in: ['A', 'V'] });
    });

    it('should filter by hire_date <= endDate', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([]);

      await EmployeeService.getActiveEmployeesForPeriod(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );

      const call = prisma.vpg_employees.findMany.mock.lastCall;
      expect(call[0].where.employee_hire_date).toEqual({ lte: new Date('2026-01-31') });
    });

    it('should include employees with null exit_date or exit_date >= startDate', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([mockPrismaEmployee]);

      await EmployeeService.getActiveEmployeesForPeriod(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );

      const call = prisma.vpg_employees.findMany.mock.lastCall;
      expect(call[0].where.OR).toEqual([
        { employee_exit_date: null },
        { employee_exit_date: { gte: new Date('2026-01-01') } },
      ]);
    });

    it('should return empty array when no active employees', async () => {
      prisma.vpg_employees.findMany.mockResolvedValue([]);

      const result = await EmployeeService.getActiveEmployeesForPeriod(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
      );

      expect(result).toEqual([]);
    });

    it('should throw if database fails', async () => {
      prisma.vpg_employees.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        EmployeeService.getActiveEmployeesForPeriod(new Date('2026-01-01'), new Date('2026-01-31')),
      ).rejects.toThrow('DB error');
    });
  });
});
