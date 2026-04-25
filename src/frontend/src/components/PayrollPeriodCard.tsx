import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { BiweeklyPeriod } from '@/hooks/usePayrollWizard';

interface PayrollPeriodCardProps {
  period: BiweeklyPeriod;
  isSelected: boolean;
  onSelect: (period: { start: string; end: string; label: string }) => void;
}

function formatDateRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString('es-CR', { month: 'long' });
  return `${startDay} - ${endDay} ${month}`;
}

export default function PayrollPeriodCard({ period, isSelected, onSelect }: PayrollPeriodCardProps) {
  const handleClick = () => {
    onSelect({
      start: period.start.toISOString().split('T')[0],
      end: period.end.toISOString().split('T')[0],
      label: period.label,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`
        p-4 rounded-xl border-2 text-left transition-all w-full
        ${isSelected
          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-green-400'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <CalendarIcon
          className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-zinc-400'}`}
        />
        {period.isCurrent && (
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Actual
          </span>
        )}
      </div>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        {period.label}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {formatDateRange(period.start, period.end)}
      </p>
    </button>
  );
}