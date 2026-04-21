import React, { useState } from 'react';
import { MarkConfidenceBadge } from './MarkConfidenceBadge';
import { MarkTypeSelector } from './MarkTypeSelector';

interface DayMark { id: number; timestamp: string; type: 'IN' | 'OUT'; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; }
export function AuditDayRow({ date, marks, onConfirm }: { date: string, marks: DayMark[], onConfirm: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded mb-2 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="p-3 w-full text-left bg-gray-100 font-semibold flex justify-between">
        <span>{date} - {marks.length} marcas</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="p-4 bg-white">
          {marks.map(m => (
            <div key={m.id} className="flex gap-4 items-center mb-2">
              <MarkConfidenceBadge level={m.confidence} />
              <MarkTypeSelector clockLogId={m.id} currentType={m.type} />
              <span className="text-sm text-gray-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          <button onClick={onConfirm} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Confirmar Dia</button>
        </div>
      )}
    </div>
  );
}
