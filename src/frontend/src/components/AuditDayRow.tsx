import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MarkConfidenceBadge } from './MarkConfidenceBadge';
import { MarkTypeSelector } from './MarkTypeSelector';

interface DayMark {
  id: number;
  timestamp: string;
  type: 'IN' | 'OUT';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface AuditDayRowProps {
  employeeId: string;
  date: string;
  marks: DayMark[];
  isConfirmed?: boolean;
  calculatedHours?: number | null;
  onConfirm: () => void;
  onAddInline: (time: string, type: 'IN' | 'OUT') => Promise<void>;
  onChangeTypeInline: (employeeId: string, logId: number, currentTimestamp: string, newType: 'IN' | 'OUT') => Promise<void>;
  onVoidInline: (employeeId: string, logId: number, type: 'IN' | 'OUT') => Promise<void>;
}

export function AuditDayRow({ 
  employeeId,
  date, 
  marks, 
  isConfirmed, 
  calculatedHours, 
  onConfirm,
  onAddInline,
  onChangeTypeInline,
  onVoidInline
}: AuditDayRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<'IN' | 'OUT'>('IN');
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAdd = async () => {
    if (!newTime) return;
    setIsAdding(true);
    await onAddInline(newTime, newType);
    setNewTime('');
    setIsAdding(false);
  };

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      isConfirmed
        ? 'border-green-200 dark:border-green-900/40 bg-green-50/30 dark:bg-green-900/5'
        : hasIssues
          ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-900/5'
          : 'border-zinc-200 dark:border-zinc-700'
    }`}>
      {/* Row header — clickable to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left gap-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isConfirmed ? (
            <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : hasIssues ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          ) : null}
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
            {formattedDate}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            {marks.length} {marks.length === 1 ? 'marca' : 'marcas'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {calculatedHours != null && (
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">
              {calculatedHours.toFixed(2)} h
            </span>
          )}
          <ChevronDownIcon
            className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 py-3 bg-white dark:bg-zinc-900 space-y-3">
          {/* List of existing marks with inline actions */}
          <div className="space-y-1.5">
            {marks.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 group"
              >
                <MarkConfidenceBadge level={m.confidence} />
                
                <MarkTypeSelector 
                  clockLogId={m.id} 
                  currentType={m.type} 
                  onChange={(newT) => onChangeTypeInline(employeeId, m.id, m.timestamp, newT)}
                />

                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-mono tabular-nums flex-1">
                  {new Date(m.timestamp).toLocaleTimeString('es-CR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <button
                  onClick={() => onVoidInline(employeeId, m.id, m.type)}
                  title="Eliminar marca"
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Inline Add Form — Always visible when expanded */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-100 focus:ring-0 p-0 px-1 w-24"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'IN' | 'OUT')}
                  className="bg-transparent border-none text-xs font-medium text-zinc-600 dark:text-zinc-400 focus:ring-0 p-0"
                >
                  <option value="IN">ENTRADA</option>
                  <option value="OUT">SALIDA</option>
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!newTime || isAdding}
                  className="ml-auto p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md disabled:opacity-30 transition-colors"
                  title="Añadir marca"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation button */}
          <div className="pt-2 flex justify-between items-center">
            {isConfirmed ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" /> Día Revisado
              </span>
            ) : (
              <div />
            )}
            <button
              onClick={onConfirm}
              disabled={isConfirmed}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${
                isConfirmed
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <CheckIcon className="w-3.5 h-3.5" />
              {isConfirmed ? 'Confirmado' : 'Confirmar día'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
