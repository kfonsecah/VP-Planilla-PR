import React from 'react';

interface PreviewRow {
  id: string;
  date: string;
  isoDate: string | null;
  type: string;
}

interface ImportPreviewTableProps {
  rows: PreviewRow[];
  skippedRows: unknown[];
}

export function ImportPreviewTable({ rows, skippedRows }: ImportPreviewTableProps) {
  return (
    <div className="w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
             <th className="text-left font-semibold text-zinc-700 dark:text-zinc-300 py-3 px-4">Fila</th>
             <th className="text-left font-semibold text-zinc-700 dark:text-zinc-300 py-3 px-4">Fecha</th>
             <th className="text-left font-semibold text-zinc-700 dark:text-zinc-300 py-3 px-4">Tipo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
           {rows?.length > 0 ? rows.map((r: PreviewRow) => (
             <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
               <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{r.id}</td>
               <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{r.date}</td>
               <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{r.type}</td>
             </tr>
           )) : (
             <tr>
               <td colSpan={3} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                 Sube un archivo para previsualizar las marcas.
               </td>
             </tr>
           )}
        </tbody>
      </table>
      {skippedRows?.length > 0 && (
         <div className="bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 px-4 py-3 text-sm flex items-center gap-2">
           <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
           {skippedRows.length} filas inválidas ignoradas.
         </div>
      )}
    </div>
  );
}
