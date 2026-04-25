'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';
import { Select, SelectItem } from '@/components/ui/Select';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LaborEventFormData) => Promise<void>;
  event?: EmployeeLaborEvent;
  employees: Employee[];
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  initialDates?: { start?: Date; end?: Date } | null;
}

// Tipos de evento laboral con emoji y color
const EVENT_TYPES = [
  { value: 'Vacaciones', emoji: '🏖️', color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
  { value: 'Incapacidad', emoji: '🏥', color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
  { value: 'Permiso', emoji: '📋', color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
  { value: 'Día Libre', emoji: '🆓', color: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' },
  { value: 'Suspensión', emoji: '⛔', color: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
  { value: 'Otro', emoji: '📁', color: 'border-zinc-500 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' },
] as const;

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

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Activo', dotColor: 'bg-green-500' },
  { value: 'completed' as const, label: 'Completado', dotColor: 'bg-blue-500' },
  { value: 'cancelled' as const, label: 'Cancelado', dotColor: 'bg-red-500' },
];

const LaborEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  employees,
  onPreviewChange,
  initialDates
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  const watchedValues = watch();

  // Escape key close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus first input
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }, [isOpen]);

  // Reset form on open
  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      const startIsoLocal = event.start_date ? toLocalInput(new Date(event.start_date)) : toLocalInput(new Date());
      const endIsoLocal = event.end_date ? toLocalInput(new Date(event.end_date)) : '';
      reset({
        name: event.labor_event_name || '',
        description: event.labor_event_description || '',
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
      reset({ name: '', description: '', employee_id: 0, start_date: startLocal, end_date: endLocal, status: 'active' });
      onPreviewChange?.({ labor_event_name: '', employee_id: undefined, start_date: startLocal, end_date: endLocal });
      return;
    }

    const defaultStart = toLocalInput(new Date());
    reset({ name: '', description: '', employee_id: 0, start_date: defaultStart, end_date: '', status: 'active' });
    onPreviewChange?.({ labor_event_name: '', employee_id: undefined, start_date: defaultStart, end_date: undefined });
  }, [isOpen, event, initialDates, reset, onPreviewChange]);

  // Update preview on form change
  useEffect(() => {
    if (!event && isOpen && onPreviewChange) {
      onPreviewChange({
        labor_event_name: watchedValues.name || '',
        employee_id: watchedValues.employee_id || undefined,
        start_date: watchedValues.start_date || undefined,
        end_date: watchedValues.end_date || undefined,
      });
    }
  }, [watchedValues.name, watchedValues.employee_id, watchedValues.start_date, watchedValues.end_date, event, isOpen, onPreviewChange]);

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

      if (event) {
        Object.assign(payload, { id: event.id, labor_event_id: event.labor_event_id });
      }

      await onSubmit(payload);
      onPreviewChange?.(null);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    onPreviewChange?.(null);
    onClose();
  };

  // Seleccionar tipo de evento → set name
  const handleEventTypeSelect = (typeName: string) => {
    setValue('name', typeName, { shouldValidate: true });
  };

  // Encontrar qué tipo de evento está activo
  const selectedEventType = EVENT_TYPES.find(t => watchedValues.name === t.value);

  const inputClasses = 'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all';
  const labelClasses = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />
          
          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <MotionDiv
              ref={modalRef}
              className="pointer-events-auto w-full max-w-lg"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, duration: 0.3 }}
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 dark:bg-green-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-lg">{selectedEventType?.emoji || '📅'}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {event ? 'Editar Evento Laboral' : 'Crear Evento Laboral'}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label="Cerrar modal"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Form content */}
                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                    
                    {/* Event Type selector — visual card grid */}
                    <div>
                      <label className={labelClasses}>Tipo de Evento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {EVENT_TYPES.map(type => {
                          const isSelected = watchedValues.name === type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => handleEventTypeSelect(type.value)}
                              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                                isSelected
                                  ? `border-green-500 ${type.color} ring-1 ring-green-500/30`
                                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              <span className="text-lg">{type.emoji}</span>
                              <span>{type.value}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Hidden name input for custom names */}
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className={`${inputClasses} mt-2`}
                            placeholder="O escriba un nombre personalizado..."
                          />
                        )}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Employee selector */}
                    <div>
                      <label className={labelClasses}>Empleado</label>
                      <Controller
                        name="employee_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(value) => field.onChange(Number(value))}
                            placeholder="Seleccionar empleado"
                            className="border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                          >
                            {employees.map(employee => (
                              <SelectItem key={employee.id} value={String(employee.id)}>
                                {employee.name}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.employee_id && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.employee_id.message}</p>
                      )}
                    </div>

                    {/* Dates — side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClasses}>Fecha Inicio</label>
                        <Controller
                          name="start_date"
                          control={control}
                          render={({ field }) => (
                            <input {...field} type="datetime-local" className={inputClasses} />
                          )}
                        />
                        {errors.start_date && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.start_date.message}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelClasses}>Fecha Fin</label>
                        <Controller
                          name="end_date"
                          control={control}
                          render={({ field }) => (
                            <input {...field} type="datetime-local" className={inputClasses} />
                          )}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className={labelClasses}>Descripción <span className="text-zinc-400 font-normal">(opcional)</span></label>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            className={`${inputClasses} resize-none`}
                            rows={2}
                            placeholder="Descripción del evento..."
                          />
                        )}
                      />
                    </div>

                    {/* Status — radio buttons */}
                    <div>
                      <label className={labelClasses}>Estado</label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <div className="flex gap-3">
                            {STATUS_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  field.value === opt.value
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-1 ring-green-500/30'
                                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                }`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/50">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit(onFormSubmit)}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        {event ? 'Actualizar Evento' : 'Guardar Evento'}
                      </>
                    )}
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

export default LaborEventModal;
