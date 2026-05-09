'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LaborEvent, LaborEventFormData, LaborEventPayBehavior, EmployeeLaborEvent } from '@/types/laborEvent';
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
  laborEventCatalog: LaborEvent[];
  onPreviewChange?: (preview: Partial<EmployeeLaborEvent> | null) => void;
  initialDates?: { start?: Date; end?: Date } | null;
  onDelete?: (id: number) => Promise<void>;
}

const PAY_BEHAVIOR_BANNER: Record<LaborEventPayBehavior, { icon: string; color: string; message: (ev: LaborEvent) => string }> = {
  FULL_PAY: {
    icon: '✅',
    color: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300',
    message: () => 'Este evento se paga al 100%. El colaborador recibirá su salario completo durante estos días.',
  },
  PARTIAL_PAY: {
    icon: '⚠️',
    color: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
    message: (ev) => {
      const pct = ev.payPercentage ?? 0;
      const days = ev.maxPaidDays;
      if (days) {
        return `Este evento se paga al ${pct}% los primeros ${days} días. Del día ${days + 1} en adelante no genera pago patronal.`;
      }
      return `Este evento se paga al ${pct}% del salario diario. El patrono cubre este porcentaje.`;
    },
  },
  NO_PAY: {
    icon: '❌',
    color: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300',
    message: () => 'Este evento no genera pago. Los días no trabajados serán descontados del salario.',
  },
  EXTERNAL_PAY: {
    icon: 'ℹ️',
    color: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300',
    message: () => 'Este evento es pagado directamente por la CCSS o entidad correspondiente. No genera pago patronal.',
  },
};

const laborEventSchema = z.object({
  labor_event_id: z.number({ error: 'Debe seleccionar un tipo de evento' }).min(1, 'Debe seleccionar un tipo de evento'),
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
  laborEventCatalog,
  onPreviewChange,
  initialDates,
  onDelete,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(laborEventSchema),
    defaultValues: {
      labor_event_id: 0,
      employee_id: 0,
      start_date: toLocalInput(new Date()),
      end_date: '',
      status: 'active',
    }
  });

  const watchedValues = watch();

  const selectedCatalogEvent = useMemo(
    () => laborEventCatalog.find(c => c.id === watchedValues.labor_event_id) ?? null,
    [laborEventCatalog, watchedValues.labor_event_id]
  );

  // Escape key close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const first = modalRef.current.querySelector('input, select, textarea, button[data-autofocus]') as HTMLElement;
      if (first) setTimeout(() => first.focus(), 100);
    }
  }, [isOpen]);

  // Reset form on open
  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      const startIsoLocal = event.start_date ? toLocalInput(new Date(event.start_date)) : toLocalInput(new Date());
      const endIsoLocal = event.end_date ? toLocalInput(new Date(event.end_date)) : '';
      reset({
        labor_event_id: event.labor_event_id || 0,
        employee_id: event.employee_id || 0,
        start_date: startIsoLocal,
        end_date: endIsoLocal,
        status: event.status || 'active',
      });
      return;
    }

    if (initialDates?.start) {
      reset({
        labor_event_id: 0,
        employee_id: 0,
        start_date: toLocalInput(initialDates.start),
        end_date: initialDates.end ? toLocalInput(initialDates.end) : '',
        status: 'active',
      });
      return;
    }

    reset({ labor_event_id: 0, employee_id: 0, start_date: toLocalInput(new Date()), end_date: '', status: 'active' });
  }, [isOpen, event, initialDates, reset]);

  // Update calendar preview
  useEffect(() => {
    if (!event && isOpen && onPreviewChange) {
      onPreviewChange({
        labor_event_name: selectedCatalogEvent?.name || '',
        employee_id: watchedValues.employee_id || undefined,
        start_date: watchedValues.start_date || undefined,
        end_date: watchedValues.end_date || undefined,
      });
    }
  }, [selectedCatalogEvent, watchedValues.employee_id, watchedValues.start_date, watchedValues.end_date, event, isOpen, onPreviewChange]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const payload: LaborEventFormData = {
        labor_event_id: data.labor_event_id,
        name: selectedCatalogEvent?.name,
        description: selectedCatalogEvent?.description,
        employee_id: data.employee_id,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        status: data.status,
      };

      if (event) {
        Object.assign(payload, { id: event.id });
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

  const inputClasses = 'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all';
  const labelClasses = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5';

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      try {
        await onDelete(event.id);
        onClose();
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

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
                      <span className="text-lg">📅</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {event ? 'Editar Evento Laboral' : 'Registrar Evento Laboral'}
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

                    {/* Catalog event type selector */}
                    <div>
                      <label className={labelClasses}>Tipo de evento</label>
                      <Controller
                        name="labor_event_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(v) => field.onChange(Number(v))}
                            placeholder={laborEventCatalog.length === 0 ? 'Cargando catálogo…' : 'Seleccionar tipo de evento'}
                          >
                            {laborEventCatalog.map(ev => (
                              <SelectItem key={ev.id} value={String(ev.id)}>
                                {ev.name}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.labor_event_id && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.labor_event_id.message}</p>
                      )}
                    </div>

                    {/* Pay behavior banner */}
                    {selectedCatalogEvent && (() => {
                      const banner = PAY_BEHAVIOR_BANNER[selectedCatalogEvent.payBehavior];
                      return (
                        <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${banner.color}`}>
                          <span className="mt-0.5 shrink-0">{banner.icon}</span>
                          <p>{banner.message(selectedCatalogEvent)}</p>
                        </div>
                      );
                    })()}

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

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClasses}>Fecha inicio</label>
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
                        <label className={labelClasses}>Fecha fin <span className="text-zinc-400 font-normal">(opcional)</span></label>
                        <Controller
                          name="end_date"
                          control={control}
                          render={({ field }) => (
                            <input {...field} type="datetime-local" className={inputClasses} />
                          )}
                        />
                      </div>
                    </div>

                    {/* Status */}
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
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    {event && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        disabled={isSubmitting}
                      >
                        Eliminar Evento
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
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
                        event ? 'Actualizar evento' : 'Guardar evento'
                      )}
                    </button>
                  </div>
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
