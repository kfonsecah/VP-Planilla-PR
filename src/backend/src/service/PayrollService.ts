import { prisma } from '../lib/prisma';
import { Payroll } from "../model/payroll";
import { PayrollStatus } from '@prisma/client';
import { calculateGrossSalary, countWorkingDaysInPeriod, calculateScheduledHours, PayrollHoliday, calculateRegularHours, calculateOvertimeHours, calculateWeeklyRestHours } from '../utils/payrollUtils';
import { DayWork } from '../types/payroll.types';

export class PayrollService {
  /**
   * Create a new payroll record in the system
   * @param data - Payroll data to create
   * @returns Promise<Payroll> - The created payroll with assigned ID and version
   * @throws Error if payroll creation fails
   */
  static async createPayroll(data: Payroll): Promise<Payroll> {
    const createdPayroll = await prisma.vpg_payrolls.create({
      data: {
        payrolls_payroll_type_id: data.payroll_type,
        payrolls_period_start: data.period_start,
        payrolls_period_end: data.period_end,
        payrolls_payment_date: data.payment_date,
        payrolls_status: data.status,
        payrolls_version: 1,
      },
    });
    const payroll: Payroll = {
      id: createdPayroll.payrolls_id,
      payroll_type: createdPayroll.payrolls_payroll_type_id,
      period_start: createdPayroll.payrolls_period_start,
      period_end: createdPayroll.payrolls_period_end,
      payment_date: createdPayroll.payrolls_payment_date,
      status: createdPayroll.payrolls_status,
      version: createdPayroll.payrolls_version,
    };
    return payroll;
  }

  /**
   * Get all payroll records with aggregated employee data
   * @returns Promise<Payroll[]> - Array of all payroll records with statistics
   * @throws Error if database query fails
   */
  static async getAllPayrolls(): Promise<any[]> {
    const payrolls = await prisma.vpg_payrolls.findMany({
      include: {
        vpg_payroll_employee: true
      },
      orderBy: {
        payrolls_id: 'desc'
      }
    });
    
    return payrolls.map(payroll => {
      const employees = payroll.vpg_payroll_employee || [];
      
      // Calculate aggregated statistics
      const totalEmployees = employees.length;
      const totalGross = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_gross_salary || 0), 0);
      const totalDeductions = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_total_deductions || 0), 0);
      const totalNet = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_net_salary || 0), 0);
      const totalBonuses = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_bonuses || 0), 0);
      const totalHours = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_total_hours || 0), 0);
      const totalOvertimeHours = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_overtime_hours || 0), 0);
      const totalWeeklyRestHours = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_weekly_rest_hours || 0), 0);
      const totalOvertimePay = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_overtime_pay || 0), 0);
      const totalWeeklyRestPay = employees.reduce((sum, emp) => sum + Number(emp.payroll_employee_weekly_rest_pay || 0), 0);
      
      return {
        id: payroll.payrolls_id,
        payroll_type: payroll.payrolls_payroll_type_id,
        period_start: payroll.payrolls_period_start,
        period_end: payroll.payrolls_period_end,
        payment_date: payroll.payrolls_payment_date,
        status: payroll.payrolls_status,
        version: payroll.payrolls_version,
        // Aggregated statistics
        total_employees: totalEmployees,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        total_bonuses: totalBonuses,
        total_hours: totalHours,
        total_overtime_hours: totalOvertimeHours,
        total_weekly_rest_hours: totalWeeklyRestHours,
        total_overtime_pay: totalOvertimePay,
        total_weekly_rest_pay: totalWeeklyRestPay,
      };
    });
  }

  /**
   * Get a payroll record by its ID
   * @param id - The ID of the payroll to retrieve
   * @returns Promise<Payroll | null> - The payroll record or null if not found
   * @throws Error if database query fails
   */
  static async getPayrollById(id: number): Promise<Payroll | null> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: id },
    });
    if (!payroll) return null;
    return {
      id: payroll.payrolls_id,
      payroll_type: payroll.payrolls_payroll_type_id,
      period_start: payroll.payrolls_period_start,
      period_end: payroll.payrolls_period_end,
      payment_date: payroll.payrolls_payment_date,
      status: payroll.payrolls_status,
      version: payroll.payrolls_version,
    };
  }

  /**
   * Update an existing payroll record
   * @param id - The ID of the payroll to update
   * @param data - Updated payroll data
   * @returns Promise<Payroll | null> - The updated payroll record or null if not found
   * @throws Error if payroll is not found or update fails
   */
  static async updatePayroll(
    id: number,
    data: Payroll
  ): Promise<Payroll | null> {
    const updatedPayroll = await prisma.vpg_payrolls.update({
      where: { payrolls_id: id },
      data: {
        payrolls_payroll_type_id: data.payroll_type,
        payrolls_period_start: data.period_start,
        payrolls_period_end: data.period_end,
        payrolls_payment_date: data.payment_date,
        payrolls_status: data.status,
        payrolls_version: (data.version ?? 0) + 1,
      },
    });
    if (!updatedPayroll) throw new Error('Payroll not found');
    
    return {
      id: updatedPayroll.payrolls_id,
      payroll_type: updatedPayroll.payrolls_payroll_type_id,
      period_start: updatedPayroll.payrolls_period_start,
      period_end: updatedPayroll.payrolls_period_end,
      payment_date: updatedPayroll.payrolls_payment_date,
      status: updatedPayroll.payrolls_status,
      version: updatedPayroll.payrolls_version,
    };
  }

  /**
   * Get all employees for a specific payroll with their calculations
   * @param payrollId - The ID of the payroll
   * @returns Promise<any[]> - Array of employees with their payroll calculations
   * @throws Error if database query fails
   */
  static async getPayrollEmployees(payrollId: number): Promise<any[]> {
    try {
      // Get the payroll to access period dates
      const payroll = await prisma.vpg_payrolls.findUnique({
        where: { payrolls_id: payrollId },
        select: {
          payrolls_period_start: true,
          payrolls_period_end: true
        }
      });
      
      if (!payroll) {
        throw new Error('Payroll not found');
      }

      // Fetch company holidays for the payroll period
      const holidays = await prisma.vpg_company_holidays.findMany({
        where: {
          company_holidays_date: {
            gte: payroll.payrolls_period_start,
            lte: payroll.payrolls_period_end
          },
          company_holidays_status: 'active'
        }
      });

      // Format holidays for payrollUtils
      const formattedHolidays: PayrollHoliday[] = holidays.map(h => ({
        company_holidays_date: h.company_holidays_date,
        company_holidays_is_mandatory: !!h.company_holidays_is_mandatory,
        company_holidays_is_triple: !!h.company_holidays_is_triple
      }));

      const rows = await prisma.vpg_payroll_employee.findMany({
        where: { payroll_employee_payroll_id: payrollId },
        orderBy: { payroll_employee_id: 'asc' },
        include: {
          vpg_employees: {
            select: {
              employee_first_name: true,
              employee_last_name: true,
              employee_middle_name: true,
              employee_national_id: true,
              vpg_positions: { select: { position_name: true } },
            },
          },
        },
      });

      return rows.map((row) => {
        // Convert DayWork array for calculations
        // Note: In a real implementation, we would fetch actual DayWork data from clock logs
        // For now, we'll use placeholder data to demonstrate the holiday integration
        const dayWork: DayWork[] = []; // This would be populated from actual clock log data
        
        // Calculate regular hours (capped at 8h/day)
        const regularHours = calculateRegularHours(dayWork);
        
        // Calculate overtime hours
        const overtimeHours = calculateOvertimeHours(dayWork);
        
        // Calculate scheduled hours (required hours for period)
        const scheduledHours = calculateScheduledHours(
          payroll.payrolls_period_start,
          payroll.payrolls_period_end,
          formattedHolidays
        );
        
        // Calculate weekly rest hours
        const weeklyRestHours = calculateWeeklyRestHours(
          regularHours,
          payroll.payrolls_period_start,
          payroll.payrolls_period_end
        );
        
        // Calculate gross salary with holiday considerations
        // Note: This is a simplified version - in reality we'd need to analyze each day's work
        const grossSalary = calculateGrossSalary(
          dayWork,
          0, // base hourly rate
          0, // bonuses
          payroll.payrolls_period_start,
          payroll.payrolls_period_end,
          formattedHolidays
        );

        return {
          id: row.payroll_employee_id,
          payroll_id: row.payroll_employee_payroll_id,
          employee_id: row.payroll_employee_employee_id,
          employee_name: `${row.vpg_employees.employee_first_name} ${row.vpg_employees.employee_last_name}${row.vpg_employees.employee_middle_name ? ' ' + row.vpg_employees.employee_middle_name : ''}`.trim(),
          employee_identification: row.vpg_employees.employee_national_id,
          position_name: row.vpg_employees.vpg_positions?.position_name,
          total_hours: Number(row.payroll_employee_total_hours) || 0,
          overtime_hours: Number(row.payroll_employee_overtime_hours) || 0,
          overtime_pay: Number(row.payroll_employee_overtime_pay) || 0,
          weekly_rest_hours: Number(row.payroll_employee_weekly_rest_hours) || 0,
          weekly_rest_pay: Number(row.payroll_employee_weekly_rest_pay) || 0,
          bonuses: Number(row.payroll_employee_bonuses) || 0,
          gross_salary: grossSalary,
          total_deductions: Number(row.payroll_employee_total_deductions) || 0,
          net_salary: Number(row.payroll_employee_net_salary) || 0,
          version: row.payroll_employee_version,
        };
      });
    } catch (error) {
      console.error('Error fetching payroll employees:', error);
      throw new Error('Failed to retrieve payroll employees');
    }
  }

  /**
   * Map database record to Payroll interface
   */
  private static mapToPayroll(dbRecord: any): Payroll {
    return {
      id: dbRecord.payrolls_id,
      payroll_type: dbRecord.payrolls_payroll_type_id,
      period_start: dbRecord.payrolls_period_start,
      period_end: dbRecord.payrolls_period_end,
      payment_date: dbRecord.payrolls_payment_date,
      status: dbRecord.payrolls_status,
      version: dbRecord.payrolls_version,
      approved_by: dbRecord.payrolls_approved_by,
      approved_at: dbRecord.payrolls_approved_at,
      reopened_at: dbRecord.payrolls_reopened_at,
      reopen_reason: dbRecord.payrolls_reopen_reason,
    };
  }

  /**
   * Approve a payroll — transition from BORRADOR to APROBADA
   * @param payrollId - The ID of the payroll to approve
   * @param userId - The ID of the user approving the payroll
   * @returns Promise<Payroll> - The updated payroll
   * @throws Error if payroll not found or not in BORRADOR status
   */
  static async approvePayroll(payrollId: number, userId: number): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
      throw new Error('Solo las planillas en estado BORRADOR pueden ser aprobadas');
    }
    
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_approved_by: userId,
        payrolls_approved_at: new Date(),
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    return this.mapToPayroll(updated);
  }

  /**
   * Mark a payroll as paid — transition from APROBADA to PAGADA
   * @param payrollId - The ID of the payroll to mark as paid
   * @returns Promise<Payroll> - The updated payroll
   * @throws Error if payroll not found or not in APROBADA status
   */
  static async markAsPaid(payrollId: number): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.APROBADA) {
      throw new Error('Solo las planillas en estado APROBADA pueden ser marcadas como pagadas');
    }
    
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_status: PayrollStatus.PAGADA,
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    // Lock clock log adjustments for this payroll period
    await this.lockAdjustmentsForPayroll(payrollId, payroll.payrolls_period_start, payroll.payrolls_period_end);
    
    return this.mapToPayroll(updated);
  }

  /**
   * Lock clock log adjustments for a paid payroll period
   * @param payrollId - The payroll ID
   * @param periodStart - Period start date
   * @param periodEnd - Period end date
   */
  private static async lockAdjustmentsForPayroll(payrollId: number, periodStart: Date, periodEnd: Date): Promise<void> {
    // TODO: Implement lock adjustments logic - mark clock logs as non-adjustable for this period
    console.log(`Locking adjustments for payroll ${payrollId} period ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
  }

  /**
   * Reopen a payroll — transition from APROBADA to BORRADOR with audit trail
   * @param payrollId - The ID of the payroll to reopen
   * @param userId - The ID of the user reopening the payroll
   * @param reason - Reason for reopening (minimum 10 characters)
   * @returns Promise<Payroll> - The updated payroll
   * @throws Error if payroll not found, not in APROBADA status, or reason too short
   */
  static async reopenPayroll(payrollId: number, userId: number, reason: string): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.APROBADA) {
      throw new Error('Solo las planillas en estado APROBADA pueden ser reopenidas');
    }
    if (!reason || reason.length < 10) {
      throw new Error('El motivo de reapertura debe tener al menos 10 caracteres');
    }
    
    const [updated] = await prisma.$transaction([
      prisma.vpg_payrolls.update({
        where: { payrolls_id: payrollId },
        data: {
          payrolls_status: PayrollStatus.BORRADOR,
          payrolls_reopened_at: new Date(),
          payrolls_reopen_reason: reason,
          payrolls_approved_by: null,
          payrolls_approved_at: null,
          payrolls_version: payroll.payrolls_version + 1
        }
      }),
      prisma.vpg_audit_logs.create({
        data: {
          audit_logs_user_id: userId,
          audit_logs_action: 'REOPEN_PAYROLL',
          audit_logs_entity: 'payroll',
          audit_logs_entity_id: payrollId,
          audit_logs_timestamp: new Date(),
          audit_logs_details: JSON.stringify({ reason, previous_status: PayrollStatus.APROBADA })
        }
      })
    ]);
    
    return this.mapToPayroll(updated);
  }

  /**
   * Recalculate a payroll in BORRADOR state — saves snapshot before recalculation
   * @param payrollId - The ID of the payroll to recalculate
   * @param userId - The ID of the user requesting recalculation
   * @param reason - Reason for recalculation
   * @returns Promise<Payroll> - The updated payroll
   * @throws Error if payroll not found or not in BORRADOR status
   */
  static async recalculatePayroll(payrollId: number, userId: number, reason: string): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      include: { vpg_payroll_employee: true }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
      throw new Error('Solo las planillas en estado BORRADOR pueden ser recalculadas');
    }
    
    // Save current snapshot before recalculating
    await prisma.vpg_payroll_recalculations.create({
      data: {
        recalc_payroll_id: payrollId,
        recalc_reason: reason,
        recalc_created_by: userId,
        recalc_data_snapshot: JSON.stringify(payroll)
      }
    });
    
    // Increment version
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    return this.mapToPayroll(updated);
  }

  /**
   * Calculate aguinaldo proportional for an employee
   * Based on Costa Rica Labor Code Article 196
   * Period: December 1 to November 30
   * Formula: (sum of gross salaries) / 12
   * @param employeeId - The ID of the employee
   * @param year - The year for which to calculate aguinaldo (the year ending Nov 30)
   * @returns Promise<{ total: number; months: number; promedio: number }>
   */
  static async calculateAguinaldo(
    employeeId: number,
    year: number
  ): Promise<{ total: number; months: number; promedio: number }> {
    const periodStart = new Date(`${year - 1}-12-01`);
    const periodEnd = new Date(`${year}-11-30`);
    
    // Get all payrolls in the period with status APROBADA or PAGADA
    const payrolls = await prisma.vpg_payrolls.findMany({
      where: {
        payrolls_period_end: { gte: periodStart, lte: periodEnd },
        payrolls_status: { in: [PayrollStatus.APROBADA, PayrollStatus.PAGADA] }
      },
      include: {
        vpg_payroll_employee: {
          where: { payroll_employee_employee_id: employeeId }
        }
      }
    });
    
    // Sum gross salaries
    let totalGross = 0;
    let monthsWithSalary = 0;
    
    for (const payroll of payrolls) {
      for (const emp of payroll.vpg_payroll_employee) {
        const gross = Number(emp.payroll_employee_gross_salary || 0);
        totalGross += gross;
        if (gross > 0) monthsWithSalary++;
      }
    }
    
    // Aguinaldo formula: sum / 12 (even for partial years)
    const aguinaldo = totalGross / 12;
    
    return {
      total: aguinaldo,
      months: monthsWithSalary,
      promedio: monthsWithSalary > 0 ? totalGross / monthsWithSalary : 0
    };
  }

  
}
