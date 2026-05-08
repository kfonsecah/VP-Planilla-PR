"use client";

import React, { useState } from 'react';
import { EnvelopeIcon, DocumentChartBarIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';
import { usePayrollSelector } from './hooks/usePayrollSelector';
import { usePayslipDispatch } from './hooks/usePayslipDispatch';
import { useOfficialReports } from './hooks/useOfficialReports';
import { PayslipTab } from './components/PayslipTab';
import { ReportsTab } from './components/ReportsTab';

type Tab = 'payslips' | 'reports';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'payslips', label: 'Comprobantes de pago', icon: EnvelopeIcon },
  { id: 'reports', label: 'Reportes oficiales', icon: DocumentChartBarIcon },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('payslips');

  const { payrolls, selectedId, setSelectedId, selected, isLoading: loadingPayrolls, error: selectorError, reload: reloadPayrolls } = usePayrollSelector();

  const { employees, isLoading: loadingPayslips, error: payslipError, reload: reloadPayslips, resend, download, sent, failed, noEmail } = usePayslipDispatch(selectedId);

  const { history, isLoadingHistory, isGenerating, error: reportsError, generate, reloadHistory } = useOfficialReports(selectedId);

  const handleReload = () => {
    reloadPayslips();
    if (activeTab === 'reports') reloadHistory();
  };

  const error = selectorError ?? payslipError ?? reportsError;

  return (
    <div className="h-full overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        {/* Header */}
        <header className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Módulo de reportes</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-800 dark:text-zinc-100">Reportes y comprobantes</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona los comprobantes de pago de los colaboradores y genera reportes oficiales.
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
            <p className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => { reloadPayrolls(); handleReload(); }}
              className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Payroll Selector */}
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Planilla (solo PAGADAS)
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Selecciona la planilla cuyos comprobantes y reportes quieres gestionar.
            </p>
            <Select
              value={selectedId ? String(selectedId) : ''}
              onValueChange={(v) => setSelectedId(Number(v))}
              placeholder={loadingPayrolls ? 'Cargando planillas…' : payrolls.length === 0 ? 'Sin planillas pagadas' : 'Seleccionar planilla'}
              selectedLabel={selected?.label}
              disabled={loadingPayrolls || payrolls.length === 0}
            >
              {payrolls.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          {selected && (
            <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400 pb-1">
              <span>
                Periodo:{' '}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{selected.label}</span>
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === id
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'payslips' && (
          <PayslipTab
            employees={employees}
            isLoading={loadingPayslips}
            error={payslipError}
            sent={sent}
            failed={failed}
            noEmail={noEmail}
            onResend={resend}
            onDownload={download}
            onReload={reloadPayslips}
            hasPayrollSelected={selectedId !== null}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            payrollId={selectedId}
            history={history}
            isLoadingHistory={isLoadingHistory}
            isGenerating={isGenerating}
            onGenerate={generate}
          />
        )}
      </div>
    </div>
  );
}
