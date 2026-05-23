"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { usePayroll } from '@/hooks/usePayroll';
import { useNominee } from '@/hooks/useNominee';
import { XMarkIcon, CalendarIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

// Lazy-load framer-motion animation primitives
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface Props {
  open: boolean;
  onClose: () => void;
  periodStart: string;
  periodEnd: string;
  onSaved?: (payrollId: number) => void;
}

type PayrollFormValues = {
  payroll_type_id: number;
  payment_date: string;
  status: string;
};

export default function PayrollCreateModal({ open, onClose, periodStart, periodEnd, onSaved }: Props) {
  const { createPayroll } = usePayroll();
  const { calculatePayrollForPeriod } = useNominee();
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      payroll_type_id: 1,
      payment_date: today,
      status: 'CALCULADO'
    }
  });

  useEffect(() => {
    if (!open) return;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select') as HTMLElement;
      if (firstInput) timerId = setTimeout(() => firstInput.focus(), 100);
    }
    reset({
      payroll_type_id: 1,
      payment_date: today,
      status: 'CALCULADO'
    });
    return () => clearTimeout(timerId);
  }, [open, reset, today]);

  const handleSave = async (values: PayrollFormValues) => {
    setSaving(true);
    try {
      const payload = {
        payroll_type_id: values.payroll_type_id || 1,
        period_start: periodStart,
        period_end: periodEnd,
        payment_date: values.payment_date || today,
        status: values.status || 'CALCULADO'
      };
      
      console.log('Creating payroll with payload:', payload);
      const created = await createPayroll(payload);
      console.log('Payroll created:', created);

      await calculatePayrollForPeriod(periodStart, periodEnd, created.id);

      try {
        const key = 'vp_payroll_history';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(created.id);
        localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
      } catch {}

      toast.success('Planilla guardada exitosamente');
      if (onSaved) onSaved(created.id);
      onClose();
    } catch (err: unknown) {
      console.error('Error saving payroll:', err);
      toast.error(err instanceof Error ? err.message : 'Error al guardar la planilla');
    } finally {
      setSaving(false);
    }
  };

  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 20 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { scale: 0.95, opacity: 0, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <MotionDiv
            className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <MotionDiv
              ref={modalRef}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-zinc-800 dark:to-zinc-900 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Guardar planilla</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-5">
                {/* Period Info */}
                <div className="bg-gradient-to-br from-[#E7DCC1] to-[#F9F1DC] dark:from-zinc-800 dark:to-zinc-900 border-2 border-[#6F7153]/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-zinc-700 dark:text-white mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-white mb-1">Periodo</p>
                      <p className="text-base font-bold text-green-700">
                        {periodStart} — {periodEnd}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type ID */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-white mb-2">
                    Tipo de planilla (ID)
                  </label>
                  <input
                    {...register('payroll_type_id', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-3 border-2 border-[#E7DCC1] dark:border-zinc-600 rounded-lg focus:border-[#6F7153] focus:ring-2 focus:ring-[#6F7153]/20 outline-none transition-all bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    placeholder="1"
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-white mb-2">
                    Fecha de pago
                  </label>
                  <input
                    {...register('payment_date')}
                    type="date"
                    className="w-full px-4 py-3 border-2 border-[#E7DCC1] dark:border-zinc-600 rounded-lg focus:border-[#6F7153] focus:ring-2 focus:ring-[#6F7153]/20 outline-none transition-all bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-white mb-2">
                    Estado
                  </label>
                  <input
                    {...register('status')}
                    type="text"
                    className="w-full px-4 py-3 border-2 border-[#E7DCC1] dark:border-zinc-600 rounded-lg focus:border-[#6F7153] focus:ring-2 focus:ring-[#6F7153]/20 outline-none transition-all bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    placeholder="CALCULADO"
                  />
                </div>

                {/* Info Message */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-600 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">💡</span>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                      Al guardar, se creará el registro de planilla y se almacenarán automáticamente los cálculos de todos los empleados.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
