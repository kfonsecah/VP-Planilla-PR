import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { MarkConfidenceBadge } from './MarkConfidenceBadge';
import { MarkTypeSelector } from './MarkTypeSelector';

interface DayMark {
  id: number;
  timestamp: string;
  type: 'IN' | 'OUT';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AuditDayRowProps {
  date: string;
  marks: DayMark[];
  onConfirm: () => void;
}

export function AuditDayRow({ date, marks, onConfirm }: AuditDayRowProps) {
  const [expanded, setExpanded] = useState(false);

  const hasIssues = marks.some((m) => m.confidence !== 'HIGH');

  const formattedDate = (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('es-CR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return date;
    }
  })();

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      hasIssues
        ? 'border-amber-300 dark:border-amber-700/60'
        : 'border-zinc-200 dark:border-zinc-700'
    }`}>
      {/* Row header — clickable to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left gap-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasIssues && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
            {formattedDate}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            {marks.length} {marks.length === 1 ? 'marca' : 'marcas'}
          </span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 py-3 bg-white dark:bg-zinc-900 space-y-2">
          {marks.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
              Sin marcas registradas para este día.
            </p>
          ) : (
            marks.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40"
              >
                <MarkConfidenceBadge level={m.confidence} />
                <MarkTypeSelector clockLogId={m.id} currentType={m.type} />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                  {new Date(m.timestamp).toLocaleTimeString('es-CR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}

          <div className="pt-2 flex justify-end border-t border-zinc-100 dark:border-zinc-800 mt-2">
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              Confirmar día
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
