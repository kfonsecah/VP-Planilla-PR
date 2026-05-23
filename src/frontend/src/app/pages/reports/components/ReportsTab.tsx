import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';
import { ReportHistoryTable } from './ReportHistoryTable';
import { ReportLogEntry } from '@/types/reports';

const DOWNLOAD_BTN_DISABLED = 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 cursor-not-allowed';
const DOWNLOAD_BTN_ENABLED = 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/50';

interface Props {
  payrollId: number | null;
  history: ReportLogEntry[];
  isLoadingHistory: boolean;
  isGenerating: 'CCSS' | 'HACIENDA' | null;
  isDownloading: 'CCSS' | 'INS' | null;
  isDownloadingD151: boolean;
  isDownloadingAnnualSalary: boolean;
  onGenerate: (type: 'CCSS' | 'HACIENDA') => void;
  onDownloadCCSS: () => void;
  onDownloadINS: () => void;
  onDownloadD151: (year: number) => void;
  onDownloadAnnualSalary: (year: number) => void;
}

const ReportsTabComponent: React.FC<Props> = ({
  payrollId,
  history,
  isLoadingHistory,
  isGenerating,
  isDownloading,
  isDownloadingD151,
  isDownloadingAnnualSalary,
  onGenerate,
  onDownloadCCSS,
  onDownloadINS,
  onDownloadD151,
  onDownloadAnnualSalary,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const disabled = !payrollId || isGenerating !== null;
  const downloadDisabled = !payrollId || isDownloading !== null;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col gap-6">
      {/* Institutional Exports (New Section) */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <DocumentArrowDownIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">Exportaciones Institucionales</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Archivos para trámites reglamentarios y fiscales</p>
            </div>
          </div>

          <div className="w-full sm:w-40">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
              placeholder="Año"
              selectedLabel={String(selectedYear)}
            >
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {/* Download CCSS */}
          <button
            disabled={downloadDisabled}
            onClick={onDownloadCCSS}
            data-testid="download-ccss-btn"
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              downloadDisabled
                ? DOWNLOAD_BTN_DISABLED
                : DOWNLOAD_BTN_ENABLED
            }`}
          >
            {isDownloading === 'CCSS' ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheckIcon className="h-4 w-4 text-green-600" />
            )}
            Descargar CCSS (SICERE)
          </button>

          {/* Download INS */}
          <button
            disabled={downloadDisabled}
            onClick={onDownloadINS}
            data-testid="download-ins-btn"
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              downloadDisabled
                ? DOWNLOAD_BTN_DISABLED
                : DOWNLOAD_BTN_ENABLED
            }`}
          >
            {isDownloading === 'INS' ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <AcademicCapIcon className="h-4 w-4 text-blue-600" />
            )}
            Descargar INS (Riesgos)
          </button>

          {/* Download D-151 */}
          <button
            disabled={isDownloadingD151}
            onClick={() => onDownloadD151(selectedYear)}
            data-testid="download-d151-btn"
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              isDownloadingD151
                ? DOWNLOAD_BTN_DISABLED
                : DOWNLOAD_BTN_ENABLED
            }`}
          >
            {isDownloadingD151 ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <BuildingOffice2Icon className="h-4 w-4 text-orange-600" />
            )}
            Descargar Hacienda D-151 (CSV)
          </button>

          {/* Download Annual Salary Summary */}
          <button
            disabled={isDownloadingAnnualSalary}
            onClick={() => onDownloadAnnualSalary(selectedYear)}
            data-testid="download-annual-salary-btn"
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              isDownloadingAnnualSalary
                ? DOWNLOAD_BTN_DISABLED
                : DOWNLOAD_BTN_ENABLED
            }`}
          >
            {isDownloadingAnnualSalary ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <TableCellsIcon className="h-4 w-4 text-emerald-600" />
            )}
            Resumen Salarial Anual (Excel)
          </button>
        </div>
      </div>

      {/* Generate buttons (Dispatch) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* CCSS */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">CCSS</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Seguridad Social</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Genera y envía el reporte de planilla al sistema de Caja Costarricense de Seguro Social.
          </p>
          <button
            disabled={disabled}
            onClick={() => onGenerate('CCSS')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              disabled
                ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isGenerating === 'CCSS' ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              'Generar reporte CCSS'
            )}
          </button>
        </div>

        {/* Hacienda */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">Hacienda</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">DGTD · Ministerio de Hacienda</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Genera y envía el reporte de retenciones al Ministerio de Hacienda (DGTD).
          </p>
          <button
            disabled={disabled}
            onClick={() => onGenerate('HACIENDA')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              disabled
                ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isGenerating === 'HACIENDA' ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              'Generar reporte Hacienda'
            )}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <ClockIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Historial de reportes</p>
        </div>
        <ReportHistoryTable history={history} isLoading={isLoadingHistory} />
      </div>
    </div>
  );
};

export const ReportsTab = React.memo(ReportsTabComponent);
