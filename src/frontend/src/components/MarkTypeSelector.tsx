import React from 'react';
export function MarkTypeSelector({ clockLogId, currentType, onChange }: { clockLogId: number, currentType: 'IN' | 'OUT', onChange?: () => void }) {
  return (
    <select 
      value={currentType} 
      onChange={e => onChange?.()}
      className="p-1 border rounded"
    >
      <option value="IN">Entrada</option>
      <option value="OUT">Salida</option>
    </select>
  );
}
