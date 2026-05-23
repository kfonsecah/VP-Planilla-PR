'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ClockLogsService, ClockLogPaginated } from '@/services/clockLogsService';
import ClockLogStatusBadge from '@/components/ClockLogStatusBadge';

// Lazy-load framer-motion animation primitives — same pattern as EditEmployeeModal
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface AuditLogEntry {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_name?: string;
}

interface ClockLogDetailModalProps {
  isOpen: boolean;
  log: ClockLogPaginated | null;
  onClose: () => void;
  onCorrected: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  java_import: 'Java',
  excel_import: 'Excel',
  manual: 'Manual',
};

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

const ClockLogDetailModal: React.FC<ClockLogDetailModalProps> = ({
  isOpen,
  log,
  onClose,
  onCorrected,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionAction, setCorrectionAction] = useState<'corrected' | 'discard'>('corrected');

  useEffect(() => {
    if (isOpen && log) {
      setJustification('');
      setShowCorrectionForm(false);
      setCorrectionAction('corrected');

      setIsLoadingAudit(true);
      ClockLogsService.getAuditLogsForClockLog(log.id)
        .then((entries) => {
          const mapped: AuditLogEntry[] = entries.map((entry) => ({
            id: Number(entry.id ?? 0),
            action: String(entry.action ?? ''),
            details: String(entry.details ?? entry.description ?? ''),
            created_at: String(entry.created_at ?? entry.createdAt ?? ''),
            user_name: entry.user_name != null ? String(entry.user_name) : undefined,
          }));
          setAuditLogs(mapped);
        })
        .catch((err: unknown) => {
          console.warn('[ClockLogDetailModal] Error al cargar historial:', err instanceof Error ? err.message : err);
          setAuditLogs([]);
        })
        .finally(() => setIsLoadingAudit(false));

      let timerId: ReturnType<typeof setTimeout> | undefined;
      if (modalRef.current) {
        timerId = setTimeout(() => modalRef.current?.focus(), 100);
      }
      return () => clearTimeout(timerId);
    }
  }, [isOpen, log]);

  const handleCorrection = async () => {
    if (!log) return;
    if (justification.trim().length < 5) {
      toast.error('La justificación debe tener al menos 5 caracteres');
      return;
    }
    setIsSubmitting(true);
    try {
      const targetStatus = 'corrected';
      await ClockLogsService.updateClockLogStatus(log.id, targetStatus, justification.trim());
      toast.success('Marca actualizada correctamente');
      onCorrected();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la marca';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString('es-CR');
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && log && (
        <>
          {/* Backdrop */}
          <MotionDiv
            className="fixed inset-0 bg-black/50 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <MotionDiv
              ref={modalRef}
              className="pointer-events-auto w-full max-w-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="bg-zinc-800 dark:bg-zinc-800 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Detalle de Marca</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">ID #{log.id}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 hover:bg-zinc-700 rounded-full"
                    aria-label="Cerrar modal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">

                  {/* Section 1: Log Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                      Datos del Registro
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Empleado</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium mt-0.5">{log.employee_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ID Empleado</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{log.employee_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Timestamp</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{formatDateTime(log.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tipo</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5 font-mono font-semibold">{log.log_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</p>
                        <div className="mt-0.5">
                          <ClockLogStatusBadge status={log.status} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Source</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{SOURCE_LABELS[log.source] ?? log.source}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Observaciones</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{log.remarks || 'Ninguna'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Session ID</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">{log.import_session_id ?? 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Audit History */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                      Historial de Auditoría
                    </h3>
                    {isLoadingAudit ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando historial...</p>
                    ) : auditLogs.length === 0 ? (
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Sin historial de cambios</p>
                    ) : (
                      <div className="space-y-3">
                        {auditLogs.map((entry) => (
                          <div key={entry.id} className="flex gap-3">
                            <div className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 ml-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{entry.action}</span>
                                {entry.user_name && (
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500">— {entry.user_name}</span>
                                )}
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                                  {formatDate(entry.created_at)}
                                </span>
                              </div>
                              {entry.details && (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{entry.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Correction Actions (only if not already corrected) */}
                  {log.status !== 'corrected' && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                        Acciones de Corrección
                      </h3>

                      {!showCorrectionForm ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => {
                              setCorrectionAction('corrected');
                              setShowCorrectionForm(true);
                            }}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                          >
                            Marcar como Corregido
                          </button>
                          <button
                            onClick={() => {
                              setCorrectionAction('discard');
                              setShowCorrectionForm(true);
                            }}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            Descartar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                            Accion: <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {correctionAction === 'corrected' ? 'Marcar como Corregido' : 'Descartar'}
                            </span>
                          </div>
                          <div>
                            <label 
                              htmlFor="justification"
                              className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                              Justificación <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              id="justification"
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              placeholder="Justificación de la corrección..."
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Mínimo 5 caracteres</p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleCorrection}
                              disabled={isSubmitting}
                              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                              {isSubmitting ? 'Guardando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => {
                                setShowCorrectionForm(false);
                                setJustification('');
                              }}
                              disabled={isSubmitting}
                              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Section 4: Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ClockLogDetailModal;
