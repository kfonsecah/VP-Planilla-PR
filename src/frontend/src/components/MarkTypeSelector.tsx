import React from 'react';

interface MarkTypeSelectorProps {
  clockLogId: number;
  currentType: 'IN' | 'OUT';
  onChange?: (newType: 'IN' | 'OUT') => void;
}

export function MarkTypeSelector({ clockLogId, currentType, onChange }: MarkTypeSelectorProps) {
  return (
    <select
      value={currentType}
      onChange={(e) => onChange?.(e.target.value as 'IN' | 'OUT')}
      aria-label={`Tipo de marca para registro ${clockLogId}`}
      className="px-2 py-1 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
    >
      <option value="IN">Entrada</option>
      <option value="OUT">Salida</option>
    </select>
  );
}
