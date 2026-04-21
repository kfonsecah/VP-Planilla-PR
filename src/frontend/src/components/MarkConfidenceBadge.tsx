import React from 'react';
export function MarkConfidenceBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const c = level === 'HIGH' ? 'bg-green-500' : level === 'MEDIUM' ? 'bg-yellow-400' : 'bg-red-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${c}`} />;
}
