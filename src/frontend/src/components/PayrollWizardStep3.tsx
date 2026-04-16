"use client";

import React, { useState } from 'react';
import { PayrollService } from '@/services/payrollService';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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
    (sum, emp) => sum + (emp.net || 0),
    0
  ) || 0;

  const totalGross = calculationData?.employees?.reduce(
    (sum, emp) => sum + (emp.gross || 0),
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

      {/* Confirmation Dialog with "APROBAR" requirement */}
      <ConfirmDialog
        open={showConfirm}
        title="¿Aprobar Planilla?"
        description="Esta acción aprobará la planilla y no podrá modificarse sin reopen. Escriba 'APROBAR' para confirmar."
        onCancel={handleCancel}
        onConfirm={handleApprove}
      >
        {/* Custom confirmation input - user must type APROBAR */}
        <div className="mt-4">
          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Escriba &quot;APROBAR&quot; para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
            placeholder="APROBAR"
            disabled={isLoading}
          />
          {confirmText !== 'APROBAR' && confirmText.length > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Debe escribir exactamente &quot;APROBAR&quot;
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}