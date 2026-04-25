'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { clockLogAdjustmentService, ClockLog } from '@/services/clockLogAdjustmentService';

// Lazy-load framer-motion
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface VoidClockLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  clockLog: ClockLog | null;
  onConfirm?: (voidedMark: ClockLog) => void;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 20, stiffness: 250 },
  },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } },
};

const VoidClockLogModal: React.FC<VoidClockLogModalProps> = ({
  isOpen,
  onClose,
  clockLog,
  onConfirm,
}) => {
  // Form state
  const [justification, setJustification] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      setJustification('');
      setConfirmationText('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!clockLog) return;

    const justificationTrimmed = justification.trim();
    if (justificationTrimmed.length < 10) {
      toast.error('La justificación debe tener al menos 10 caracteres');
      return;
    }

    if (confirmationText.toUpperCase() !== 'ANULAR') {
      toast.error('Debe escribir ANULAR para confirmar');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await clockLogAdjustmentService.voidClockLog(
        clockLog.id,
        clockLog.employeeId,
        clockLog.type,
        justificationTrimmed
      );
      toast.success('Marca anulada correctamente');

      if (onConfirm) {
        onConfirm(result);
      }

      onClose();
    } catch (error) {
      console.error('[VoidClockLogModal] Error voiding clock log:', error);
      toast.error(error instanceof Error ? error.message : 'Error al anular la marca');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMarkInfo = () => {
    if (!clockLog) return '';
    const timestamp = new Date(clockLog.timestamp);
    const dateStr = timestamp.toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = timestamp.toTimeString().slice(0, 5);
    const typeLabel = clockLog.type === 'IN' ? 'Entrada' : 'Salida';
    return `${typeLabel} el ${dateStr} a las ${timeStr}`;
  };

  const isFormValid = justification.trim().length >= 10 && confirmationText.toUpperCase() === 'ANULAR';

  if (!isOpen || !clockLog) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/60 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <MotionDiv
          className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Red accent for VOID (destructive) */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-800 dark:to-red-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white dark:text-zinc-100">
              Anular Marca
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Warning Banner */}
          <div className="px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Acción Irreversible
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    La marca no se eliminará físicamente pero no se incluirá en cálculos de nómina.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mark to void display */}
          <div className="px-6 pt-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 block mb-1">
                Marca a anular
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {formatMarkInfo()}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Justificación
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explicar motivo de la anulación..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${justification.trim().length >= 10 ? 'text-green-600' : 'text-zinc-400'}`}>
                  {justification.trim().length}/10 caracteres mínimos
                </span>
              </div>
            </div>

            {/* Confirmation Text Input - Requires "ANULAR" */}
            <div>
              <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1.5">
                Confirmar anulación
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder='Escriba "ANULAR" para confirmar'
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {confirmationText.toUpperCase() !== 'ANULAR' && confirmationText.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Debe escribir ANULAR para confirmar
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isFormValid || isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white dark:bg-red-600 dark:hover:bg-red-700 rounded-xl transition-colors font-medium shadow-md"
            >
              {isSubmitting ? 'Anulando...' : 'Confirmar anulación'}
            </button>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};

export default VoidClockLogModal;
