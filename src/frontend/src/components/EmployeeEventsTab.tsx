'use client';

import React, { useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEmployeeEvents } from '@/hooks/useEmployeeEvents';
import { LaborEventsService } from '@/services/laborEventsService';
import { LaborEvent, EmployeeLaborEvent, LaborEventFormData } from '@/types/laborEvent';
import { Employee } from '@/types/employee';
import { formatDateDisplay } from '@/utils/formatters';
import { toast } from 'sonner';
import LaborEventModal from '@/components/LaborEventModal';

interface Props {
  employeeId: string | number;
  currentEmployee: { id: string | number; name: string } & Omit<Partial<Employee>, 'id'>;
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  active: {
    className:
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: 'Activo',
  },
  completed: {
    className:
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    label: 'Completado',
  },
  cancelled: {
    className:
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    label: 'Cancelado',
  },
};

const EmployeeEventsTab: React.FC<Props> = ({ employeeId, currentEmployee }) => {
  const { data, isLoading, error, refresh, deleteAssignment, assignEvent } = useEmployeeEvents(employeeId);
  const [catalog, setCatalog] = useState<LaborEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load the catalog once on mount
  useEffect(() => {
    let cancelled = false;
    LaborEventsService.getAllLaborEvents()
      .then((res) => { if (!cancelled) setCatalog(res.laborEvents); })
      .catch(() => { /* the events list itself surfaces errors; the catalog is best-effort */ });
    return () => { cancelled = true; };
  }, []);

  const handleAssignSubmit = async (form: LaborEventFormData) => {
    try {
      await assignEvent({
        labor_event_id: Number(form.labor_event_id),
        start_date: typeof form.start_date === 'string' ? form.start_date : new Date(form.start_date as Date).toISOString(),
        end_date: form.end_date ? (typeof form.end_date === 'string' ? form.end_date : new Date(form.end_date as Date).toISOString()) : null,
        status: form.status ?? 'active',
      });
      toast.success('Evento asignado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo asignar el evento');
      throw err;
    }
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm('¿Eliminar la asignación de este evento para este empleado?')) return;
    try {
      await deleteAssignment(assignmentId);
      toast.success('Evento eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el evento');
    }
  };

  // Adapt currentEmployee to the Employee shape the modal expects
  const modalEmployees: Employee[] = [
    {
      ...(currentEmployee as Employee),
      id: currentEmployee.id,
      name: currentEmployee.name,
    } as Employee,
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Eventos Laborales
          </h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Asignar Evento
        </button>
      </div>

      {isLoading && (
        <div className="p-5 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">No se pudo cargar los eventos</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-3">{error} — Intenta de nuevo.</p>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <CalendarDaysIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Sin eventos laborales</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-3">
            Este empleado no tiene eventos laborales asignados.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Asignar Evento
          </button>
        </div>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fin</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.map((ev: EmployeeLaborEvent) => {
                const badge = STATUS_BADGE[ev.status] ?? STATUS_BADGE.active;
                return (
                  <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{ev.labor_event_name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{formatDateDisplay(ev.start_date)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">{ev.end_date ? formatDateDisplay(ev.end_date) : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={badge.className}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mx-auto"
                        aria-label="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LaborEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAssignSubmit}
        employees={modalEmployees}
        laborEventCatalog={catalog}
      />
    </div>
  );
};

export default EmployeeEventsTab;
