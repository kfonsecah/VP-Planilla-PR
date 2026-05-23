import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ReportsService } from '@/services/reportsService';
import { ReportLogEntry } from '@/types/reports';

export const useOfficialReports = (payrollId: number | null) => {
  const [history, setHistory] = useState<ReportLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'CCSS' | 'HACIENDA' | null>(null);
  const [isDownloading, setIsDownloading] = useState<'CCSS' | 'INS' | null>(null);
  const [isDownloadingD151, setIsDownloadingD151] = useState(false);
  const [isDownloadingAnnualSalary, setIsDownloadingAnnualSalary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!payrollId) {
      setHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    setError(null);
    try {
      const logs = await ReportsService.getPayrollLogs(payrollId);
      setHistory(Array.isArray(logs) ? logs : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar historial';
      setError(msg);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [payrollId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const generate = useCallback(
    async (type: 'CCSS' | 'HACIENDA') => {
      if (!payrollId) return;
      setIsGenerating(type);
      try {
        await ReportsService.sendReports({
          payrollId,
          reportTypes: [type],
        });
        toast.success(`Reporte ${type} generado y enviado exitosamente`);
        await loadHistory();
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Error al generar reporte ${type}`;
        toast.error(msg);
      } finally {
        setIsGenerating(null);
      }
    },
    [payrollId, loadHistory]
  );

  const downloadCCSS = useCallback(async () => {
    if (!payrollId) return;
    setIsDownloading('CCSS');
    try {
      const { blob, fileName } = await ReportsService.downloadCCSSReport(payrollId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte CCSS descargado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descargar reporte CCSS';
      toast.error(msg);
    } finally {
      setIsDownloading(null);
    }
  }, [payrollId]);

  const downloadINS = useCallback(async () => {
    if (!payrollId) return;
    setIsDownloading('INS');
    try {
      const { blob, fileName } = await ReportsService.downloadINSReport(payrollId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte INS descargado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descargar reporte INS';
      toast.error(msg);
    } finally {
      setIsDownloading(null);
    }
  }, [payrollId]);

  const downloadD151 = useCallback(async (year: number) => {
    setIsDownloadingD151(true);
    try {
      const { blob, fileName } = await ReportsService.downloadD151Report(year);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte D-151 descargado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descargar reporte D-151';
      toast.error(msg);
    } finally {
      setIsDownloadingD151(false);
    }
  }, []);

  const downloadAnnualSalary = useCallback(async (year: number) => {
    setIsDownloadingAnnualSalary(true);
    try {
      const { blob, fileName } = await ReportsService.downloadAnnualSalarySummary(year);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Resumen anual descargado exitosamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descargar resumen anual';
      toast.error(msg);
    } finally {
      setIsDownloadingAnnualSalary(false);
    }
  }, []);

  return {
    history,
    isLoadingHistory,
    isGenerating,
    isDownloading,
    isDownloadingD151,
    isDownloadingAnnualSalary,
    error,
    generate,
    downloadCCSS,
    downloadINS,
    downloadD151,
    downloadAnnualSalary,
    reloadHistory: loadHistory,
  };
};
