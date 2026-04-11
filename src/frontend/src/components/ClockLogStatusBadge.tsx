import React from 'react';

interface ClockLogStatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
  anomaly: 'bg-amber-100 text-amber-800',
  orphan: 'bg-red-100 text-red-800',
  corrected: 'bg-blue-100 text-blue-800',
};

const STATUS_LABELS: Record<string, string> = {
  valid: 'Valida',
  pending: 'Pendiente',
  anomaly: 'Anomalía',
  orphan: 'Huérfana',
  corrected: 'Corregida',
};

const ClockLogStatusBadge: React.FC<ClockLogStatusBadgeProps> = ({ status }) => {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default ClockLogStatusBadge;
