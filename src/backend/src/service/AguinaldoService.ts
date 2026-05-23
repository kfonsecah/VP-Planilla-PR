import { prisma } from '../lib/prisma';
import {
  AguinaldoAccrual,
  AguinaldoConfig,
  AguinaldoSummaryRow,
  AguinaldoProjectionEmployee,
  AguinaldoProjectionResponse,
} from '../model/AguinaldoAccrual';
import { Decimal } from '@prisma/client/runtime/library';
import { LegalParamService } from './LegalParamService';
import { LegalParamSet } from '../types/payroll.types';

/** Returns the number of payroll periods per year given a period_type string */
function periodsPerYearFrom(periodType: string): number {
  return periodType === 'mensual' ? 12 : 24;
}

/** Derives the most frequent periodsPerYear from a list of period_type strings (defaults to 24) */
function dominantPeriodsPerYear(periodTypes: string[]): number {
  if (periodTypes.length === 0) return 24;
  const mensualCount = periodTypes.filter(t => t === 'mensual').length;
  return mensualCount > periodTypes.length - mensualCount ? 12 : 24;
}

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
   * Computes the ISO date string for the payment deadline following a fiscal period end.
   * @param periodEnd Last day of the fiscal period
   * @param config Aguinaldo configuration
   * @returns ISO date string (YYYY-MM-DD)
   */
  static getPaymentDeadline(periodEnd: Date, config: AguinaldoConfig): string {
    const month0 = config.periodStartMonth - 1;
    // Deadline falls in the payment month that immediately follows periodEnd
    const deadlineYear =
      config.periodStartMonth <= periodEnd.getMonth() + 1
        ? periodEnd.getFullYear() + 1
        : periodEnd.getFullYear();
    return new Date(deadlineYear, month0, config.paymentDeadlineDay)
      .toISOString()
      .split('T')[0];
  }

  /**
   * Calculates the accrued aguinaldo for an employee as of a specific date.
   * Base: ordinary salary only (gross − overtime − bonuses), PAGADA payrolls only.
   * Formula: sum(ordinary) / aguinaldoDivisor — proportionality is automatic.
   *
   * @param employeeId The employee ID
   * @param asOfDate The reference date (defaults to now)
   * @returns AguinaldoAccrual details
   */
  static async calculateAccruedAguinaldo(employeeId: number, asOfDate: Date = new Date()): Promise<AguinaldoAccrual> {
    const [config, employee, params] = await Promise.all([
      AguinaldoService.getAguinaldoConfig(),
      prisma.vpg_employees.findUnique({
        where: { employee_id: employeeId },
        select: { employee_hire_date: true }
      }),
      LegalParamService.getParamSetAtDate(asOfDate)
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

    // Sum ORDINARY salary: gross − overtime − bonuses (legal base for aguinaldo)
    let totalOrdinarySalary = 0;
    payrolls.forEach(p =>
      p.vpg_payroll_employee.forEach(e => {
        const gross   = Number(e.payroll_employee_gross_salary   || 0);
        const overtime = Number(e.payroll_employee_overtime_pay  || 0);
        const bonuses  = Number(e.payroll_employee_bonuses       || 0);
        totalOrdinarySalary += gross - overtime - bonuses;
      })
    );

    // Aguinaldo = sum(salarios ordinarios) / aguinaldoDivisor
    const accrued = Math.round((totalOrdinarySalary / params.aguinaldoDivisor) * 100) / 100;

    // Determine periods-per-year from the actual payroll period types
    const periodTypes = payrolls.map(p => p.payrolls_period_type);
    const ppy = dominantPeriodsPerYear(periodTypes);

    // Projection: extrapolate to a full year at the current average rate
    const projectedAnnual =
      payrolls.length > 0
        ? Math.round(((totalOrdinarySalary / payrolls.length) * ppy / params.aguinaldoDivisor) * 100) / 100
        : 0;

    // Months completed (informational, based on hire date or period start)
    const hireDate = (employee?.employee_hire_date as Date | null) || periodStart;
    const effectiveStart = hireDate > periodStart ? hireDate : periodStart;
    const msElapsed = Math.max(0, asOfDate.getTime() - effectiveStart.getTime());
    const actualMonthsWorked = msElapsed / (1000 * 60 * 60 * 24 * 365 / params.aguinaldoDivisor);
    const monthsCompleted = Math.round(actualMonthsWorked);

    return {
      accrued,
      projectedAnnual,
      totalOrdinarySalary: Math.round(totalOrdinarySalary * 100) / 100,
      periodsPerYear: ppy,
      periodStart,
      periodEnd,
      monthsCompleted,
      payrollsIncluded: payrolls.length,
    };
  }

  /**
   * Generates an aguinaldo projection for all active employees (or a single one).
   * Uses PAGADA payrolls only and ordinary salary as the legal base.
   *
   * @param employeeId Optional — filter to a single employee
   * @param fiscalYear Optional — fiscal year anchor (defaults to current year)
   * @returns AguinaldoProjectionResponse
   */
  static async getProjection(employeeId?: number, fiscalYear?: number): Promise<AguinaldoProjectionResponse> {
    const config = await AguinaldoService.getAguinaldoConfig();

    // Build reference date: Nov 30 of the target fiscal year (or today)
    const asOfDate = fiscalYear
      ? new Date(fiscalYear, config.periodStartMonth - 2, 30)  // month before period start, day 30
      : new Date();

    const [params, { periodStart, periodEnd: periodEndMax }] = await Promise.all([
      LegalParamService.getParamSetAtDate(asOfDate),
      Promise.resolve(AguinaldoService.getFiscalPeriod(asOfDate, config))
    ]);

    const periodEnd = asOfDate < periodEndMax ? asOfDate : periodEndMax;

    const paymentDeadline = AguinaldoService.getPaymentDeadline(periodEndMax, config);

    // Fetch active employees
    const employees = await prisma.vpg_employees.findMany({
      where: {
        ...(employeeId ? { employee_id: employeeId } : {}),
        employee_fired: false,
        employee_status: { in: ['A', 'V'] },
      },
      select: {
        employee_id: true,
        employee_first_name: true,
        employee_last_name: true,
        employee_hire_date: true,
      },
      orderBy: [{ employee_last_name: 'asc' }, { employee_first_name: 'asc' }],
    });

    if (employees.length === 0) {
      return {
        fiscalPeriodStart: periodStart.toISOString().split('T')[0],
        fiscalPeriodEnd: periodEndMax.toISOString().split('T')[0],
        paymentDeadline,
        periodsPerYear: 24,
        employees: [],
        summary: { totalEmployees: 0, totalAguinaldoAccumulated: 0, totalProjectedFullYear: 0 },
      };
    }

    const employeeIds = employees.map(e => e.employee_id);

    // Bulk: sum gross, overtime, bonuses per employee in this fiscal period (PAGADA only)
    const [paySums, periodTypeSample] = await Promise.all([
      prisma.vpg_payroll_employee.groupBy({
        by: ['payroll_employee_employee_id'],
        _sum: {
          payroll_employee_gross_salary: true,
          payroll_employee_overtime_pay: true,
          payroll_employee_bonuses: true,
        },
        _count: { payroll_employee_id: true },
        where: {
          payroll_employee_employee_id: { in: employeeIds },
          vpg_payrolls: {
            payrolls_period_end: { gte: periodStart, lte: periodEnd },
            payrolls_status: { in: ['APROBADA', 'PAGADA'] },
          },
        },
      }),
      // Determine dominant period type across payrolls in this fiscal window
      prisma.vpg_payrolls.groupBy({
        by: ['payrolls_period_type'],
        _count: { payrolls_id: true },
        where: {
          payrolls_period_end: { gte: periodStart, lte: periodEnd },
          payrolls_status: { in: ['APROBADA', 'PAGADA'] },
        },
        orderBy: { _count: { payrolls_id: 'desc' } },
        take: 1,
      }),
    ]);

    // Note: includes APROBADA + PAGADA — most CR payrolls stay APROBADA in practice
    const ppy = periodTypeSample.length > 0
      ? periodsPerYearFrom(periodTypeSample[0].payrolls_period_type)
      : 24;

    const payMap = new Map(
      paySums.map(s => [
        s.payroll_employee_employee_id,
        {
          gross:    Number((s._sum.payroll_employee_gross_salary   as Decimal | null) ?? 0),
          overtime: Number((s._sum.payroll_employee_overtime_pay   as Decimal | null) ?? 0),
          bonuses:  Number((s._sum.payroll_employee_bonuses        as Decimal | null) ?? 0),
          count:    s._count.payroll_employee_id,
        },
      ])
    );

    const employeeRows: AguinaldoProjectionEmployee[] = employees.map(emp => {
      const pay = payMap.get(emp.employee_id);
      const totalOrdinarySalary = pay
        ? Math.round((pay.gross - pay.overtime - pay.bonuses) * 100) / 100
        : 0;
      const periodsIncluded = pay?.count ?? 0;
      const aguinaldoAccumulated = Math.round((totalOrdinarySalary / params.aguinaldoDivisor) * 100) / 100;
      const projectedFullYear =
        periodsIncluded > 0
          ? Math.round(((totalOrdinarySalary / periodsIncluded) * ppy / params.aguinaldoDivisor) * 100) / 100
          : 0;

      return {
        employeeId: emp.employee_id,
        employeeName: `${emp.employee_first_name} ${emp.employee_last_name}`.trim(),
        hireDate: (emp.employee_hire_date as Date).toISOString().split('T')[0],
        periodsIncluded,
        totalOrdinarySalary,
        aguinaldoAccumulated,
        projectedFullYear,
        isComplete: periodsIncluded >= ppy,
      };
    });

    const totalAguinaldoAccumulated = Math.round(
      employeeRows.reduce((s, r) => s + r.aguinaldoAccumulated, 0) * 100
    ) / 100;
    const totalProjectedFullYear = Math.round(
      employeeRows.reduce((s, r) => s + r.projectedFullYear, 0) * 100
    ) / 100;

    return {
      fiscalPeriodStart: periodStart.toISOString().split('T')[0],
      fiscalPeriodEnd: periodEndMax.toISOString().split('T')[0],
      paymentDeadline,
      periodsPerYear: ppy,
      employees: employeeRows,
      summary: {
        totalEmployees: employeeRows.length,
        totalAguinaldoAccumulated,
        totalProjectedFullYear,
      },
    };
  }

  /**
   * Generates an aguinaldo summary for all employees in a specific payroll.
   * Uses PAGADA prior payrolls + ordinary salary base (gross − overtime − bonuses).
   * Uses bulk groupBy to avoid N+1 queries.
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

    const params = await LegalParamService.getParamSetAtDate(payroll.payrolls_period_start);

    const { periodStart: fiscalStart, periodEnd: fiscalEnd } = AguinaldoService.getFiscalPeriod(
      payroll.payrolls_period_start,
      config
    );

    const employeeIds = payroll.vpg_payroll_employee.map(e => e.payroll_employee_employee_id);

    // BULK QUERY: prior ordinary salaries for these employees in this fiscal period (PAGADA only)
    const priorSalaries = await prisma.vpg_payroll_employee.groupBy({
      by: ['payroll_employee_employee_id'],
      _sum: {
        payroll_employee_gross_salary: true,
        payroll_employee_overtime_pay: true,
        payroll_employee_bonuses: true,
      },
      where: {
        vpg_payrolls: {
          payrolls_id: { not: payrollId },
          payrolls_period_end: { gte: fiscalStart, lte: fiscalEnd },
          payrolls_status: { in: ['APROBADA', 'PAGADA'] },
        },
        payroll_employee_employee_id: { in: employeeIds }
      }
    });

    const salaryMap = new Map(
      priorSalaries.map(s => {
        const gross    = Number((s._sum.payroll_employee_gross_salary  as Decimal | null) ?? 0);
        const overtime = Number((s._sum.payroll_employee_overtime_pay  as Decimal | null) ?? 0);
        const bonuses  = Number((s._sum.payroll_employee_bonuses       as Decimal | null) ?? 0);
        return [s.payroll_employee_employee_id, gross - overtime - bonuses];
      })
    );

    return payroll.vpg_payroll_employee.map(empRow => {
      const priorOrdinary = salaryMap.get(empRow.payroll_employee_employee_id) ?? 0;
      const gross    = Number(empRow.payroll_employee_gross_salary  || 0);
      const overtime = Number(empRow.payroll_employee_overtime_pay  || 0);
      const bonuses  = Number(empRow.payroll_employee_bonuses       || 0);
      const thisOrdinary = gross - overtime - bonuses;

      return {
        employeeId: empRow.payroll_employee_employee_id,
        employeeName: `${empRow.vpg_employees?.employee_first_name} ${empRow.vpg_employees?.employee_last_name}`,
        accruedBeforeThisPayroll: Math.round((priorOrdinary / params.aguinaldoDivisor) * 100) / 100,
        thisPayrollContribution:  Math.round((thisOrdinary   / params.aguinaldoDivisor) * 100) / 100,
        totalAccruedWithThis:     Math.round(((priorOrdinary + thisOrdinary) / params.aguinaldoDivisor) * 100) / 100,
        periodStart: fiscalStart,
        periodEnd:   fiscalEnd,
      };
    });
  }
}
