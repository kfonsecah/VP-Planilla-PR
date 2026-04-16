import { prisma } from '../lib/prisma';
import { 
  ClockLogAdjustmentType, 
  ClockLogAdjustmentStatus, 
  ClockLogType,
  ClockLogSource,
  PayrollStatus
} from '@prisma/client';
import { CreateAdjustmentInput } from '../schemas/AdjustmentSchema';
import { AuditLogsService } from './AuditLogsService';

/**
 * Service for managing clock log adjustments (ADD, EDIT, VOID).
 * These adjustments are non-destructive and auditable.
 */
export class ClockLogAdjustmentService {
  /**
   * Creates a new clock log adjustment.
   * 
   * @param data - The adjustment data (validated by Zod)
   * @param userId - The ID of the user creating the adjustment
   * @returns The created adjustment record
   * @throws Error if justification is too short or if payroll is locked (PAGADA)
   */
  static async createAdjustment(data: CreateAdjustmentInput, userId: number) {
    // 1. Mandatory validation for justification length (redundant with Zod but safe)
    if (data.justification.length < 10) {
      throw new Error('La justificación debe tener al menos 10 caracteres');
    }

    // 2. Check Payroll Lock
    const targetTimestamp = data.type === 'VOID' ? null : new Date(data.new_timestamp);
    
    // For EDIT/VOID, we might need the original timestamp if not provided in 'new_timestamp'
    let originalTimestamp: Date | null = null;
    let clockLogId: number | null = null;

    if (data.type === 'EDIT' || data.type === 'VOID') {
      clockLogId = data.clock_log_id;
      const originalLog = await prisma.vpg_clock_logs.findUnique({
        where: { clock_logs_id: clockLogId }
      });

      if (!originalLog) {
        throw new Error('Marca original no encontrada');
      }
      originalTimestamp = originalLog.clock_logs_timestamp;
    }

    // 3. Perform atomic operation: Check Lock + Create Adjustment + Create Audit Log
    return await prisma.$transaction(async (tx) => {
      // Check lock for the original timestamp (if EDIT/VOID)
      if (originalTimestamp) {
        await this.checkPayrollLock(data.employee_id, originalTimestamp, tx);
      }

      // Check lock for the new timestamp (if ADD/EDIT)
      if (targetTimestamp) {
        await this.checkPayrollLock(data.employee_id, targetTimestamp, tx);
      }

      const adjustment = await tx.vpg_clock_log_adjustments.create({
        data: {
          adjustment_clock_log_id: clockLogId,
          adjustment_employee_id: data.employee_id,
          adjustment_type: data.type as ClockLogAdjustmentType,
          adjustment_original_timestamp: originalTimestamp,
          adjustment_new_timestamp: targetTimestamp,
          adjustment_log_type: data.log_type as ClockLogType,
          adjustment_justification: data.justification,
          adjustment_status: ClockLogAdjustmentStatus.ACTIVE,
          adjustment_created_by: userId,
        }
      });

      // For ADD: also create the actual clock log entry
      if (data.type === 'ADD' && targetTimestamp) {
        await tx.vpg_clock_logs.create({
          data: {
            clock_logs_employee_id: data.employee_id,
            clock_logs_timestamp: targetTimestamp,
            clock_logs_log_type: data.log_type as ClockLogType,
            clock_logs_source: ClockLogSource.manual,
          }
        });
      }

      await AuditLogsService.createAuditLog({
        userId,
        action: 'clock_log_adjustment_create',
        entity: 'vpg_clock_log_adjustments',
        entityId: adjustment.adjustment_id,
        details: `Created ${data.type} adjustment for employee ${data.employee_id}. Justification: ${data.justification}`
      }, tx);

      return adjustment;
    });
  }

  /**
   * Checks if an employee has a payroll with status 'PAGADA' or 'APROBADA' for a given timestamp.
   * 
   * @param employeeId - The employee ID
   * @param timestamp - The timestamp to check
   * @param tx - Optional transaction client
   * @throws Error if a locked payroll is found
   */
  private static async checkPayrollLock(employeeId: number, timestamp: Date, tx?: any): Promise<void> {
    const prismaClient = tx || prisma;
    const lockedPayroll = await prismaClient.vpg_payrolls.findFirst({
      where: {
        payrolls_status: {
          in: [PayrollStatus.PAGADA, PayrollStatus.APROBADA]
        },
        payrolls_period_start: { lte: timestamp },
        payrolls_period_end: { gte: timestamp },
        vpg_payroll_employee: {
          some: {
            payroll_employee_employee_id: employeeId
          }
        }
      }
    });

    if (lockedPayroll) {
      throw new Error(`No se pueden realizar ajustes a marcas de periodos de planilla con estado ${lockedPayroll.payrolls_status}`);
    }
  }
}
