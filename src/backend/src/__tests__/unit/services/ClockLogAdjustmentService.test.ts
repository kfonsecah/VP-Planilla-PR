import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { ClockLogAdjustmentService } from '../../../service/ClockLogAdjustmentService';
import { AuditLogsService } from '../../../service/AuditLogsService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

describe('ClockLogAdjustmentService', () => {
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    // Allow $transaction to execute the callback with the mock prisma as the tx client
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<any>) => fn(prisma));
    
    // Default mocks for payroll lock check (no locked payroll found)
    prisma.vpg_payrolls.findFirst.mockResolvedValue(null);
  });

  describe('createAdjustment', () => {
    it('should create an ADD adjustment successfully', async () => {
      const data = {
        type: 'ADD' as const,
        employee_id: 101,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Forgot to clock in this morning',
      };

      prisma.vpg_clock_log_adjustments.create.mockResolvedValue({
        adjustment_id: 1,
        ...data,
      } as any);

      const result = await ClockLogAdjustmentService.createAdjustment(data, userId);

      expect(result).toBeDefined();
      expect(prisma.vpg_clock_log_adjustments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adjustment_employee_id: 101,
            adjustment_type: 'ADD',
            adjustment_new_timestamp: new Date(data.new_timestamp),
            adjustment_log_type: 'IN',
            adjustment_justification: data.justification,
            adjustment_created_by: userId,
            adjustment_status: 'ACTIVE',
          }),
        })
      );
      expect(prisma.vpg_audit_logs.create).toHaveBeenCalled();
    });

    it('should create an EDIT adjustment successfully', async () => {
      const originalLog = {
        clock_logs_id: 500,
        clock_logs_timestamp: new Date('2026-02-02T08:15:00.000Z'),
        clock_logs_log_type: 'IN',
      };
      
      const data = {
        type: 'EDIT' as const,
        employee_id: 101,
        clock_log_id: 500,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Correcting late clock-in',
      };

      prisma.vpg_clock_logs.findUnique.mockResolvedValue(originalLog as any);
      prisma.vpg_clock_log_adjustments.create.mockResolvedValue({
        adjustment_id: 2,
        ...data,
      } as any);

      const result = await ClockLogAdjustmentService.createAdjustment(data, userId);

      expect(result).toBeDefined();
      expect(prisma.vpg_clock_log_adjustments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adjustment_clock_log_id: 500,
            adjustment_original_timestamp: originalLog.clock_logs_timestamp,
            adjustment_new_timestamp: new Date(data.new_timestamp),
            adjustment_type: 'EDIT',
          }),
        })
      );
    });

    it('should create a VOID adjustment successfully', async () => {
      const originalLog = {
        clock_logs_id: 500,
        clock_logs_timestamp: new Date('2026-02-02T08:00:00.000Z'),
        clock_logs_log_type: 'IN',
      };
      
      const data = {
        type: 'VOID' as const,
        employee_id: 101,
        clock_log_id: 500,
        log_type: 'IN' as const,
        justification: 'Clocked in by mistake',
      };

      prisma.vpg_clock_logs.findUnique.mockResolvedValue(originalLog as any);
      prisma.vpg_clock_log_adjustments.create.mockResolvedValue({
        adjustment_id: 3,
        ...data,
      } as any);

      const result = await ClockLogAdjustmentService.createAdjustment(data, userId);

      expect(result).toBeDefined();
      expect(prisma.vpg_clock_log_adjustments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adjustment_clock_log_id: 500,
            adjustment_type: 'VOID',
            adjustment_new_timestamp: null,
            adjustment_original_timestamp: originalLog.clock_logs_timestamp,
          }),
        })
      );
    });

    it('should throw error if justification is too short', async () => {
      const data = {
        type: 'ADD' as const,
        employee_id: 101,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Too short',
      };

      await expect(ClockLogAdjustmentService.createAdjustment(data, userId))
        .rejects.toThrow('La justificación debe tener al menos 10 caracteres');
    });

    it('should throw error if original log not found for EDIT/VOID', async () => {
      const data = {
        type: 'EDIT' as const,
        employee_id: 101,
        clock_log_id: 999,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Correcting non-existent log',
      };

      prisma.vpg_clock_logs.findUnique.mockResolvedValue(null);

      await expect(ClockLogAdjustmentService.createAdjustment(data, userId))
        .rejects.toThrow('Marca original no encontrada');
    });

    it('should block adjustment if payroll is PAGADA (Payroll Lock)', async () => {
      const data = {
        type: 'ADD' as const,
        employee_id: 101,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Forgot to clock in on locked period',
      };

      // Mock finding a PAGADA payroll for this employee and period
      prisma.vpg_payrolls.findFirst.mockResolvedValue({
        payrolls_id: 10,
        payrolls_status: 'PAGADA',
      } as any);

      await expect(ClockLogAdjustmentService.createAdjustment(data, userId))
        .rejects.toThrow('No se pueden realizar ajustes a marcas de periodos de planilla con estado PAGADA');
    });

    it('should create an audit log entry', async () => {
      const data = {
        type: 'ADD' as const,
        employee_id: 101,
        new_timestamp: '2026-02-02T08:00:00.000Z',
        log_type: 'IN' as const,
        justification: 'Forgot to clock in this morning',
      };

      prisma.vpg_clock_log_adjustments.create.mockResolvedValue({
        adjustment_id: 55,
        ...data,
      } as any);

      await ClockLogAdjustmentService.createAdjustment(data, userId);

      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            audit_logs_user_id: userId,
            audit_logs_action: 'clock_log_adjustment_create',
            audit_logs_entity: 'vpg_clock_log_adjustments',
            audit_logs_entity_id: 55,
          }),
        })
      );
    });
  });
});
