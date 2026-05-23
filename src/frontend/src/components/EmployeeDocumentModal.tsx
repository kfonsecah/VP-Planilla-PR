'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { documentSchema, DocumentFormData } from '@/schemas/employeeDocumentSchema';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentFormData) => Promise<void>;
}

const inputClasses =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all';
const labelClasses = 'block text-sm font-normal text-zinc-700 dark:text-zinc-300 mb-1.5';

const EmployeeDocumentModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: { file_path: '', document_type: '' },
  });

  // Escape key close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset + auto-focus on open
  useEffect(() => {
    if (!isOpen) return;
    reset({ file_path: '', document_type: '' });
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (modalRef.current) {
      const first = modalRef.current.querySelector('input') as HTMLInputElement | null;
      if (first) timerId = setTimeout(() => first.focus(), 100);
    }
    return () => clearTimeout(timerId);
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: DocumentFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <MotionDiv
              ref={modalRef}
              className="pointer-events-auto w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, duration: 0.3 }}
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="bg-green-600 dark:bg-green-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Agregar Documento</h2>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label="Cerrar modal"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
                  <div>
                    <label className={labelClasses}>Nombre del documento</label>
                    <Controller
                      name="file_path"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="text" className={inputClasses} placeholder="Ej. Contrato 2026.pdf" />
                      )}
                    />
                    {errors.file_path && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.file_path.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>Tipo de documento</label>
                    <Controller
                      name="document_type"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="text" className={inputClasses} placeholder="Ej. Contrato, Cédula, Certificación" />
                      )}
                    />
                    {errors.document_type && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.document_type.message}</p>
                    )}
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 text-sm font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar documento'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmployeeDocumentModal;
