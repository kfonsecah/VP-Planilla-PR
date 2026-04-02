"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ReportsService } from '@/services/reportsService';
import { useModal } from '@/hooks/useModal';
import {
  OfficialReportType,
  PayrollEmployeeReportRow,
  PayrollReportDataset,
  ReportDispatchSummary,
  ReportLogEntry,
  ReportTargetSummary,
  ReportablePayrollSummary,
  ReportsDashboardData,
} from '@/types/reports';
import {
  DocumentArrowUpIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';

const REPORT_LABELS: Record<OfficialReportType, string> = {
  CCSS: 'CCSS · Seguridad Social',
  HACIENDA: 'Hacienda · DGTD',
};

const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
});

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' ? currencyFormatter.format(value) : '₡0.00';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
};

const getLogBadgeClasses = (status?: string) => {
  if (status === 'SENT') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'FAILED') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-zinc-100 text-zinc-700 border-zinc-200';
};

const filterEmployees = (
  employees: PayrollEmployeeReportRow[],
  term: string
) => {
  if (!term) return employees;
  const normalized = term.toLowerCase();
  return employees.filter((employee) =>
    [
      employee.fullName,
      employee.email,
      employee.nationalId,
      employee.socialSecurityCode,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalized))
  );
};

export default function ReportsPage() {
  const modal = useModal();
  const [dashboard, setDashboard] = useState<ReportsDashboardData | null>(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [dataset, setDataset] = useState<PayrollReportDataset | null>(null);
  const [logs, setLogs] = useState<ReportLogEntry[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [reportTypes, setReportTypes] = useState<OfficialReportType[]>(['CCSS', 'HACIENDA']);
  const [ccInput, setCcInput] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dispatchSummary, setDispatchSummary] = useState<ReportDispatchSummary | null>(null);

  const loadDashboard = async () => {
    try {
      const data = await ReportsService.getDashboard();
      setDashboard(data);
      if (!selectedPayrollId && data.payrolls.length > 0) {
        setSelectedPayrollId(data.payrolls[0].id);
      }
    } catch (error) {
      console.error(error);
      modal.showError('Error', 'No se pudo cargar el dashboard de reportes');
    }
  };

  const refreshDataset = async (payrollId: number) => {
    setLoadingDataset(true);
    try {
      const [datasetResponse, logsResponse] = await Promise.all([
        ReportsService.getPayrollDataset(payrollId),
        ReportsService.getPayrollLogs(payrollId),
      ]);
      setDataset(datasetResponse);
      setLogs(logsResponse);
      setSelectedEmployees(datasetResponse.employees.map((employee) => employee.employeeId));
    } catch (error) {
      console.error(error);
      modal.showError('Error', 'No se pudo cargar la planilla seleccionada');
    } finally {
      setLoadingDataset(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPayrollId) {
      refreshDataset(selectedPayrollId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPayrollId]);

  const currentPayroll = useMemo<ReportablePayrollSummary | undefined>(() => {
    if (!dashboard || !selectedPayrollId) return undefined;
    return dashboard.payrolls.find((payroll) => payroll.id === selectedPayrollId);
  }, [dashboard, selectedPayrollId]);

  const filteredEmployees = useMemo(() => {
    if (!dataset) return [];
    return filterEmployees(dataset.employees, searchTerm);
  }, [dataset, searchTerm]);

  const allSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => selectedEmployees.includes(employee.employeeId));

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAll = () => {
    if (!dataset) return;
    if (allSelected) {
      setSelectedEmployees((prev) =>
        prev.filter((id) => !filteredEmployees.some((employee) => employee.employeeId === id))
      );
    } else {
      const idsToAdd = filteredEmployees
        .map((employee) => employee.employeeId)
        .filter((id) => !selectedEmployees.includes(id));
      setSelectedEmployees([...selectedEmployees, ...idsToAdd]);
    }
  };

  const toggleReportType = (type: OfficialReportType) => {
    setReportTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((value) => value !== type);
      }
      return [...prev, type];
    });
  };

  const handleSendReports = async () => {
    if (!selectedPayrollId || !dataset) {
      modal.showWarning('Selecciona una planilla', 'Debes elegir una planilla para enviar los comprobantes.');
      return;
    }

    if (selectedEmployees.length === 0) {
      modal.showWarning('Sin empleados', 'Selecciona al menos un empleado para enviar los reportes.');
      return;
    }

    if (reportTypes.length === 0) {
      modal.showWarning('Tipo requerido', 'Debes seleccionar al menos un tipo de reporte.');
      return;
    }

    const cc = ccInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value && value.includes('@'));

    setSending(true);
    try {
      const response = await ReportsService.sendReports({
        payrollId: selectedPayrollId,
        employeeIds: selectedEmployees,
        reportTypes,
        cc,
        customMessage: customMessage.trim() || undefined,
      });
      setDispatchSummary(response);
      modal.showSuccess(
        'Reportes enviados',
        `Se procesaron ${response.requested} colaboradores (${response.sent} enviados, ${response.failed} fallidos).`
      );
      await refreshDataset(selectedPayrollId);
      await loadDashboard();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo enviar los reportes';
      modal.showError('Error en envío', message);
    } finally {
      setSending(false);
    }
  };

  const handleDownloadReceiptsPdf = async () => {
    if (!selectedPayrollId || !dataset) {
      modal.showWarning('Selecciona una planilla', 'Debes elegir una planilla para descargar los comprobantes.');
      return;
    }

    if (selectedEmployees.length === 0) {
      modal.showWarning('Sin empleados', 'Selecciona al menos un empleado para generar el comprobante.');
      return;
    }

    setDownloadingPdf(true);
    try {
      const { blob, fileName } = await ReportsService.downloadPaymentReceiptsPdf({
        payrollId: selectedPayrollId,
        employeeIds: selectedEmployees,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      modal.showSuccess(
        'PDF generado',
        selectedEmployees.length === 1
          ? 'Se descargó el comprobante del empleado seleccionado.'
          : 'Se descargó un único PDF con todos los comprobantes seleccionados.'
      );
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo generar el PDF de comprobantes';
      modal.showError('Error en descarga', message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderReportTarget = (target: ReportTargetSummary) => (
    <div
      key={target.id}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{target.institution}</span>
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{target.endpoint_url}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{target.contact_email}</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Reportes oficiales</p>
              <h1 className="mt-1 text-3xl font-bold text-zinc-800 dark:text-zinc-100">Envío de comprobantes</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Genera y envía los comprobantes en formato XML para CCSS y Hacienda con un clic.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {dataset?.payroll.total_employees ?? 0} colaboradores
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
                <DocumentArrowUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Generación XML</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Planilla disponible
            </label>
            <Select
              value={selectedPayrollId ? String(selectedPayrollId) : ''}
              onValueChange={(value) => setSelectedPayrollId(Number(value))}
              placeholder={!dashboard ? 'Cargando planillas...' : 'Seleccionar planilla'}
              className="mt-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
            >
              {dashboard?.payrolls.map((payroll) => (
                <SelectItem key={payroll.id} value={String(payroll.id)}>
                  {payroll.label}
                </SelectItem>
              ))}
            </Select>
            {currentPayroll && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Último envío: {currentPayroll.last_sent_at ? formatDate(currentPayroll.last_sent_at) : 'Nunca'} ·{' '}
                {currentPayroll.last_sent_type || 'Sin tipo'}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Monto neto</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
              {formatCurrency(dataset?.payroll.total_net)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Periodo {formatDate(dataset?.payroll.period_start)} – {formatDate(dataset?.payroll.period_end)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Reporte</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['CCSS', 'HACIENDA'] as OfficialReportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleReportType(type)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                    reportTypes.includes(type)
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {REPORT_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <DocumentArrowUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {selectedEmployees.length} empleados seleccionados
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  placeholder="Buscar por nombre, correo o cédula"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-100 focus:border-green-600 dark:focus:border-zinc-500 focus:outline-none"
                />
                <button
                  onClick={toggleSelectAll}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-green-600 dark:hover:border-zinc-500"
                >
                  {allSelected ? 'Quitar selección' : 'Seleccionar visibles'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              {loadingDataset ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      </div>
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-sm text-zinc-700 dark:text-white">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-4 py-3">
                          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold">Colaborador</th>
                        <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                        <th className="px-4 py-3 text-right font-semibold">Bruto</th>
                        <th className="px-4 py-3 text-right font-semibold">Deducciones</th>
                        <th className="px-4 py-3 text-right font-semibold">Neto</th>
                        <th className="px-4 py-3 text-left font-semibold">Último envío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.employeeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.employeeId)}
                              onChange={() => toggleEmployeeSelection(employee.employeeId)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{employee.fullName}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{employee.position || 'Sin puesto'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{employee.email || 'Sin correo'}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">CCSS: {employee.socialSecurityCode || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(employee.grossSalary)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(employee.totalDeductions)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-zinc-800 dark:text-zinc-100">
                            {formatCurrency(employee.netSalary)}
                          </td>
                          <td className="px-4 py-3">
                            {employee.lastDispatch ? (
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                <p className="font-semibold text-zinc-800 dark:text-zinc-100">{employee.lastDispatch.type}</p>
                                <p>{formatDate(employee.lastDispatch.generated_at)}</p>
                                <span
                                  className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getLogBadgeClasses(
                                    employee.lastDispatch.status
                                  )}`}
                                >
                                  {employee.lastDispatch.status}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">Sin registros</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            No hay colaboradores que coincidan con la búsqueda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Configuración del envío</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Personaliza los destinatarios y notas.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    Copia (CC) opcional
                  </label>
                  <input
                    value={ccInput}
                    onChange={(event) => setCcInput(event.target.value)}
                    placeholder="separa varios correos con coma"
                    className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-100 focus:border-green-600 dark:focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                    Mensaje personalizado
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(event) => setCustomMessage(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-100 focus:border-green-600 dark:focus:border-zinc-500 focus:outline-none"
                    placeholder="Mensaje breve que acompañará el correo..."
                  />
                </div>
                <button
                  disabled={downloadingPdf || sending || selectedEmployees.length === 0}
                  onClick={handleDownloadReceiptsPdf}
                  className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                    downloadingPdf || sending || selectedEmployees.length === 0
                      ? 'bg-zinc-400'
                      : 'bg-green-600 hover:bg-green-500'
                  }`}
                >
                  {downloadingPdf ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      {selectedEmployees.length === 1 ? 'Descargar comprobante PDF' : 'Descargar comprobantes PDF'}
                    </>
                  )}
                </button>

                <button
                  disabled={sending || downloadingPdf || selectedEmployees.length === 0}
                  onClick={handleSendReports}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                    sending || downloadingPdf || selectedEmployees.length === 0
                      ? 'bg-zinc-400 dark:bg-zinc-600'
                      : 'bg-green-600 dark:bg-zinc-800 hover:bg-green-500 dark:hover:bg-zinc-700'
                  }`}
                >
                  {sending ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="h-5 w-5" />
                      Enviar comprobantes por correo
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BuildingOffice2Icon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Destinos oficiales</p>
              </div>
              <div className="flex flex-col gap-3">
                {dashboard?.targets.length
                  ? dashboard.targets.map((target) => renderReportTarget(target))
                  : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Configure los entes receptores en la base de datos para mostrar sus contactos aquí.
                    </p>
                  )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Últimos envíos</p>
              </div>
              <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-2">
                {logs.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin historial para esta planilla.</p>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">{log.type}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{formatDate(log.generated_at)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{log.employeeName || 'Empleado'}</p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getLogBadgeClasses(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {dispatchSummary && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  {dispatchSummary.failed === 0 ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  )}
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Resumen del último envío</p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {dispatchSummary.sent} enviados · {dispatchSummary.failed} fallidos
                </p>
                <div className="mt-3 max-h-32 overflow-y-auto pr-1">
                  {dispatchSummary.results.map((result) => (
                    <div key={`${result.employeeId}-${result.status}-${result.detail}`} className="border-b border-zinc-200 dark:border-zinc-700 py-2 last:border-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{result.employeeName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{result.detail}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          result.status === 'sent'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : result.status === 'failed'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <modal.ModalComponent />
    </div>
  );
}
