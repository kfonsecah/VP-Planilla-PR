import { prisma } from '../lib/prisma';
import { AguinaldoAccrual, AguinaldoSummaryRow } from '../model/AguinaldoAccrual';
import { Decimal } from '@prisma/client/runtime/library';

export class AguinaldoService {
  /**
   * Calculates the accrued aguinaldo for an employee as of a specific date.
   * Costa Rica Labor Law: Dec 1 of prior year to Nov 30 of current year.
   * 
   * @param employeeId The employee ID
   * @param asOfDate The reference date (defaults to now)
   * @returns AguinaldoAccrual details
   */
  static async calculateAccruedAguinaldo(employeeId: number, asOfDate: Date = new Date()): Promise<AguinaldoAccrual> {
    const year = asOfDate.getFullYear();
    // Period: Dec 1 (Prior Year) -> Nov 30 (Current Year)
    // If we are in Dec, the "Current Year" for aguinaldo purposes is the one that just started.
    const isDecember = asOfDate.getMonth() === 11;
    const periodStart = new Date(isDecember ? year : year - 1, 11, 1); // Dec 1
    const periodEndMax = new Date(isDecember ? year + 1 : year, 10, 30); // Nov 30
    const periodEnd = asOfDate < periodEndMax ? asOfDate : periodEndMax;

    const payrolls = await prisma.vpg_payrolls.findMany({
      where: {
        payrolls_period_end: { gte: periodStart, lte: periodEnd },
        payrolls_status: { in: ['APROBADA', 'PAGADA'] },
        vpg_payroll_employee: { some: { payroll_employee_employee_id: employeeId } }     
      },
      include: { vpg_payroll_employee: { where: { payroll_employee_employee_id: employeeId } } }
    });

    let totalGross = 0;
    payrolls.forEach(p => p.vpg_payroll_employee.forEach(e => totalGross += Number(e.payroll_employee_gross_salary || 0)));

    const accrued = Math.round((totalGross / 12) * 100) / 100;

    // Projection logic - Using more precise month calculation (IN-03)
    const msElapsed = Math.max(0, asOfDate.getTime() - periodStart.getTime());
    const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 365 / 12);
    const monthsCompleted = Math.round(monthsElapsed);

    const projectedAnnual = monthsElapsed > 0.1 ? Math.round(((totalGross / monthsElapsed) * 12 / 12) * 100) / 100 : 0;
    return { 
      accrued, 
      projectedAnnual, 
      periodStart, 
      periodEnd, 
      monthsCompleted, 
      payrollsIncluded: payrolls.length 
    };
  }

  /**
   * Generates an aguinaldo summary for all employees in a specific payroll.
   * Uses bulk groupBy optimization to avoid N+1 queries.
   * 
   * @param payrollId The payroll ID to analyze
   * @returns Array of summary rows
   * @throws Error if payroll not found
   */
  static async getAguinaldoSummaryForPayroll(payrollId: number): Promise<AguinaldoSummaryRow[]> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      include: { 
        vpg_payroll_employee: { 
          include: { 
            vpg_employees: true 
          } 
        } 
      }
    });
    
    if (!payroll) throw new Error('Planilla no encontrada');

    const pStart = payroll.payrolls_period_start;
    const isDec = pStart.getMonth() === 11;
    const fiscalStart = new Date(isDec ? pStart.getFullYear() : pStart.getFullYear() - 1, 11, 1);
    const fiscalEnd = new Date(isDec ? pStart.getFullYear() + 1 : pStart.getFullYear(), 10, 30);

    const employeeIds = payroll.vpg_payroll_employee.map(e => e.payroll_employee_employee_id);

    // BULK QUERY: Get all prior gross salaries for these employees in this fiscal period
    // Exclude the current payrollId to get "before this payroll" amount
    const priorSalaries = await prisma.vpg_payroll_employee.groupBy({
      by: ['payroll_employee_employee_id'],
      _sum: { 
        payroll_employee_gross_salary: true 
      },
      where: {
        vpg_payrolls: {
          payrolls_id: { not: payrollId },
          payrolls_period_end: { gte: fiscalStart, lte: fiscalEnd },
          payrolls_status: { in: ['APROBADA', 'PAGADA'] }
        },
        payroll_employee_employee_id: { in: employeeIds }
      }
    });

    const salaryMap = new Map(
      priorSalaries.map(s => [
        s.payroll_employee_employee_id, 
        Number((s._sum.payroll_employee_gross_salary as Decimal | null) || 0)
      ])
    );

    return payroll.vpg_payroll_employee.map(empRow => {
      const priorGross = salaryMap.get(empRow.payroll_employee_employee_id) || 0;
      const thisGross = Number(empRow.payroll_employee_gross_salary || 0);
      
      return {
        employeeId: empRow.payroll_employee_employee_id,
        employeeName: `${empRow.vpg_employees?.employee_first_name} ${empRow.vpg_employees?.employee_last_name}`,
        accruedBeforeThisPayroll: Math.round((priorGross / 12) * 100) / 100,
        thisPayrollContribution: Math.round((thisGross / 12) * 100) / 100,
        totalAccruedWithThis: Math.round(((priorGross + thisGross) / 12) * 100) / 100,
        periodStart: fiscalStart,
        periodEnd: fiscalEnd
      };
    });
  }
}
