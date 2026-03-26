"use client";

import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDeductions } from '@/hooks/useDeductions';
import { Deduction } from '@/services/deductionsService';
import { useModal } from '@/hooks/useModal';
import { UseFormReturn } from 'react-hook-form';
import {
  CurrencyDollarIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

export default function DeductionsPage() {
  const { data, isLoading, error, refetch, create, update, remove } = useDeductions();
  const modal = useModal();

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
        modal.showSuccess('Actualizado', 'Deducción actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Deducción creada correctamente');
      }
      refetch();
      setFormOpen(false);
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Deducción eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
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
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CurrencyDollarIcon className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Deducciones</h1>
                <p className="text-[#E7DCC1] dark:text-gray-300">
                  Gestiona todas las deducciones del sistema
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm disabled:opacity-50 border border-white/30"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                Recargar
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#3B4D36] rounded-xl hover:bg-[#E7DCC1] transition-all font-semibold shadow-lg"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Nueva Deducción
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-lg text-[#5D4E37] dark:text-gray-300 font-medium">Cargando deducciones...</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((deduction) => (
              <div
                key={deduction.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-[#E7DCC1] to-[#F9F1DC] dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-[#E0D6B7] dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#6F7153] rounded-xl flex items-center justify-center shadow-md">
                      <CurrencyDollarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white">{deduction.name}</h3>
                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400">ID: {deduction.id}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-[#5D4E37] dark:text-gray-300 leading-relaxed">
                      {deduction.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {deduction.fixed_amount ? (
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3 border border-[#E0D6B7] dark:border-gray-600">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1 font-medium">Monto Fijo</p>
                        <p className="text-sm font-bold text-[#6F7153]">
                          {formatCurrency(deduction.fixed_amount)}
                        </p>
                      </div>
                    ) : null}
                    
                    {deduction.percentage ? (
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3 border border-[#E0D6B7] dark:border-gray-600">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mb-1 font-medium">Porcentaje</p>
                        <p className="text-sm font-bold text-[#6F7153] flex items-center gap-1">
                          <CalculatorIcon className="w-4 h-4" />
                          {deduction.percentage}%
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t border-[#E0D6B7]">
                    <button
                      onClick={() => openEdit(deduction)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-md"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDelete(deduction)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all font-medium shadow-sm"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CurrencyDollarIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] dark:text-white mb-3">
              No hay deducciones registradas
            </h3>
            <p className="text-base text-[#6B5B3D] dark:text-gray-400 mb-8 max-w-md mx-auto">
              Crea tu primera deducción para comenzar a gestionar descuentos en nómina
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <PlusCircleIcon className="w-6 h-6" />
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
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...methods.register('name', { required: 'El nombre es requerido' })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                placeholder="Ej: Seguro Social, Impuesto de Renta"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Descripción
              </label>
              <textarea
                {...methods.register('description')}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                rows={3}
                placeholder="Descripción de la deducción..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                  Monto Fijo
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('fixed_amount', { valueAsNumber: true })}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('percentage', { valueAsNumber: true })}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Nota:</strong> Puedes definir un monto fijo, un porcentaje, o ambos según el tipo de deducción.
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

      <modal.ModalComponent />
    </div>
  );
}
