import { prisma } from '../lib/prisma';

export interface IntegrityAlert {
  code: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  entity: 'EMPLOYEE' | 'PAYROLL' | 'CLOCK_LOG' | 'POSITION';
  message: string;
  affectedCount: number;
  sampleIds: number[];
}

export interface IntegrityDashboardStatus {
  healthScore: number;
  totalAlerts: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  lastAuditAt: Date | null;
  alerts: IntegrityAlert[];
}

export class IntegrityService {
  /**
   * Runs all 7 integrity rules and returns a list of alerts.
   * 
   * @returns {Promise<IntegrityAlert[]>}
   */
  static async runAudit(): Promise<IntegrityAlert[]> {
    const alerts: IntegrityAlert[] = [];

    // EMP-001: Missing National ID
    const emp001 = await prisma.vpg_employees.findMany({
      where: {
        employee_national_id: ''
      },
      select: { employee_id: true }
    });
    if (emp001.length > 0) {
      alerts.push({
        code: 'EMP-001',
        severity: 'ERROR',
        entity: 'EMPLOYEE',
        message: 'Empleados sin Identificación Nacional',
        affectedCount: emp001.length,
        sampleIds: emp001.map(e => e.employee_id).slice(0, 5)
      });
    }

    // EMP-002: Invalid ID Format (CR standard)
    // 9 digits physical, 10 legal/DIMEX. Allowing some flexibility but flagging obviously wrong ones.
    const allEmpsWithId = await prisma.vpg_employees.findMany({
      where: {
        NOT: { employee_national_id: '' }
      },
      select: { employee_id: true, employee_national_id: true }
    });
    
    const invalidIdEmps = allEmpsWithId.filter(e => {
      const cleanId = e.employee_national_id.replace(/[^0-9]/g, '');
      return cleanId.length !== 9 && cleanId.length !== 10;
    });

    if (invalidIdEmps.length > 0) {
      alerts.push({
        code: 'EMP-002',
        severity: 'WARN',
        entity: 'EMPLOYEE',
        message: 'Formato de Identificación Inválido (requiere 9 o 10 dígitos)',
        affectedCount: invalidIdEmps.length,
        sampleIds: invalidIdEmps.map(e => e.employee_id).slice(0, 5)
      });
    }

    // POS-001: Missing INS Metadata
    const pos001 = await prisma.vpg_positions.findMany({
      where: {
        OR: [
          { position_occupation_code: null },
          { position_occupation_code: '' },
          { position_risk_class: null },
          { position_risk_class: '' }
        ]
      },
      select: { position_id: true }
    });
    if (pos001.length > 0) {
      alerts.push({
        code: 'POS-001',
        severity: 'ERROR',
        entity: 'POSITION',
        message: 'Posiciones sin Códigos de Ocupación o Riesgo (Requerido para INS)',
        affectedCount: pos001.length,
        sampleIds: pos001.map(p => p.position_id).slice(0, 5)
      });
    }

    // PAY-001: Calculation Drift
    // gross = overtime + rest + bonuses
    const allPayrollEmps = await prisma.vpg_payroll_employee.findMany({
      select: {
        payroll_employee_id: true,
        payroll_employee_gross_salary: true,
        payroll_employee_overtime_pay: true,
        payroll_employee_weekly_rest_pay: true,
        payroll_employee_bonuses: true
      }
    });

    const driftEmps = allPayrollEmps.filter(pe => {
      const gross = Number(pe.payroll_employee_gross_salary);
      const components = Number(pe.payroll_employee_overtime_pay || 0) + 
                         Number(pe.payroll_employee_weekly_rest_pay || 0) + 
                         Number(pe.payroll_employee_bonuses || 0);
      return Math.abs(gross - components) > 0.01;
    });

    if (driftEmps.length > 0) {
      alerts.push({
        code: 'PAY-001',
        severity: 'WARN',
        entity: 'PAYROLL',
        message: 'Deriva de Cálculo (Salario bruto no coincide con componentes)',
        affectedCount: driftEmps.length,
        sampleIds: driftEmps.map(pe => pe.payroll_employee_id).slice(0, 5)
      });
    }

    // PAY-002: Missing Snapshots
    const pay002 = await prisma.vpg_payrolls.findMany({
      where: {
        payrolls_status: { in: ['APROBADA', 'PAGADA'] },
        vpgPayrollParamSnapshots: { none: {} }
      },
      select: { payrolls_id: true }
    });
    if (pay002.length > 0) {
      alerts.push({
        code: 'PAY-002',
        severity: 'ERROR',
        entity: 'PAYROLL',
        message: 'Planillas aprobadas sin snapshots de parámetros legales',
        affectedCount: pay002.length,
        sampleIds: pay002.map(p => p.payrolls_id).slice(0, 5)
      });
    }

    // CLK-001: Orphan Marks
    const clk001Count = await prisma.vpg_clock_logs.count({
      where: { clock_logs_status: 'orphan' }
    });
    if (clk001Count > 0) {
      alerts.push({
        code: 'CLK-001',
        severity: 'WARN',
        entity: 'CLOCK_LOG',
        message: 'Marcas huérfanas detectadas',
        affectedCount: clk001Count,
        sampleIds: [] // Count only
      });
    }

    // CLK-002: Open Sessions (> 16 hours)
    const sixteenHoursAgo = new Date(Date.now() - 16 * 60 * 60 * 1000);
    const potentialOpenSessions = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_log_type: 'IN',
        clock_logs_timestamp: { lt: sixteenHoursAgo },
        // We only care about somewhat recent ones, e.g. last 30 days to avoid scanning whole DB if it's huge
        // But for integrity, maybe we want all. Let's stick to simple rule.
      },
      select: { clock_logs_id: true, clock_logs_employee_id: true, clock_logs_timestamp: true }
    });

    const trulyOpenSessions: number[] = [];
    for (const session of potentialOpenSessions) {
      const nextLog = await prisma.vpg_clock_logs.findFirst({
        where: {
          clock_logs_employee_id: session.clock_logs_employee_id,
          clock_logs_timestamp: { gt: session.clock_logs_timestamp },
          clock_logs_log_type: 'OUT'
        }
      });
      if (!nextLog) {
        trulyOpenSessions.push(session.clock_logs_id);
      }
    }

    if (trulyOpenSessions.length > 0) {
      alerts.push({
        code: 'CLK-002',
        severity: 'WARN',
        entity: 'CLOCK_LOG',
        message: 'Sesiones abiertas por más de 16 horas',
        affectedCount: trulyOpenSessions.length,
        sampleIds: trulyOpenSessions.slice(0, 5)
      });
    }

    return alerts;
  }

  /**
   * Returns summary stats and the list of alerts for the dashboard.
   * 
   * @returns {Promise<IntegrityDashboardStatus>}
   */
  static async getDashboardStatus(): Promise<IntegrityDashboardStatus> {
    const alerts = await this.runAudit();
    
    const errorCount = alerts.filter(a => a.severity === 'ERROR').reduce((sum, a) => sum + a.affectedCount, 0);
    const warningCount = alerts.filter(a => a.severity === 'WARN').reduce((sum, a) => sum + a.affectedCount, 0);
    const infoCount = alerts.filter(a => a.severity === 'INFO').reduce((sum, a) => sum + a.affectedCount, 0);
    const totalAlerts = errorCount + warningCount + infoCount;

    // Health Score calculation: 100 - (errors * 5 + warnings * 1). Min 0.
    const penalty = (errorCount * 5) + (warningCount * 1);
    const healthScore = Math.max(0, 100 - penalty);

    return {
      healthScore,
      totalAlerts,
      errorCount,
      warningCount,
      infoCount,
      lastAuditAt: new Date(),
      alerts
    };
  }
}
