import React from 'react';

interface MarkConfidenceBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

const BADGE_STYLES: Record<MarkConfidenceBadgeProps['level'], { dot: string; label: string; text: string }> = {
  HIGH: {
    dot: 'bg-green-500',
    label: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    text: 'Alta',
  },
  MEDIUM: {
    dot: 'bg-amber-400',
    label: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    text: 'Media',
  },
  LOW: {
    dot: 'bg-red-500',
    label: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    text: 'Baja',
  },
};

export function MarkConfidenceBadge({ level }: MarkConfidenceBadgeProps) {
  const styles = BADGE_STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${styles.label}`}
      title={`Confianza: ${styles.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
      {styles.text}
    </span>
  );
}
