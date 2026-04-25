"use client";

import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PayrollService } from '@/services/payrollService';
import { formatCRC } from '@/utils/number';

interface CalculationEmployee {
  id: number;
  name: string;
  gross: number;
  net: number;
  deductions: number;
}

interface CalculationResult {
  period: {
    label: string;
    start: string;
    end: string;
  };
  employees: CalculationEmployee[];
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
}

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

  const totalNet = calculationData?.employees?.reduce(
    (sum, emp) => {
      const raw = emp as unknown as Record<string, unknown>;
      return sum + Number(raw.net ?? raw.netSalary ?? raw.net_salary ?? 0);
    },
    0
  ) || 0;

  const totalGross = calculationData?.employees?.reduce(
    (sum, emp) => {
      const raw = emp as unknown as Record<string, unknown>;
      return sum + Number(raw.gross ?? raw.grossSalary ?? raw.total_gross ?? 0);
    },
    0
  ) || 0;

  const employeeCount = calculationData?.employees?.length || 0;

  const handleApprove = async () => {
    if (confirmText !== 'APROBAR') return;

    setIsLoading(true);
    try {
      await PayrollService.approvePayroll(payrollId);
      await onApprove(payrollId);
      // Toast notification handled by parent
    } catch (error) {
      console.error('Error approving payroll:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
      setConfirmText('');
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmText('');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Back navigation */}
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-green-700 dark:bg-green-800 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-6">Resumen Ejecutivo</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-green-200 text-sm">Período</p>
              <p className="font-semibold">{calculationData?.period?.label || 'N/A'}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Empleados</p>
              <p className="font-semibold">{employeeCount}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Total Bruto</p>
              <p className="font-semibold">₡{formatCRC(totalGross)}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Total Neto</p>
              <p className="font-semibold">₡{formatCRC(totalNet)}</p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
          >
            Aprobar Planilla
          </button>
        </div>
      </div>

      {/* Inline confirmation modal with "APROBAR" requirement */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">¿Aprobar Planilla?</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Esta acción aprobará la planilla y no podrá modificarse sin reabrir.
            </p>
            <div className="mb-6">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Escriba <span className="font-bold text-zinc-800 dark:text-zinc-100">&quot;APROBAR&quot;</span> para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                placeholder="APROBAR"
                disabled={isLoading}
                autoFocus
              />
              {confirmText.length > 0 && confirmText !== 'APROBAR' && (
                <p className="text-xs text-red-600 mt-1">
                  Debe escribir exactamente &quot;APROBAR&quot;
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={confirmText !== 'APROBAR' || isLoading}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Aprobando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}