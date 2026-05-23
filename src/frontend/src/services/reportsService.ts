import { http } from './http';
import {
  PayrollReportDataset,
  ReportDispatchSummary,
  ReportLogEntry,
  ReportsDashboardData,
  SendReportsPayload,
} from '@/types/reports';

const CONTENT_DISPOSITION_HEADER = 'content-disposition';

export const ReportsService = {
  async getDashboard(): Promise<ReportsDashboardData> {
    return (await http.get('/reports/dashboard')) as ReportsDashboardData;
  },

  async getPayrollDataset(payrollId: number): Promise<PayrollReportDataset> {
    return (await http.get(
      `/reports/payroll/${payrollId}/employees`
    )) as PayrollReportDataset;
  },

  async getPayrollLogs(payrollId: number): Promise<ReportLogEntry[]> {
    return (await http.get(
      `/reports/payroll/${payrollId}/logs`
    )) as ReportLogEntry[];
  },

  async sendReports(payload: SendReportsPayload): Promise<ReportDispatchSummary> {
    const { payrollId, ...body } = payload;
    return (await http.post(
      `/reports/payroll/${payrollId}/send`,
      body
    )) as ReportDispatchSummary;
  },

  async downloadPaymentReceiptsPdf(payload: {
    payrollId: number;
    employeeIds?: number[];
  }): Promise<{ blob: Blob; fileName: string }> {
    const { payrollId, employeeIds } = payload;
    const response = await http.raw(`/reports/payroll/${payrollId}/payment-receipts/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds }),
    });

    if (!response.ok) {
      let message = `No se pudo generar el PDF (HTTP ${response.status})`;
      try {
        const errorBody = await response.json();
        message = errorBody?.message || errorBody?.error || message;
      } catch {
        // Keep fallback message
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get(CONTENT_DISPOSITION_HEADER) || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = employeeIds && employeeIds.length === 1
      ? `comprobante_pago_${payrollId}_${employeeIds[0]}.pdf`
      : `comprobantes_planilla_${payrollId}.pdf`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },

  async downloadCCSSReport(payrollId: number): Promise<{ blob: Blob; fileName: string }> {
    const response = await http.raw(`/reports/institutional/ccss/${payrollId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error al descargar reporte CCSS (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get(CONTENT_DISPOSITION_HEADER) || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = `reporte_ccss_planilla_${payrollId}.csv`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },

  async downloadINSReport(payrollId: number): Promise<{ blob: Blob; fileName: string }> {
    const response = await http.raw(`/reports/institutional/ins/${payrollId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error al descargar reporte INS (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get(CONTENT_DISPOSITION_HEADER) || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = `reporte_ins_planilla_${payrollId}.csv`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },

  async downloadD151Report(year: number): Promise<{ blob: Blob; fileName: string }> {
    const response = await http.raw(`/reports/hacienda/d151/${year}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error al descargar reporte D-151 (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get(CONTENT_DISPOSITION_HEADER) || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = `hacienda_d151_${year}.csv`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },

  async downloadAnnualSalarySummary(year: number): Promise<{ blob: Blob; fileName: string }> {
    const response = await http.raw(`/reports/hacienda/annual-salary/${year}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error al descargar resumen anual (${response.status})`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get(CONTENT_DISPOSITION_HEADER) || '';
    const fileNameMatch = disposition.match(/filename=([^;]+)/i);
    const fallbackName = `resumen_anual_salarios_${year}.xlsx`;

    return {
      blob,
      fileName: fileNameMatch ? fileNameMatch[1].trim().replace(/^"|"$/g, '') : fallbackName,
    };
  },
};
