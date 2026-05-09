"use client";

import React, { useState, useMemo } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PayrollService } from '@/services/payrollService';
import { useAguinaldoSummary } from '@/hooks/useAguinaldoSummary';
import { formatCRC } from '@/utils/number';
import { formatDateDisplay } from '@/utils/formatters';
import type { CalculationResult } from '@/types/payrollWizard';

interface PayrollWizardStep3Props {
  payrollId: number;
  calculationData: CalculationResult;
  onApprove: (payrollId: number) => Promise<void>;
  onBack: () => void;
}

export default function PayrollWizardStep3({
  payrollId,
  calculationData,
  onApprove,
  onBack,
}: PayrollWizardStep3Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: aguinaldoData } = useAguinaldoSummary(payrollId);

  const aguinaldoTotals = useMemo(() => {
    return {
      prev: aguinaldoData.reduce((sum, r) => sum + r.accruedBeforeThisPayroll, 0),
      this: aguinaldoData.reduce((sum, r) => sum + r.thisPayrollContribution, 0),
      total: aguinaldoData.reduce((sum, r) => sum + r.totalAccruedWithThis, 0),
    };
  }, [aguinaldoData]);

  const aguinaldoPeriod = useMemo(() => {
    if (!calculationData?.period?.start) return null;
    const d = new Date(calculationData.period.start);
    const localD = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    
    const isDec = localD.getMonth() === 11;
    const yearStart = isDec ? localD.getFullYear() : localD.getFullYear() - 1;
    const yearEnd = isDec ? localD.getFullYear() + 1 : localD.getFullYear();
    
    return {
      start: `${yearStart}-12-01`,
      end: `${yearEnd}-11-30`
    };
  }, [calculationData?.period?.start]);

  const totalNet = calculationData?.employees?.reduce(
    (sum, emp) => sum + Number(emp.netSalary ?? 0),
    0
  ) || 0;

  const totalGross = calculationData?.employees?.reduce(
    (sum, emp) => sum + Number(emp.grossSalary ?? 0),
    0
  ) || 0;

  const employeeCount = calculationData?.employees?.length || 0;

  const handleApprove = async () => {
    if (confirmText !== 'APROBAR') return;

    setIsLoading(true);
    try {
      await PayrollService.approvePayroll(payrollId);
      await onApprove(payrollId);
    } catch (error) {
      console.error('Error approving payroll:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
      setConfirmText('');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver a revisión
        </button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-wider">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          Verificación Final
        </div>
      </div>

      {/* Executive Summary Card - Premium Design */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-3xl shadow-2xl p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-1">Resumen Ejecutivo</h3>
              <p className="text-zinc-400 text-xs font-medium">Planilla ID: #{payrollId} • {calculationData?.period?.label}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <BanknotesIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-1">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Colaboradores</p>
              <p className="text-2xl font-bold">{employeeCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Bruto</p>
              <p className="text-2xl font-bold">{formatCRC(totalGross)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Deducciones</p>
              <p className="text-2xl font-bold">{formatCRC(totalGross - totalNet)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-green-400 text-[10px] font-black uppercase tracking-widest">Neto Total</p>
              <p className="text-3xl font-black text-green-400">{formatCRC(totalNet)}</p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-zinc-900 font-black text-lg rounded-2xl transition-all shadow-lg shadow-green-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Aprobar y Emitir Pagos <CheckCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Aguinaldo Commitment Card */}
      {aguinaldoData && aguinaldoData.length > 0 && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
            <DocumentTextIcon className="w-32 h-32 text-zinc-900 dark:text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Provisión de Aguinaldo</h3>
                <p className="text-xs text-zinc-400 font-medium">Acumulado legal para el período de ley</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Generado en esta planilla</p>
                <p className="text-3xl font-black text-zinc-800 dark:text-zinc-100">{formatCRC(aguinaldoTotals.this)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Total acumulado proyectado</p>
                <p className="text-3xl font-black text-green-700 dark:text-green-300">{formatCRC(aguinaldoTotals.total)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
              <p>
                Estos montos serán respaldados en el snapshot legal de la planilla para cumplimiento de auditoría CCSS. 
                {aguinaldoPeriod && (
                  <span className="font-bold ml-1 text-zinc-700 dark:text-zinc-300">
                    Ciclo: {formatDateDisplay(aguinaldoPeriod.start)} al {formatDateDisplay(aguinaldoPeriod.end)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-2">¿Confirmar Aprobación?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Esta acción es irreversible. Se generarán los comprobantes de pago y se cerrará el período contable.
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                Escribe <span className="text-zinc-900 dark:text-white">"APROBAR"</span> para continuar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full px-6 py-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 text-center text-lg font-black tracking-widest focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                placeholder="••••••"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                disabled={isLoading}
                className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={confirmText !== 'APROBAR' || isLoading}
                className="px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}