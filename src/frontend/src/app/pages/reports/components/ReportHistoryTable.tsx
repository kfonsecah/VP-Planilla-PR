import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { ReportLogEntry } from '@/types/reports';

interface Props {
  history: ReportLogEntry[];
  isLoading: boolean;
}

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const STATUS_CLASSES: Record<string, string> = {
  SENT: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
};

const getStatusClass = (status: string) =>
  STATUS_CLASSES[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200';

export const ReportHistoryTable: React.FC<Props> = ({ history, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
        <ClockIcon className="h-8 w-8 mb-2" />
        <p className="text-sm">Sin historial de reportes para esta planilla</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Estado</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Empleado</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Generado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {history.map((log) => (
            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
              <td className="px-4 py-3">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{log.type}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClass(log.status)}`}
                >
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {log.employeeName || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(log.generated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
