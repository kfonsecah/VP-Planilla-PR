'use client';

import { useState, useEffect } from 'react';
import { holidaysService } from '@/services/holidaysService';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PlusIcon, PencilSquareIcon, TrashIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

export default function FeriadosPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<any | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysService.getAll();
      setHolidays(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingHoliday(null);
    setIsFormOpen(true);
  };

  const openEditModal = (h: any) => {
    setEditingHoliday(h);
    setIsFormOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        company_holidays_name: data.name,
        company_holidays_date: data.date,
        company_holidays_is_mandatory: data.is_mandatory_pay,
        company_holidays_is_triple: data.allow_triple_overtime,
        company_holidays_status: data.status
      };
      
      if (editingHoliday) {
        await holidaysService.update(editingHoliday.company_holidays_id, payload);
      } else {
        await holidaysService.create(payload);
      }
      setIsFormOpen(false);
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || 'Error saving holiday');
    }
  };

  const handleDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    try {
      await holidaysService.delete(holidayToDelete.company_holidays_id);
      setIsConfirmDeleteOpen(false);
      fetchHolidays();
    } catch (err: any) {
      setError(err.message || 'Failed to delete holiday');
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
            <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Feriados</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Administre los días feriados, reglas de pago y tiempo extra.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Feriado
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Listado */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
            </div>
          ) : holidays.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">No hay feriados configurados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fecha</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pago Obligatorio</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Triple Tiempo</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {holidays.map((h) => (
                    <tr key={h.company_holidays_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">{h.company_holidays_name}</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{new Date(h.company_holidays_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{h.company_holidays_is_mandatory ? 'Sí (2x)' : 'No'}</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{h.company_holidays_is_triple ? 'Sí (3x)' : 'No'}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setHolidayToDelete(h);
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

      <FormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingHoliday ? 'Editar Feriado' : 'Nuevo Feriado'}
        initialValues={editingHoliday ? {
          name: editingHoliday.company_holidays_name,
          date: editingHoliday.company_holidays_date.split('T')[0],
          is_mandatory_pay: editingHoliday.company_holidays_is_mandatory,
          allow_triple_overtime: editingHoliday.company_holidays_is_triple,
          status: editingHoliday.company_holidays_status
        } : { is_mandatory_pay: false, allow_triple_overtime: false, status: 'active' }}
        onSubmit={onSubmit}
      >
        {({ register }) => (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre</label>
              <input
                {...register('name')}
                required
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fecha</label>
              <input
                type="date"
                {...register('date')}
                required
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('is_mandatory_pay')} id="mandatory" />
              <label htmlFor="mandatory" className="text-sm text-zinc-700 dark:text-zinc-300">Pago obligatorio (2x)</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('allow_triple_overtime')} id="triple" />
              <label htmlFor="triple" className="text-sm text-zinc-700 dark:text-zinc-300">Permite triple tiempo extra (3x)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Estado</label>
              <select {...register('status')} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Eliminar Feriado"
        description={`¿Está seguro que desea eliminar el feriado "${holidayToDelete?.company_holidays_name}"?`}
        onConfirm={handleDeleteHoliday}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
}