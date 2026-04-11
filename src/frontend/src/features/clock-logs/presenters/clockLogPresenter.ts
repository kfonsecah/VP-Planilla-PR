/**
 * Presenter for Clock Logs UI
 * Contains pure functions and constants for formatting and visual configuration.
 */

export const SOURCE_LABELS: Record<string, string> = {
  java_import: 'Java',
  excel_import: 'Excel',
  manual: 'Manual',
};

export const STATUS_OPTIONS = ['pending', 'valid', 'anomaly', 'orphan', 'corrected'] as const;

export const STATUS_CARD_COLORS: Record<string, { border: string; bg: string; text: string; count: string }> = {
  pending: {
    border: 'border-l-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    text: 'text-gray-600 dark:text-gray-400',
    count: 'text-gray-800 dark:text-gray-200',
  },
  valid: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    count: 'text-green-800 dark:text-green-200',
  },
  anomaly: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    count: 'text-amber-800 dark:text-amber-200',
  },
  orphan: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    count: 'text-red-800 dark:text-red-200',
  },
  corrected: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    count: 'text-blue-800 dark:text-blue-200',
  },
};

export const STATUS_NAMES: Record<string, string> = {
  pending: 'Pendiente',
  valid: 'Valida',
  anomaly: 'Anomalia',
  orphan: 'Huerfana',
  corrected: 'Corregida',
};

export const STATUS_TOGGLE_COLORS: Record<string, { active: string; inactive: string }> = {
  pending: {
    active: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-400',
    inactive: 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700',
  },
  valid: {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  anomaly: {
    active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  orphan: {
    active: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
  corrected: {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-400',
    inactive: 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
  },
};

// Helpers for date conversion ISO (backend) <-> display dd/mm/yy (DatePicker)
export const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  
  let d: Date;
  if (iso.length === 10 && iso.includes('-') && !iso.includes('T')) {
    const [y, m, d_part] = iso.split('-').map(Number);
    d = new Date(y, m - 1, d_part);
  } else {
    d = new Date(iso);
  }

  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

export const parseDisplayToISO = (display: string): string => {
  if (!display || display.length < 8) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return '';
  
  const [day, month, year] = parts.map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  const d = new Date(fullYear, month - 1, day);

  // Validation: ensure JS didn't wrap around (e.g. 31/02 -> 03/03)
  if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== fullYear) {
    return '';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Returns a view model with presentation-specific properties for a clock log.
 */
export const getClockLogViewModel = (log: any) => {
  const isProblematic = log.status === 'anomaly' || log.status === 'orphan';
  
  return {
    ...log,
    displaySource: SOURCE_LABELS[log.source] ?? log.source,
    displayTimestamp: new Date(log.timestamp).toLocaleString('es-CR'),
    statusText: STATUS_NAMES[log.status] ?? log.status,
    isProblematic,
    actionButtonLabel: isProblematic ? 'Corregir' : 'Ver',
    typeBadgeClasses: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
      log.log_type === 'IN'
        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
    }`,
    actionButtonClasses: `px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
      isProblematic
        ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50'
        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
    }`
  };
};
