"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDeductions } from '@/hooks/useDeductions';
import { Deduction } from '@/services/deductionsService';
import { UseFormReturn } from 'react-hook-form';
import {
  CurrencyDollarIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function DeductionsPage() {
  const { data, isLoading, error, refetch, create, update, remove } = useDeductions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deduction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Deduction | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (d: Deduction) => { setEditing(d); setFormOpen(true); };
  const openDelete = (d: Deduction) => { setToDelete(d); setConfirmOpen(true); };

  const handleSubmit = async (values: Partial<Deduction>) => {
    try {
      if (editing) {
        await update(editing.id, values);
        toast.success('Deducción actualizada correctamente');
      } else {
        await create(values);
        toast.success('Deducción creada correctamente');
      }
      refetch();
      setFormOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success('Deducción eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Configuración</p>
            <h1 className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">Deducciones</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Nueva Deducción
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <div className="flex flex-col items-center">
                <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse"
              >
                <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-4" />
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex-1 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                    <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((deduction) => (
              <div
                key={deduction.id}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">{deduction.name}</h3>
                      <p className="text-xs text-zinc-400">ID: {deduction.id}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {deduction.description || 'Sin descripción'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {deduction.fixed_amount ? (
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Monto Fijo</p>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">
                          {formatCurrency(deduction.fixed_amount)}
                        </p>
                      </div>
                    ) : null}
                    
                    {deduction.percentage ? (
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Porcentaje</p>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100 flex items-center gap-1">
                          <CalculatorIcon className="w-4 h-4" />
                          {deduction.percentage}%
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => openEdit(deduction)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDelete(deduction)}
                      className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-10 h-10 text-zinc-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-100 mb-2">
              No hay deducciones registradas
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              Crea tu primera deducción para comenzar a gestionar descuentos en nómina
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Crear Primera Deducción
            </button>
          </div>
        )}
      </div>

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar Deducción' : 'Nueva Deducción'}
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
      >
        {(methods: UseFormReturn<Partial<Deduction>>) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...methods.register('name', { required: 'El nombre es requerido' })}
                className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                placeholder="Ej: Seguro Social, Impuesto de Renta"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
                Descripción
              </label>
              <textarea
                {...methods.register('description')}
                className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                rows={3}
                placeholder="Descripción de la deducción..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
                  Monto Fijo
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('fixed_amount', { valueAsNumber: true })}
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-200">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('percentage', { valueAsNumber: true })}
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Puedes definir un monto fijo, un porcentaje, o ambos según el tipo de deducción.
              </p>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar deducción"
        description={`¿Estás seguro de que deseas eliminar la deducción "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}
