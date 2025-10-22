"use client";

import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDeductions } from '@/hooks/useDeductions';
import { Deduction } from '@/services/deductionsService';
import { useModal } from '@/hooks/useModal';
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

  const handleSubmit = async (values: any) => {
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
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Deducción eliminada correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
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
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B4D36]">Deducciones</h1>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Gestiona todas las deducciones del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Cargando...' : 'Recargar'}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nueva Deducción
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37]">Cargando deducciones...</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((deduction) => (
              <div
                key={deduction.id}
                className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#6F7153] rounded-lg">
                      <CurrencyDollarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#3B4D36]">{deduction.name}</h3>
                      <p className="text-xs text-[#6B5B3D]">ID: {deduction.id}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-[#5D4E37] line-clamp-2">
                    {deduction.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {deduction.fixed_amount ? (
                    <div className="bg-white rounded-lg p-3 border border-[#E0D6B7]">
                      <p className="text-xs text-[#6B5B3D] mb-1">Monto Fijo</p>
                      <p className="text-sm font-semibold text-[#6F7153]">
                        {formatCurrency(deduction.fixed_amount)}
                      </p>
                    </div>
                  ) : null}
                  
                  {deduction.percentage ? (
                    <div className="bg-white rounded-lg p-3 border border-[#E0D6B7]">
                      <p className="text-xs text-[#6B5B3D] mb-1">Porcentaje</p>
                      <p className="text-sm font-semibold text-[#6F7153] flex items-center gap-1">
                        <CalculatorIcon className="w-4 h-4" />
                        {deduction.percentage}%
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2 pt-4 border-t border-[#E0D6B7]">
                  <button
                    onClick={() => openEdit(deduction)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => openDelete(deduction)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#E7DCC1] rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-8 h-8 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#3B4D36] mb-2">
              No hay deducciones registradas
            </h3>
            <p className="text-sm text-[#6B5B3D] mb-6">
              Crea tu primera deducción para comenzar
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
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
        {(methods: any) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...methods.register('name', { required: 'El nombre es requerido' })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                placeholder="Ej: Seguro Social, Impuesto de Renta"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                Descripción
              </label>
              <textarea
                {...methods.register('description')}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                rows={3}
                placeholder="Descripción de la deducción..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                  Monto Fijo
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('fixed_amount', { valueAsNumber: true })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                  Porcentaje (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...methods.register('percentage', { valueAsNumber: true })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
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
    </div>
  );
}
