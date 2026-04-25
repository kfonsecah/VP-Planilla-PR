import React from 'react';

interface AuditFiltersProps {
  showOnlyIssues: boolean;
  onToggleIssues: () => void;
  resultCount: number;
}

export function AuditFilters({ showOnlyIssues, onToggleIssues, resultCount }: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        Filtros:
      </span>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <span
          role="checkbox"
          aria-checked={showOnlyIssues}
          tabIndex={0}
          onClick={onToggleIssues}
          onKeyDown={(e) => e.key === 'Enter' && onToggleIssues()}
          className={`w-10 h-5 rounded-full transition-colors flex items-center ${
            showOnlyIssues ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
              showOnlyIssues ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </span>
        <span className="text-sm text-zinc-700 dark:text-zinc-300">Solo con problemas</span>
      </label>

      <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
        {resultCount} empleado{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
