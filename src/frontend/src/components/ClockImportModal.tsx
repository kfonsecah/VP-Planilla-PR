import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ImportPreviewTable } from './ImportPreviewTable';
import { detectColumns } from '../features/clock-logs/parser/excelColumnDetector';
import { parseDateTime } from '../features/clock-logs/parser/dateFormatParser';
import { ClockLogsService } from '@/services/clockLogsService';

interface ParsedRow {
  id: string;
  date: string;
  isoDate: string | null;
  type: string;
}

export function ClockImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseCSV = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.split(','));
    if (lines.length < 2) return;

    const headers = lines[0];
    const cols = detectColumns(headers);

    const newRows: ParsedRow[] = lines.slice(1).filter(l => l.length > 1).map((line, idx) => {
      const dt = parseDateTime(line[cols.dateIdx], line[cols.timeIdx]);
      return {
        id: line[cols.idIdx] || String(idx + 1),
        date: dt ? dt.toLocaleString() : 'Inválida',
        isoDate: dt ? dt.toISOString() : null,
        type: (cols.typeIdx !== -1 && line[cols.typeIdx]) ? String(line[cols.typeIdx]) : ''
      };
    });
    setRows(newRows);
  }, []);

  const parseExcel = useCallback(async (file: File) => {
    const { Workbook } = await import('exceljs');
    const buffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];

    const data: unknown[][] = [];
    ws.eachRow(row => {
      data.push(row.values as unknown[]);
    });

    if (data.length < 2) return;

    const headers = (data[0] as unknown[]).slice(1);
    const cols = detectColumns(headers);

    const newRows: ParsedRow[] = data.slice(1).map((row, idx) => {
      const vals = (row as unknown[]).slice(1);
      const dt = parseDateTime(vals[cols.dateIdx], vals[cols.timeIdx]);
      return {
        id: String(vals[cols.idIdx] || idx + 1),
        date: dt ? dt.toLocaleString() : 'Inválida',
        isoDate: dt ? dt.toISOString() : null,
        type: (cols.typeIdx !== -1 && vals[cols.typeIdx]) ? String(vals[cols.typeIdx]) : ''
      };
    });
    setRows(newRows);
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      if (file.name.endsWith('.csv')) {
        await parseCSV(file);
      } else {
        await parseExcel(file);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
    } finally {
      setIsParsing(false);
    }
  }, [parseCSV, parseExcel]);

  useEffect(() => {
    if (selectedFile) {
      parseFile(selectedFile);
    } else {
      setRows([]);
    }
  }, [selectedFile, parseFile]);

  const handleImport = async () => {
    setIsSubmitting(true);
    try {
      const payloadLogs = rows.filter(r => r.isoDate).map(r => ({
        employee_id: r.id,
        employee_name: r.id,
        timestamp: r.isoDate,
        log_type: r.type
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ClockLogsService.importLogs(payloadLogs as any, 'excel_import');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      alert('Error procesando importación: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-zinc-900 dark:text-zinc-100">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 max-w-4xl w-full flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="mb-6 flex justify-between items-start">
           <div>
             <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Importar Marcas</h2>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sube un reporte del reloj marcador para detectar marcas entrantes y salientes.</p>
           </div>
           <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <XMarkIcon className="w-5 h-5" />
           </button>
         </div>

         {/* Upload Zone */}
         <label className="relative group flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-green-500 dark:hover:border-green-600 transition-all cursor-pointer mb-6 overflow-hidden">
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <ArrowUpTrayIcon className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-green-600" />
              </div>
              <p className="text-sm font-medium">
                {selectedFile ? selectedFile.name : <><span className="text-green-600">Haz clic para subir</span> o arrastra el archivo</>}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Soportamos formatos .xlsx y .csv</p>
            </div>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />

            {selectedFile && (
              <div className="absolute inset-0 bg-green-50/90 dark:bg-zinc-900/95 flex items-center justify-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="text-xs font-bold text-green-700 dark:text-green-500 uppercase tracking-wider">Archivo Listo</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedFile.name}</p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                  className="ml-4 p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
         </label>

         <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
           <div className="flex items-center gap-2 mb-3">
             <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Previsualización de Datos</h3>
             <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
           </div>

           {isParsing ? (
             <div className="py-12 flex flex-col items-center justify-center text-zinc-400 space-y-4">
               <div className="w-8 h-8 border-2 border-zinc-200 border-t-green-600 rounded-full animate-spin" />
               <p className="text-sm font-medium animate-pulse">Analizando estructura del archivo...</p>
             </div>
           ) : (
             <ImportPreviewTable rows={rows} skippedRows={[]} />
           )}
         </div>

         <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
           <button onClick={onClose} className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors shadow-sm">
             Cancelar
           </button>
           <button
            onClick={handleImport}
            disabled={!selectedFile || rows.length === 0 || isParsing || isSubmitting}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:grayscale text-white rounded-xl text-sm font-medium shadow-sm shadow-green-600/20 transition-colors flex items-center gap-2"
           >
             {isSubmitting ? 'Importando...' : 'Procesar Importación'}
             <CheckCircleIcon className="w-4 h-4" />
           </button>
         </div>
      </div>
    </div>
  );
}
