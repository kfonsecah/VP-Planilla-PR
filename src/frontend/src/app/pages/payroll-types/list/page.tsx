"use client";

import React, { useState } from 'react';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePayrollTypes } from '@/hooks/usePayrollTypes';
import { PayrollType } from '@/types/payrollTypes';
import { useModal } from '@/hooks/useModal';
import { 
  DocumentTextIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

/**
 * Página de gestión de tipos de planilla
 * Permite crear, editar y visualizar tipos de planilla (quincenal, mensual, etc.)
 */
export default function PayrollTypesPage() {
  const { data, isLoading, error, refetch, create, update, remove } = usePayrollTypes();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PayrollType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PayrollType | null>(null);

  /**
   * Abre el modal para crear un nuevo tipo de planilla
   */
  const openCreate = () => { 
    setEditing(null); 
    setFormOpen(true); 
  };

  /**
   * Abre el modal para editar un tipo de planilla existente
   */
  const openEdit = (p: PayrollType) => { 
    setEditing(p); 
    setFormOpen(true); 
  };

  /**
   * Abre el diálogo de confirmación para eliminar
   */
  const openDelete = (p: PayrollType) => { 
    setToDelete(p); 
    setConfirmOpen(true); 
  };

  /**
   * Maneja el envío del formulario (crear o actualizar)
   */
  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Tipo de planilla actualizado correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Tipo de planilla creado correctamente');
      }
      refetch();
      setFormOpen(false);
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  /**
   * Confirma y ejecuta la eliminación
   */
  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Tipo de planilla eliminado correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar. Esta funcionalidad aún no está disponible.');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  // Definición de columnas para la tabla
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#3B4D36]">Tipos de Planilla</h2>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Gestiona los diferentes tipos de planilla del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => refetch()} 
              className="flex items-center gap-2 px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Cargando...' : 'Recargar'}
            </button>
            <button 
              onClick={openCreate} 
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nuevo Tipo
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37]">Cargando tipos de planilla...</p>
          </div>
        )}

        {/* Lista de tipos de planilla en tarjetas */}
        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((payrollType) => (
              <div
                key={payrollType.id}
                className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5 hover:shadow-md transition-shadow"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#6F7153] rounded-lg">
                      <DocumentTextIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#3B4D36]">
                        {payrollType.name}
                      </h3>
                      <p className="text-xs text-[#6B5B3D]">ID: {payrollType.id}</p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <p className="text-sm text-[#5D4E37] line-clamp-3">
                    {payrollType.description || 'Sin descripción'}
                  </p>
                </div>

                {/* Fecha de creación */}
                {payrollType.created_at && (
                  <div className="flex items-center gap-2 text-xs text-[#6B5B3D] mb-4">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Creado: {formatDate(payrollType.created_at)}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t border-[#E0D6B7]">
                  <button
                    onClick={() => openEdit(payrollType)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => openDelete(payrollType)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#E7DCC1] rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#3B4D36] mb-2">
              No hay tipos de planilla registrados
            </h3>
            <p className="text-sm text-[#6B5B3D] mb-6">
              Crea tu primer tipo de planilla para comenzar
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Crear Primer Tipo
            </button>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      <FormModal 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={editing ? 'Editar Tipo de Planilla' : 'Nuevo Tipo de Planilla'} 
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
                placeholder="Ej: Quincenal, Mensual, Semanal"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea 
                {...methods.register('description', { required: 'La descripción es requerida' })} 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                rows={3}
                placeholder="Descripción del tipo de planilla..."
              />
              {methods.formState.errors?.description && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Campo oculto para version (control optimista) */}
            {editing && (
              <input type="hidden" {...methods.register('version')} />
            )}
          </div>
        )}
      </FormModal>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog 
        open={confirmOpen} 
        title="Eliminar tipo de planilla" 
        description={`¿Está seguro que desea eliminar el tipo de planilla "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
      />
    </div>
  );
}
