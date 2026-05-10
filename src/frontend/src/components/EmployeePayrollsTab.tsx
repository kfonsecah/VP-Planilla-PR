'use client';

import React from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useEmployeePayrolls } from '@/hooks/useEmployeePayrolls';
import { formatCRC } from '@/utils/number';
import { formatDateDisplay } from '@/utils/formatters';
import { toast } from 'sonner';

interface Props {
  employeeId: string | number;
}

type PayrollStatus = 'BORRADOR' | 'APROBADA' | 'PAGADA';

const STATUS_BADGE: Record<PayrollStatus, string> = {
  BORRADOR:
    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  APROBADA:
    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  PAGADA:
    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const capitalize = (s: string): string => (s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1));

const EmployeePayrollsTab: React.FC<Props> = ({ employeeId }) => {
  const { data, isLoading, error, refresh, downloadReceipt } = useEmployeePayrolls(employeeId);

  const handleDownload = async (payrollId: number) => {
    try {
      await downloadReceipt(payrollId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo descargar el comprobante';
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Historial de Planillas
          </h3>
        </div>
      </div>

      {isLoading && (
        <div className="p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">
            No se pudo cargar el historial de planillas
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-3">{error} — Intenta de nuevo.</p>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <DocumentTextIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Sin planillas registradas</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
            Este empleado aún no ha participado en ninguna planilla.
          </p>
        </div>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Período</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Salario Bruto</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Deducciones</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Salario Neto</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Horas</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ajuste</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.map((row) => {
                const status = row.status as PayrollStatus;
                const canDownload = status === 'APROBADA' || status === 'PAGADA';
                return (
                  <tr key={row.payroll_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                      {formatDateDisplay(row.period_start)} — {formatDateDisplay(row.period_end)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                      {capitalize(row.period_type)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={STATUS_BADGE[status]}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 text-right">{formatCRC(row.gross_salary)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 text-right">{formatCRC(row.total_deductions)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#4A5D3A] dark:text-green-400 text-right">{formatCRC(row.net_salary)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 text-center">
                      {row.total_hours != null ? `${row.total_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.is_manually_adjusted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Ajustado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canDownload ? (
                        <button
                          onClick={() => handleDownload(row.payroll_id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-normal text-[#4A5D3A] dark:text-green-400 border border-[#4A5D3A] dark:border-green-600 rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-green-900/20 transition-colors mx-auto"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          Descargar
                        </button>
                      ) : (
                        <span
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 dark:text-zinc-600 cursor-not-allowed mx-auto"
                          title="Solo disponible para planillas aprobadas o pagadas"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          Descargar
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeePayrollsTab;
