import React, { useMemo, useState } from 'react';
import {
  EnvelopeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { EmployeePayslipRow } from './EmployeePayslipRow';
import { EmployeePayslipRow as RowData } from '../hooks/usePayslipDispatch';

interface Props {
  employees: RowData[];
  isLoading: boolean;
  error: string | null;
  sent: number;
  failed: number;
  noEmail: number;
  onResend: (payrollEmployeeId: number, employeeId: number) => void;
  onDownload: (payrollEmployeeId: number, employeeId: number) => void;
  onReload: () => void;
  hasPayrollSelected: boolean;
}

const PayslipTabComponent: React.FC<Props> = ({
  employees,
  isLoading,
  error,
  sent,
  failed,
  noEmail,
  onResend,
  onDownload,
  onReload,
  hasPayrollSelected,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const term = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(term) ||
        (e.email ?? '').toLowerCase().includes(term) ||
        (e.position ?? '').toLowerCase().includes(term)
    );
  }, [employees, search]);

  if (!hasPayrollSelected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
        <EnvelopeIcon className="h-12 w-12 mb-3" />
        <p className="text-sm">Selecciona una planilla para ver los comprobantes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
        <EnvelopeIcon className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Los comprobantes se envían automáticamente al aprobar el pago de la planilla. Desde aquí
          puedes reenviar comprobantes individuales sin necesidad de reabrir la planilla.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{sent}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Enviados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{failed}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Fallidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <div>
            <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{noEmail}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sin email</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar colaborador…"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 py-2 text-sm text-zinc-700 dark:text-zinc-100 focus:border-green-500 dark:focus:border-green-500 focus:outline-none"
          />
        </div>
        <button
          onClick={onReload}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                    Correo
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                    Bruto
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                    Deducciones
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-300">
                    Neto
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filtered.map((emp) => (
                  <EmployeePayslipRow key={emp.payrollEmployeeId} employee={emp} onResend={onResend} onDownload={onDownload} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500"
                    >
                      {search ? 'Sin resultados para la búsqueda' : 'No hay colaboradores en esta planilla'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const PayslipTab = React.memo(PayslipTabComponent);
