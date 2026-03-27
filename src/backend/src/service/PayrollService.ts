import { prisma } from '../lib/prisma';
import { Payroll } from "../model/payroll";

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

      return rows.map((row) => ({
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
        gross_salary: Number(row.payroll_employee_gross_salary) || 0,
        total_deductions: Number(row.payroll_employee_total_deductions) || 0,
        net_salary: Number(row.payroll_employee_net_salary) || 0,
        version: row.payroll_employee_version,
      }));
    } catch (error) {
      console.error('Error fetching payroll employees:', error);
      throw new Error('Failed to retrieve payroll employees');
    }
  }

  
}
