"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PayrollService } from '@/services/payrollService';

const overrideSchema = z.object({
  regularHours: z.coerce.number().min(0).optional(),
  overtimeHours: z.coerce.number().min(0).optional(),
  weeklyRestHours: z.coerce.number().min(0).optional(),
  totalDeductions: z.coerce.number().min(0).optional(),
});

type OverrideFormData = z.infer<typeof overrideSchema>;
type OverrideFormInput = z.input<typeof overrideSchema>;

interface CurrentData {
  regularHours: number;
  overtimeHours: number;
  weeklyRestHours: number;
  totalDeductions: number;
}

interface PayrollEmployeeAdjustModalProps {
  isOpen: boolean;
  payrollId: number;
  employeeId: number;
  employeeName: string;
  currentData: CurrentData;
  onClose: () => void;
  onSave: (override: OverrideFormData) => Promise<void>;
}

export default function PayrollEmployeeAdjustModal({
  isOpen,
  payrollId,
  employeeId,
  employeeName,
  currentData,
  onClose,
  onSave,
}: PayrollEmployeeAdjustModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OverrideFormInput, unknown, OverrideFormData>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      regularHours: currentData.regularHours,
      overtimeHours: currentData.overtimeHours,
      weeklyRestHours: currentData.weeklyRestHours,
      totalDeductions: currentData.totalDeductions,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmitForm = async (data: OverrideFormData) => {
    setIsSaving(true);
    try {
      await PayrollService.saveEmployeeOverride(payrollId, employeeId, data);
      toast.success(`Ajuste guardado para ${employeeName}`);
      await onSave(data);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar ajuste');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{employeeName}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Ajustar horas y deducciones</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleSubmitForm)} className="p-6 space-y-5">
                {/* Hours */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Horas</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Horas regulares', field: 'regularHours' as const },
                      { label: 'Horas extra', field: 'overtimeHours' as const },
                      { label: 'Descanso semanal', field: 'weeklyRestHours' as const },
                    ].map(({ label, field }) => (
                      <label key={field} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          {...register(field)}
                          className="w-24 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                      </label>
                    ))}
                  </div>
                  {errors.root && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">{errors.root.message}</p>
                  )}
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Deducciones</h3>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Total deducciones</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('totalDeductions')}
                      className="w-24 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
