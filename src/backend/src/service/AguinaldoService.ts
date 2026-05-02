import { prisma } from '../lib/prisma';
import { AguinaldoAccrual, AguinaldoConfig, AguinaldoSummaryRow } from '../model/AguinaldoAccrual';
import { Decimal } from '@prisma/client/runtime/library';

export class AguinaldoService {
  /**
   * Loads the aguinaldo fiscal period configuration from enterprise settings.
   * Falls back to Costa Rica defaults (Dec 1 – Nov 30, deadline day 20) if not set.
   * @returns AguinaldoConfig
   */
  static async getAguinaldoConfig(): Promise<AguinaldoConfig> {
    const enterprise = await prisma.vpg_enterprise.findFirst({
      select: {
        enterprise_aguinaldo_period_start_month: true,
        enterprise_aguinaldo_period_start_day: true,
        enterprise_aguinaldo_payment_deadline_day: true,
      }
    });
    return {
      periodStartMonth: enterprise?.enterprise_aguinaldo_period_start_month ?? 12,
      periodStartDay: enterprise?.enterprise_aguinaldo_period_start_day ?? 1,
      paymentDeadlineDay: enterprise?.enterprise_aguinaldo_payment_deadline_day ?? 20,
    };
  }

  /**
   * Determines the fiscal period boundaries for a given reference date and config.
   * During the payment month, shows the prior period until paymentDeadlineDay (grace period).
   *
   * @param asOfDate Reference date
   * @param config Aguinaldo period configuration
   * @returns { periodStart, periodEnd } — full fiscal year boundaries
   */
  static getFiscalPeriod(asOfDate: Date, config: AguinaldoConfig): { periodStart: Date; periodEnd: Date } {
    const { periodStartMonth, periodStartDay, paymentDeadlineDay } = config;
    const month0 = periodStartMonth - 1; // convert to 0-indexed
    const year = asOfDate.getFullYear();

    const isPaymentMonth = asOfDate.getMonth() === month0;
    const usePriorPeriod = isPaymentMonth && asOfDate.getDate() <= paymentDeadlineDay;

    let anchorYear: number;
    if (isPaymentMonth && !usePriorPeriod) {
      anchorYear = year;            // post-deadline: new period just started
    } else if (isPaymentMonth && usePriorPeriod) {
      anchorYear = year - 1;        // grace period: show the period that just ended
    } else if (asOfDate.getMonth() < month0) {
      anchorYear = year - 1;        // before payment month: period started last year
    } else {
      anchorYear = year;            // after payment month: period started this year
    }

    const periodStart = new Date(anchorYear, month0, periodStartDay);
    // Period end = day before next period starts (works correctly when periodStartDay=1 via day-0 trick)
    const periodEnd = new Date(anchorYear + 1, month0, periodStartDay - 1);

    return { periodStart, periodEnd };
  }

  /**
   * Calculates the accrued aguinaldo for an employee as of a specific date.
   * Fiscal period boundaries are driven by enterprise configuration.
   *
   * @param employeeId The employee ID
   * @param asOfDate The reference date (defaults to now)
   * @returns AguinaldoAccrual details
   */
  static async calculateAccruedAguinaldo(employeeId: number, asOfDate: Date = new Date()): Promise<AguinaldoAccrual> {
    const [config, employee] = await Promise.all([
      AguinaldoService.getAguinaldoConfig(),
      prisma.vpg_employees.findUnique({
        where: { employee_id: employeeId },
        select: { employee_hire_date: true }
      })
    ]);

    const { periodStart, periodEnd: periodEndMax } = AguinaldoService.getFiscalPeriod(asOfDate, config);
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

    // Projection: use hire date as effective start if the employee joined mid-period (WR-02)
    const hireDate = (employee?.employee_hire_date as Date | null) || periodStart;
    const effectiveStart = hireDate > periodStart ? hireDate : periodStart;

    const msElapsed = Math.max(0, asOfDate.getTime() - effectiveStart.getTime());
    const actualMonthsWorked = msElapsed / (1000 * 60 * 60 * 24 * 365 / 12);
    const monthsCompleted = Math.round(actualMonthsWorked);

    const projectedAnnual = actualMonthsWorked > 0.1 ? Math.round((totalGross / actualMonthsWorked) * 100) / 100 : 0;

    return { accrued, projectedAnnual, periodStart, periodEnd, monthsCompleted, payrollsIncluded: payrolls.length };
  }

  /**
   * Generates an aguinaldo summary for all employees in a specific payroll.
   * Uses the same fiscal period config as calculateAccruedAguinaldo to ensure consistency.
   * Uses bulk groupBy optimization to avoid N+1 queries.
   *
   * @param payrollId The payroll ID to analyze
   * @returns Array of summary rows
   * @throws Error if payroll not found
   */
  static async getAguinaldoSummaryForPayroll(payrollId: number): Promise<AguinaldoSummaryRow[]> {
    const [payroll, config] = await Promise.all([
      prisma.vpg_payrolls.findUnique({
        where: { payrolls_id: payrollId },
        include: { vpg_payroll_employee: { include: { vpg_employees: true } } }
      }),
      AguinaldoService.getAguinaldoConfig()
    ]);

    if (!payroll) throw new Error('Planilla no encontrada');

    const { periodStart: fiscalStart, periodEnd: fiscalEnd } = AguinaldoService.getFiscalPeriod(
      payroll.payrolls_period_start,
      config
    );

    const employeeIds = payroll.vpg_payroll_employee.map(e => e.payroll_employee_employee_id);

    // BULK QUERY: prior gross salaries for these employees in this fiscal period
    const priorSalaries = await prisma.vpg_payroll_employee.groupBy({
      by: ['payroll_employee_employee_id'],
      _sum: { payroll_employee_gross_salary: true },
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
