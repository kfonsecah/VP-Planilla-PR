import React from 'react';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';
import AuditTimeline from '@/components/AuditTimeline';
import { ClockLogsService } from '@/services/clockLogsService';
import { useState, useEffect } from 'react';

interface DailyRowProps {
  log: EffectiveClockLog;
  onAddMissing?: (type: 'in' | 'out') => void;  // stub — no-op in Phase 34
  onEdit?: (entry: EffectiveClockLog) => void;  // Trigger edit modal
  onVoid?: (entry: EffectiveClockLog) => void; // Trigger void modal
}

const SourceTraceabilityIcon: React.FC<{ source: string; status: string }> = ({ source, status }) => {
  if (status === 'corrected') {
    return (
      <span role="img" aria-label="Marca corregida/ajustada" title="Marca corregida/ajustada" className="text-xs">
        🔄
      </span>
    );
  }

  switch (source) {
    case 'java_import':
    case 'device':
      return (
        <span role="img" aria-label="Importado desde reloj de asistencia" title="Importado desde reloj de asistencia" className="text-xs">
          ⏱
        </span>
      );
    case 'manual':
      return (
        <span role="img" aria-label="Entrada manual" title="Entrada manual" className="text-xs">
          ✋
        </span>
      );
    default:
      return null;
  }
};

const formatCRTime = (iso: string | null): string | null => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Costa_Rica',
  });
};

const DailyRow: React.FC<DailyRowProps> = ({ log, onAddMissing, onEdit, onVoid }) => {
  const [auditCount, setAuditCount] = useState<number>(0);
  const [showAuditTimeline, setShowAuditTimeline] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Fetch audit count on mount — use in_log_id and out_log_id (correct EffectiveClockLog.original fields)
  useEffect(() => {
    const inId = log.original?.in_log_id;
    const outId = log.original?.out_log_id;

    if (!inId && !outId) return;

    setIsLoadingAudit(true);
    const idsToCheck = [inId, outId].filter(Boolean);

    Promise.all(
      idsToCheck.map((id) =>
        ClockLogsService.getAuditLogsForClockLog(id as number).catch(() => [])
      )
    )
      .then((results) => {
        const totalCount = results.reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        setAuditCount(totalCount);
      })
      .catch(() => {
        setAuditCount(0);
      })
      .finally(() => setIsLoadingAudit(false));
  }, [log.original?.in_log_id, log.original?.out_log_id]);

  const dateLabel = new Date(log.log_date + 'T00:00:00').toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const inTime = formatCRTime(log.adjusted?.in_time ?? log.original.in_time);
  const outTime = formatCRTime(log.adjusted?.out_time ?? log.original.out_time);
  const source = log.original.source;
  const status = log.original.status;
  const displayHours = log.calculated_hours != null ? log.calculated_hours.toFixed(1) : null;

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/30">
      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        {dateLabel}
        {/* Audit indicator badge */}
        {!isLoadingAudit && auditCount > 0 && (
          <button
            onClick={() => setShowAuditTimeline(!showAuditTimeline)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {auditCount} {auditCount === 1 ? 'cambio' : 'cambios'}
          </button>
        )}
      </h4>

      <div className="space-y-2">
        {/* IN Mark */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 w-12">ENTRADA:</span>
            {inTime ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{inTime}</span>
                <SourceTraceabilityIcon source={source} status={status} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 dark:text-red-400 italic">Falta marca de entrada.</span>
                <button
                  onClick={() => onAddMissing?.('in')}
                  disabled
                  className="underline text-blue-600 dark:text-blue-400 opacity-60 cursor-not-allowed text-xs"
                >
                  Agregar marca
                </button>
              </div>
            )}
          </div>
          <ClockLogStatusBadge status={status} />
        </div>

        {/* OUT Mark */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 w-12">SALIDA:</span>
            {outTime ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{outTime}</span>
                <SourceTraceabilityIcon source={source} status={status} />
                {inTime && displayHours && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
                    ({displayHours} horas)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 dark:text-red-400 italic">Falta marca de salida.</span>
                <button
                  onClick={() => onAddMissing?.('out')}
                  disabled
                  className="underline text-blue-600 dark:text-blue-400 opacity-60 cursor-not-allowed text-xs"
                >
                  Agregar marca
                </button>
              </div>
            )}
          </div>
        </div>

        {status === 'orphan' && (
          <div className="mt-2 text-xs flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <span role="img" aria-label="Alerta">⚠️</span>
            <span>Marca huérfana sin pareja.</span>
            <button disabled className="underline opacity-60 cursor-not-allowed">
              Revisar
            </button>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-2">
          {/* Edit button - triggers edit modal */}
          <button
            onClick={() => onEdit?.(log)}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
          >
            Editar
          </button>

          {/* Void button - triggers void modal */}
          <button
            onClick={() => onVoid?.(log)}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            Anular
          </button>
        </div>

        {/* Expandable Audit Timeline — use in_log_id or out_log_id (correct EffectiveClockLog.original fields) */}
        {showAuditTimeline && auditCount > 0 && (
          <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
            <AuditTimeline
              clockLogId={String(log.original?.in_log_id || log.original?.out_log_id)}
              compact={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRow;
