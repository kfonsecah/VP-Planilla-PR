'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { clockLogAdjustmentService, ClockLog } from '@/services/clockLogAdjustmentService';

// Lazy-load framer-motion
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface EditClockLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  clockLog: ClockLog | null; // Original value passed in
  onSuccess?: (updatedMark: ClockLog) => void;
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

const EditClockLogModal: React.FC<EditClockLogModalProps> = ({
  isOpen,
  onClose,
  clockLog,
  onSuccess,
}) => {
  // Form state
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize date/time from clockLog
  useEffect(() => {
    if (isOpen && clockLog) {
      const timestamp = new Date(clockLog.timestamp);
      setDate(timestamp.toISOString().split('T')[0]);
      setTime(timestamp.toTimeString().slice(0, 5));
      setJustification('');
      setShowPreview(false);
    }
  }, [isOpen, clockLog]);

  const handleSubmit = async () => {
    if (!clockLog) return;

    const justificationTrimmed = justification.trim();
    if (justificationTrimmed.length < 10) {
      toast.error('La justificación debe tener al menos 10 caracteres');
      return;
    }

    const newTimestamp = `${date}T${time}:00.000Z`;

    setIsSubmitting(true);
    try {
      const result = await clockLogAdjustmentService.editClockLog(
        clockLog.id,
        clockLog.employeeId,
        newTimestamp,
        clockLog.type,
        justificationTrimmed
      );
      toast.success('Marca actualizada correctamente');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (error) {
      console.error('[EditClockLogModal] Error editing clock log:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la marca');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOriginalValue = () => {
    if (!clockLog) return '';
    const timestamp = new Date(clockLog.timestamp);
    const dateStr = timestamp.toLocaleDateString('es-CR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = timestamp.toTimeString().slice(0, 5);
    return `${clockLog.type === 'IN' ? 'Entrada' : 'Salida'} el ${dateStr} a las ${timeStr}`;
  };

  const getPreviewText = () => {
    if (!clockLog) return '';
    const typeLabel = clockLog.type === 'IN' ? 'Entrada' : 'Salida';
    const originalStr = formatOriginalValue();
    const newDateStr = new Date(date).toLocaleDateString('es-CR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `Se cambiará la marca de ${typeLabel} de ${originalStr} a ${newDateStr} a las ${time}`;
  };

  const isFormValid = justification.trim().length >= 10 && date && time;

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
          {/* Header - Blue accent for EDIT */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white dark:text-zinc-100">
              Editar Marca
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Original Value Display - Read Only */}
          <div className="px-6 pt-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 block mb-1">
                Valor original
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {formatOriginalValue()}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Date and Time - New values */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nueva Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nueva Hora (24h)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Justificación
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explicar motivo de la corrección..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${justification.trim().length >= 10 ? 'text-green-600' : 'text-zinc-400'}`}>
                  {justification.trim().length}/10 caracteres mínimos
                </span>
              </div>
            </div>

            {/* Preview Section */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                showPreview && isFormValid
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ver preview antes de confirmar
                </span>
              </label>
              {showPreview && isFormValid && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  {getPreviewText()}
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
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting || (showPreview && !isFormValid)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl transition-colors font-medium shadow-md"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar corrección'}
            </button>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};

export default EditClockLogModal;