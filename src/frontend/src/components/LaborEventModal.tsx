'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
        status: event.status
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
  }, [isOpen, event, initialDates]); // Removed reset and onPreviewChange

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
  }, [watchedValues.name, watchedValues.employee_id, watchedValues.start_date, watchedValues.end_date, event, isOpen]); // More specific dependencies

  const onFormSubmit = async (data: FormData) => {
    const payload: LaborEventFormData = {
      name: data.name,
      description: data.description,
      employee_id: data.employee_id,
      start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      status: data.status
    };

    await onSubmit(payload);
    onPreviewChange?.(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-6 right-6 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-[#3B4D36]">
          {event ? 'Editar Evento' : 'Nuevo Evento'}
        </h2>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Nombre del Evento
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Descripción
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                  rows={3}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Empleado
            </label>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
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
              <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Inicio
              </label>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                  />
                )}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Fin
              </label>
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Estado
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                >
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => { onPreviewChange?.(null); onClose(); }}
              className="px-4 py-2 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1]"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3B4D36] text-white rounded-lg hover:bg-[#6F7153] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (event ? 'Guardar Cambios' : 'Crear Evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaborEventModal;