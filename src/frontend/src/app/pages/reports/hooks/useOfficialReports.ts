import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ReportsService } from '@/services/reportsService';
import { ReportLogEntry } from '@/types/reports';

export const useOfficialReports = (payrollId: number | null) => {
  const [history, setHistory] = useState<ReportLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'CCSS' | 'HACIENDA' | null>(null);
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

  return { history, isLoadingHistory, isGenerating, error, generate, reloadHistory: loadHistory };
};
