import React from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { EmployeePayslipRow as RowData, PayslipSendStatus } from '../hooks/usePayslipDispatch';

const STATUS_LABELS: Record<PayslipSendStatus, string> = {
  enviado: 'Enviado',
  reenviado: 'Reenviado',
  fallido: 'Falló',
  'sin-email': 'Sin email',
  'sin-registro': 'Sin registro',
};

const STATUS_CLASSES: Record<PayslipSendStatus, string> = {
  enviado: 'bg-green-100 text-green-700 border-green-200',
  reenviado: 'bg-blue-100 text-blue-700 border-blue-200',
  fallido: 'bg-red-100 text-red-700 border-red-200',
  'sin-email': 'bg-zinc-100 text-zinc-500 border-zinc-200',
  'sin-registro': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const currencyFmt = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' });
const formatCurrency = (v: number) => currencyFmt.format(v);

interface Props {
  employee: RowData;
  onResend: (payrollEmployeeId: number, employeeId: number) => void;
  onDownload: (payrollEmployeeId: number, employeeId: number) => void;
}

const EmployeePayslipRowComponent: React.FC<Props> = ({ employee, onResend, onDownload }) => {
  const canResend =
    employee.sendStatus !== 'sin-email' && !employee.isResending;

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      <td className="px-4 py-3">
        <p className="font-semibold text-zinc-800 dark:text-zinc-100">{employee.fullName}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{employee.position || 'Sin puesto'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {employee.email || <span className="italic text-zinc-400">Sin correo</span>}
        </p>
      </td>
      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-200">
        {formatCurrency(employee.grossSalary)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-200">
        {formatCurrency(employee.totalDeductions)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {formatCurrency(employee.netSalary)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[employee.sendStatus]}`}
        >
          {STATUS_LABELS[employee.sendStatus]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            disabled={!canResend}
            onClick={() => onResend(employee.payrollEmployeeId, employee.employeeId)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              canResend
                ? 'border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:border-green-500 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            {employee.isResending ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-3.5 w-3.5" />
            )}
            {employee.isResending ? 'Enviando…' : 'Reenviar'}
          </button>
          <button
            disabled={employee.isDownloading}
            onClick={() => onDownload(employee.payrollEmployeeId, employee.employeeId)}
            title="Descargar comprobante PDF"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              !employee.isDownloading
                ? 'border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            {employee.isDownloading ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            )}
            {employee.isDownloading ? 'Descargando…' : 'PDF'}
          </button>
        </div>
      </td>
    </tr>
  );
};

export const EmployeePayslipRow = React.memo(EmployeePayslipRowComponent);
