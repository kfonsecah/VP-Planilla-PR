'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ClockLogsService } from '@/services/clockLogsService';

// Lazy-load framer-motion
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

interface AuditEntry {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
}

interface AuditTimelineProps {
  clockLogId: string; // Fetch logs for this mark
  compact?: boolean; // Show summary only vs full list
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ clockLogId, compact = false }) => {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    if (!clockLogId) return;

    setIsLoading(true);
    setError(null);

    ClockLogsService.getAuditLogsForClockLog(Number(clockLogId))
      .then((entries) => {
        const mapped: AuditEntry[] = entries.map((entry) => ({
          id: Number(entry.id ?? 0),
          action: String(entry.action ?? ''),
          details: String(entry.details ?? entry.description ?? ''),
          created_at: String(entry.created_at ?? entry.createdAt ?? ''),
          user_name: entry.user_name != null ? String(entry.user_name) : undefined,
        }));
        setAuditLogs(mapped);
      })
      .catch((err) => {
        console.warn('[AuditTimeline] Error loading audit logs:', err);
        setError('No se pudieron cargar los registros');
        setAuditLogs([]);
      })
      .finally(() => setIsLoading(false));
  }, [clockLogId]);

  const getActionIcon = (action: string) => {
    const upperAction = action.toUpperCase();
    if (upperAction.includes('ADD') || upperAction.includes('CREATE')) {
      return (
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <span className="text-green-600 dark:text-green-400 text-xs font-bold">+</span>
        </div>
      );
    }
    if (upperAction.includes('EDIT') || upperAction.includes('UPDATE') || upperAction.includes('MODIFY')) {
      return (
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      );
    }
    if (upperAction.includes('VOID') || upperAction.includes('DELETE') || upperAction.includes('ANNUL')) {
      return (
        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      );
    }
    // Default
    return (
      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <span className="text-zinc-600 dark:text-zinc-400 text-xs">•</span>
      </div>
    );
  };

  const getActionLabel = (action: string) => {
    const upperAction = action.toUpperCase();
    if (upperAction.includes('ADD') || upperAction.includes('CREATE')) return 'Agregado';
    if (upperAction.includes('EDIT') || upperAction.includes('UPDATE') || upperAction.includes('MODIFY')) return 'Editado';
    if (upperAction.includes('VOID') || upperAction.includes('DELETE') || upperAction.includes('ANNUL')) return 'Anulado';
    return action;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-zinc-500">Cargando historial...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-2 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  // No logs
  if (auditLogs.length === 0) {
    return (
      <div className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
        Sin cambios registrados
      </div>
    );
  }

  // Compact mode - badge with tooltip
  if (compact) {
    return (
      <div className="inline-flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {auditLogs.length} {auditLogs.length === 1 ? 'cambio' : 'cambios'}
        </button>
        
        {isExpanded && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 mt-2 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3"
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Historial de cambios
            </div>
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-1">
                {getActionIcon(log.action)}
                <div className="text-xs">
                  <span className="font-medium">{getActionLabel(log.action)}</span>
                  <span className="text-zinc-500 dark:text-zinc-400"> • {formatDate(log.created_at)}</span>
                </div>
              </div>
            ))}
            {auditLogs.length > 3 && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                +{auditLogs.length - 3} más
              </div>
            )}
          </MotionDiv>
        )}
      </div>
    );
  }

  // Full mode - expandable timeline
  return (
    <div className="border-l-2 border-zinc-200 dark:border-zinc-700 ml-3 pl-4 space-y-3 py-2">
      {auditLogs.map((log, index) => (
        <div key={log.id} className="relative">
          {/* Timeline dot */}
          {index < auditLogs.length - 1 && (
            <div className="absolute -left-[19px] top-6 w-2 h-full border-l border-zinc-300 dark:border-zinc-600" />
          )}
          
          <div className="flex items-start gap-3">
            {getActionIcon(log.action)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {getActionLabel(log.action)}
                </span>
                {log.user_name && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Usuario: {log.user_name}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {formatDate(log.created_at)}
              </div>
              {log.details && (
                <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 break-words">
                  {log.details}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTimeline;