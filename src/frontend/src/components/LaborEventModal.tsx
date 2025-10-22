'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LaborEventFormData) => Promise<void>;
  event?: EmployeeLaborEvent;
  employees: Employee[];
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  initialDates?: { start?: Date; end?: Date } | null;
}

const laborEventSchema = z.object({
  name: z.string().min(1, 'El nombre del evento es requerido'),
  description: z.string().optional(),
  employee_id: z.number().min(1, 'Debe seleccionar un empleado'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
});

type FormData = z.infer<typeof laborEventSchema>;

const pad = (n: number) => n.toString().padStart(2, '0');
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const LaborEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  employees,
  onPreviewChange,
  initialDates
}) => {
  const [isCompact, setIsCompact] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(laborEventSchema),
    defaultValues: {
      name: '',
      description: '',
      employee_id: 0,
      start_date: toLocalInput(new Date()),
      end_date: '',
      status: 'active'
    }
  });

  // Watch form values for preview
  const watchedValues = watch();

  // Handle drag start
  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragControls.start(event.nativeEvent);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      const startIsoLocal = event.start_date ? toLocalInput(new Date(event.start_date)) : toLocalInput(new Date());
      const endIsoLocal = event.end_date ? toLocalInput(new Date(event.end_date)) : '';
      
      reset({
        name: (event as any).labor_event_name || '',
        description: (event as any).labor_event_description || '',
        employee_id: event.employee_id || 0,
        start_date: startIsoLocal,
        end_date: endIsoLocal,
        status: event.status || 'active'
      });
      return;
    }

    if (initialDates && initialDates.start) {
      const startLocal = toLocalInput(initialDates.start);
      const endLocal = initialDates.end ? toLocalInput(initialDates.end) : '';
      
      reset({
        name: '',
        description: '',
        employee_id: 0,
        start_date: startLocal,
        end_date: endLocal,
        status: 'active'
      });
      
      onPreviewChange?.({ 
        labor_event_name: '', 
        employee_id: undefined, 
        start_date: startLocal, 
        end_date: endLocal 
      });
      return;
    }

    const defaultStart = toLocalInput(new Date());
    reset({
      name: '',
      description: '',
      employee_id: 0,
      start_date: defaultStart,
      end_date: '',
      status: 'active'
    });
    
    onPreviewChange?.({ 
      labor_event_name: '', 
      employee_id: undefined, 
      start_date: defaultStart, 
      end_date: undefined 
    });
  }, [isOpen, event, initialDates, reset, onPreviewChange]);

  // Update preview when form values change (only when creating new event)
  useEffect(() => {
    if (!event && isOpen && onPreviewChange) {
      onPreviewChange({
        labor_event_name: watchedValues.name || '',
        employee_id: watchedValues.employee_id || undefined,
        start_date: watchedValues.start_date || undefined,
        end_date: watchedValues.end_date || undefined,
      });
    }
  }, [watchedValues.name, watchedValues.employee_id, watchedValues.start_date, watchedValues.end_date, event, isOpen]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const payload: LaborEventFormData = {
        name: data.name,
        description: data.description,
        employee_id: data.employee_id,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        status: data.status
      };

      // If editing an existing event, include the event ID and labor_event_id
      if (event) {
        (payload as any).id = event.id;
        (payload as any).labor_event_id = event.labor_event_id;
      }

      await onSubmit(payload);
      onPreviewChange?.(null);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Don't close the modal if there's an error, let the parent handle it
    }
  };

  const handleClose = () => {
    onPreviewChange?.(null);
    onClose();
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      y: 50,
      rotateX: -15
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
        duration: 0.6
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: 50,
      rotateX: 15,
      transition: {
        duration: 0.3
      }
    }
  };

  const compactVariants = {
    expanded: {
      height: 'auto' as const,
      transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] as const }
    },
    compact: {
      height: '80px',
      transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] as const }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop without blur to keep background visible */}
          <motion.div 
            className="fixed inset-0 bg-black/30 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            onClick={handleClose}
          />
          
          {/* Draggable Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              className="pointer-events-auto w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag
              dragControls={dragControls}
              dragMomentum={false}
              dragElastic={0.1}
              dragConstraints={{
                left: -window.innerWidth / 2 + 200,
                right: window.innerWidth / 2 - 200,
                top: -window.innerHeight / 2 + 100,
                bottom: window.innerHeight / 2 - 100
              }}
              whileDrag={{ scale: 1.02 }}
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
            >
                <motion.div 
                  className="bg-white rounded-xl shadow-2xl border border-[#E0D6B7] overflow-hidden"
                  variants={compactVariants}
                  animate={isCompact ? "compact" : "expanded"}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Handle Header */}
                  <div
                    className="bg-[#6F7153] px-6 py-4 flex items-center justify-between cursor-move select-none"
                    role="banner"
                    tabIndex={0}
                    onPointerDown={handleDragStart}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setIsCompact(!isCompact);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag indicator */}
                      <div className="flex flex-col gap-1">
                        <div className="w-4 h-0.5 bg-white/60 rounded"></div>
                        <div className="w-4 h-0.5 bg-white/60 rounded"></div>
                        <div className="w-4 h-0.5 bg-white/60 rounded"></div>
                      </div>
                      <h2 className="text-xl font-semibold text-white">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Compact/Expand Toggle */}
                      <button
                        onClick={() => setIsCompact(!isCompact)}
                        className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                        title={isCompact ? "Expandir" : "Compactar"}
                        aria-label={isCompact ? "Expandir modal" : "Compactar modal"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isCompact ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12l-1.41-1.41L16 13.17V4h-2v9.17l-2.59-2.58L10 12l6 6 6-6z" />
                          )}
                        </svg>
                      </button>
                      
                      {/* Close Button */}
                      <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                        title="Cerrar"
                        aria-label="Cerrar modal"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Form Content - Hidden when compact */}
                  {!isCompact && (
                    <motion.div 
                      className="max-h-[70vh] overflow-y-auto p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                            Nombre del Evento
                          </label>
                          <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                                placeholder="Ingrese el nombre del evento"
                                aria-describedby={errors.name ? "name-error" : undefined}
                              />
                            )}
                          />
                          {errors.name && (
                            <p id="name-error" className="mt-1 text-sm text-red-600 animate-pulse" role="alert">
                              {errors.name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                            Descripción
                          </label>
                          <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                              <textarea
                                {...field}
                                className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all resize-none"
                                rows={3}
                                placeholder="Descripción opcional del evento"
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                            Empleado
                          </label>
                          <Controller
                            name="employee_id"
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                                aria-describedby={errors.employee_id ? "employee-error" : undefined}
                              >
                                <option value={0}>Seleccionar empleado</option>
                                {employees.map(employee => (
                                  <option key={employee.id} value={employee.id}>
                                    {employee.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {errors.employee_id && (
                            <p id="employee-error" className="mt-1 text-sm text-red-600 animate-pulse" role="alert">
                              {errors.employee_id.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                              Fecha Inicio
                            </label>
                            <Controller
                              name="start_date"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="datetime-local"
                                  className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                                  aria-describedby={errors.start_date ? "start-date-error" : undefined}
                                />
                              )}
                            />
                            {errors.start_date && (
                              <p id="start-date-error" className="mt-1 text-sm text-red-600 animate-pulse" role="alert">
                                {errors.start_date.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                              Fecha Fin
                            </label>
                            <Controller
                              name="end_date"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="datetime-local"
                                  className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                            Estado
                          </label>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="w-full rounded-lg border border-[#D2B48C] p-3 focus:ring-2 focus:ring-[#6F7153] focus:border-transparent transition-all"
                              >
                                <option value="active">Activo</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                            )}
                          />
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Footer with buttons - Hidden when compact */}
                  {!isCompact && (
                    <motion.div 
                      className="border-t border-[#E0D6B7] p-6 bg-[#F5F1E8] rounded-b-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 px-4 py-3 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-all duration-200 font-medium"
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          onClick={handleSubmit(onFormSubmit)}
                          className="flex-1 px-4 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Guardando...
                            </div>
                          ) : (
                            event ? 'Guardar Cambios' : 'Crear Evento'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LaborEventModal;