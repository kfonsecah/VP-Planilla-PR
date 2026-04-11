import React from 'react';
import { ImportSession } from '@/services/clockLogsService';

interface ImportSessionsPanelProps {
  sessions: ImportSession[];
  isLoading: boolean;
}

const SESSION_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
  running: 'bg-blue-100 text-blue-800',
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  completed: 'Completada',
  failed: 'Fallida',
  pending: 'Pendiente',
  running: 'En proceso',
};

const SOURCE_LABELS: Record<string, string> = {
  java_import: 'Java',
  excel_import: 'Excel',
  manual: 'Manual',
};

const ImportSessionsPanel: React.FC<ImportSessionsPanelProps> = ({ sessions, isLoading }) => {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-4 bg-white dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
        Sesiones de Importación Recientes
      </h3>

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando sesiones...</p>
      )}

      {!isLoading && sessions.length === 0 && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No hay sesiones de importación recientes
        </p>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="text-left py-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Fuente
                </th>
                <th className="text-left py-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-right py-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Creados
                </th>
                <th className="text-right py-2 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Omitidos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {new Date(session.started_at).toLocaleDateString('es-CR')}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                    {SOURCE_LABELS[session.source] ?? session.source}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        SESSION_STATUS_COLORS[session.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {SESSION_STATUS_LABELS[session.status] ?? session.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right text-zinc-700 dark:text-zinc-300 font-medium">
                    {session.created_count}
                  </td>
                  <td className="py-2 text-right text-zinc-500 dark:text-zinc-400">
                    {session.skipped_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImportSessionsPanel;
