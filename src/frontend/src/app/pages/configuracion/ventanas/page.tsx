'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusIcon, PencilSquareIcon, TrashIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { timeWindowService, TimeWindow } from '@/services/timeWindowService';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const timeWindowSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['IN', 'OUT'] as const),
  startHour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Debe usar formato HH:MM (ej. 08:00)'),
  endHour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Debe usar formato HH:MM (ej. 17:00)'),
}).refine((data) => {
  // Opcional: Validar que inicio sea menor que fin si se asume que no cruza la medianoche
  // Pero en algunos casos sí cruza, por lo que lo dejamos libre o validamos si es necesario.
  return true;
}, { message: "Rango de horas inválido", path: ["endHour"] });

type TimeWindowFormValues = z.infer<typeof timeWindowSchema>;

export default function ConfiguracionPage() {
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<TimeWindow | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [windowToDelete, setWindowToDelete] = useState<TimeWindow | null>(null);

  const fetchWindows = async () => {
    setIsLoading(true);
    try {
      const data = await timeWindowService.getAll();
      setWindows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las ventanas de tiempo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWindows();
  }, []);

  const openAddModal = () => {
    setEditingWindow(null);
    setIsFormOpen(true);
  };

  const openEditModal = (w: TimeWindow) => {
    setEditingWindow(w);
    setIsFormOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingWindow) {
        await timeWindowService.update(editingWindow.time_window_id, {
          name: data.name,
          type: data.type,
          startHour: data.startHour,
          endHour: data.endHour
        });
      } else {
        await timeWindowService.create({
          companyId: 1, // Default por contexto de la app
          name: data.name,
          type: data.type,
          startHour: data.startHour,
          endHour: data.endHour
        });
      }
      setIsFormOpen(false);
      fetchWindows();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la ventana de tiempo');
    }
  };

  const handleDelete = async () => {
    if (!windowToDelete) return;
    try {
      await timeWindowService.delete(windowToDelete.time_window_id);
      setIsConfirmDeleteOpen(false);
      setWindowToDelete(null);
      fetchWindows();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la ventana de tiempo');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/pages/configuracion" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mb-4">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver a Configuración
        </Link>
        <div className="mb-6 flex justify-between items-end">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Configuración</p>
            <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Ventanas de Tiempo</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Configure los rangos horarios para la inferencia automática de entradas y salidas.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Ventana
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Listado */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
            </div>
          ) : windows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">No hay ventanas de tiempo configuradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Desde</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hasta</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {windows.map((w) => (
                    <tr key={w.time_window_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">{w.time_window_name}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${w.time_window_type === 'IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {w.time_window_type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{w.time_window_start_hour.substring(0, 5)}</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{w.time_window_end_hour.substring(0, 5)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(w)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setWindowToDelete(w);
                              setIsConfirmDeleteOpen(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <FormModal<TimeWindowFormValues>
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingWindow ? 'Editar Ventana de Tiempo' : 'Nueva Ventana de Tiempo'}
        resolver={zodResolver(timeWindowSchema) as any}
        initialValues={editingWindow ? {
          name: editingWindow.time_window_name,
          type: editingWindow.time_window_type as 'IN' | 'OUT',
          startHour: editingWindow.time_window_start_hour.substring(0, 5),
          endHour: editingWindow.time_window_end_hour.substring(0, 5)
        } : { type: 'IN', name: '', startHour: '', endHour: '' }}
        onSubmit={onSubmit}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="Ej. Entrada Mañana"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name?.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo de Marca</label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="IN">Entrada (IN)</option>
                <option value="OUT">Salida (OUT)</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type?.message?.toString()}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  {...register('startHour')}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {errors.startHour && <p className="text-red-500 text-xs mt-1">{errors.startHour?.message?.toString()}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hora Fin</label>
                <input
                  type="time"
                  {...register('endHour')}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {errors.endHour && <p className="text-red-500 text-xs mt-1">{errors.endHour?.message?.toString()}</p>}
              </div>
            </div>
          </div>
        )}
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Eliminar Ventana de Tiempo"
        description={`¿Está seguro que desea eliminar la ventana "${windowToDelete?.time_window_name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
}
