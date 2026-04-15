import React from 'react';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';

interface DailyRowProps {
  log: EffectiveClockLog;
  onAddMissing?: (type: 'in' | 'out') => void;  // stub — no-op in Phase 34
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

const DailyRow: React.FC<DailyRowProps> = ({ log, onAddMissing }) => {
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
      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
        {dateLabel}
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

        <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
          {status !== 'valid' ? (
            <button
              disabled
              aria-label="Corregir marca (disponible en próxima actualización)"
              className="px-3 py-1 text-xs font-medium rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 opacity-60 cursor-not-allowed"
            >
              Corregir
            </button>
          ) : (
            <button
              disabled
              aria-label="Ver detalles (disponible en próxima actualización)"
              className="px-3 py-1 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 opacity-60 cursor-not-allowed"
            >
              Ver detalles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRow;
