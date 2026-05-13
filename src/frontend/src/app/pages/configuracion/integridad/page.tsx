"use client";

import React from 'react';
import { useIntegrityDashboard } from '@/hooks/useIntegrityDashboard';
import { IntegrityHealthScore } from '@/components/integrity/IntegrityHealthScore';
import { IntegrityAlertList } from '@/components/integrity/IntegrityAlertList';
import { ShieldAlert, RefreshCcw, History } from 'lucide-react';

/**
 * Page component for the Data Integrity Dashboard.
 * Displays health score, summary stats, and a detailed list of integrity alerts.
 */
export default function IntegrityPage() {
  const { data, isLoading, isAuditing, runAudit, error } = useIntegrityDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Integridad de Datos</h1>
          </div>
          <p className="text-slate-500 text-sm">Monitoreo y auditoría de calidad de información del sistema.</p>
        </div>
        
        <button
          onClick={runAudit}
          disabled={isLoading || isAuditing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'Ejecutando Auditoría...' : 'Ejecutar Auditoría Manual'}
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      {isLoading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-[400px] bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <IntegrityHealthScore score={data.healthScore} />
            
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                Resumen de Auditoría
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total de Alertas</span>
                  <span className="text-sm font-bold text-slate-900">{data.totalAlerts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Errores Críticos</span>
                  <span className="text-sm font-bold text-rose-600">{data.errorCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Advertencias</span>
                  <span className="text-sm font-bold text-amber-600">{data.warningCount}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-xs text-slate-400">Última Auditoría</span>
                  <span className="text-xs font-medium text-slate-600">
                    {data.lastAuditAt ? new Date(data.lastAuditAt).toLocaleString() : 'Nunca'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              Alertas Detectadas
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                {data.alerts.length}
              </span>
            </h3>
            <IntegrityAlertList alerts={data.alerts} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
