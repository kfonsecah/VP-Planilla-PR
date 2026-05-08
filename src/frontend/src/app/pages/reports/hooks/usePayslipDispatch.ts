import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ReportsService } from '@/services/reportsService';
import { AuditLogsService } from '@/services/auditLogsService';
import { PayrollService } from '@/services/payrollService';
import { PayrollEmployeeReportRow } from '@/types/reports';
import { AuditLog } from '@/types/auditLog';

export type PayslipSendStatus =
  | 'enviado'
  | 'reenviado'
  | 'fallido'
  | 'sin-email'
  | 'sin-registro';

export interface EmployeePayslipRow {
  payrollEmployeeId: number;
  employeeId: number;
  fullName: string;
  position?: string | null;
  email: string | null;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  sendStatus: PayslipSendStatus;
  isResending: boolean;
  isDownloading: boolean;
}

const deriveSendStatus = (
  email: string | null,
  logs: AuditLog[],
  payrollId: number,
  payrollEmployeeId: number
): PayslipSendStatus => {
  if (!email) return 'sin-email';

  // Filter logs for this specific payroll_employee
  const relevant = logs.filter((log) => {
    if (log.entity_id !== payrollEmployeeId) return false;
    try {
      const details = JSON.parse(log.details ?? '{}');
      return details.payrollId === payrollId;
    } catch {
      return false;
    }
  });

  if (relevant.length === 0) return 'sin-registro';

  // Most recent log wins
  const latest = relevant.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  try {
    const details = JSON.parse(latest.details ?? '{}');
    if (!details.success) return 'fallido';
    if (details.resend) return 'reenviado';
    return 'enviado';
  } catch {
    return 'sin-registro';
  }
};

export const usePayslipDispatch = (payrollId: number | null) => {
  const [employees, setEmployees] = useState<EmployeePayslipRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!payrollId) {
      setEmployees([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [dataset, rawAudit] = await Promise.all([
        ReportsService.getPayrollDataset(payrollId),
        AuditLogsService.getAuditLogs({
          action: 'PAYSLIP_SENT',
          entity: 'vpg_payroll_employee',
          limit: 500,
        }),
      ]);

      // http.get unwraps {success, data} — at runtime rawAudit may already be the array
      const logs: AuditLog[] = Array.isArray(rawAudit)
        ? (rawAudit as unknown as AuditLog[])
        : ((rawAudit as { data?: AuditLog[] }).data ?? []);

      const rows: EmployeePayslipRow[] = dataset.employees.map(
        (emp: PayrollEmployeeReportRow) => ({
          payrollEmployeeId: emp.payrollEmployeeId,
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          position: emp.position,
          email: emp.email,
          grossSalary: emp.grossSalary,
          totalDeductions: emp.totalDeductions,
          netSalary: emp.netSalary,
          sendStatus: deriveSendStatus(emp.email, logs, payrollId, emp.payrollEmployeeId),
          isResending: false,
          isDownloading: false,
        })
      );

      setEmployees(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar comprobantes';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    load();
  }, [load]);

  const resend = useCallback(
    async (payrollEmployeeId: number, employeeId: number) => {
      if (!payrollId) return;

      setEmployees((prev) =>
        prev.map((e) =>
          e.payrollEmployeeId === payrollEmployeeId ? { ...e, isResending: true } : e
        )
      );

      try {
        await PayrollService.resendPayslip(payrollId, employeeId);
        toast.success('Comprobante reenviado exitosamente');
        // Reload to get updated status
        await load();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al reenviar comprobante';
        toast.error(msg);
        setEmployees((prev) =>
          prev.map((e) =>
            e.payrollEmployeeId === payrollEmployeeId ? { ...e, isResending: false } : e
          )
        );
      }
    },
    [payrollId, load]
  );

  const download = useCallback(
    async (payrollEmployeeId: number, employeeId: number) => {
      if (!payrollId) return;

      setEmployees((prev) =>
        prev.map((e) =>
          e.payrollEmployeeId === payrollEmployeeId ? { ...e, isDownloading: true } : e
        )
      );

      try {
        await PayrollService.downloadPayslipPdf(payrollId, employeeId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al descargar comprobante';
        toast.error(msg);
      } finally {
        setEmployees((prev) =>
          prev.map((e) =>
            e.payrollEmployeeId === payrollEmployeeId ? { ...e, isDownloading: false } : e
          )
        );
      }
    },
    [payrollId]
  );

  const sent = employees.filter((e) => e.sendStatus === 'enviado' || e.sendStatus === 'reenviado').length;
  const failed = employees.filter((e) => e.sendStatus === 'fallido').length;
  const noEmail = employees.filter((e) => e.sendStatus === 'sin-email').length;

  return { employees, isLoading, error, reload: load, resend, download, sent, failed, noEmail };
};
