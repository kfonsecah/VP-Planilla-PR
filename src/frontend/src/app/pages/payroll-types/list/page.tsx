"use client";

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
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
  const handleSubmit = async (values: Partial<PayrollType>) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Tipo de planilla actualizado correctamente');
      } else {
        await create({ name: values.name!, description: values.description! });
        modal.showSuccess('Creado', 'Tipo de planilla creado correctamente');
      }
      refetch();
      setFormOpen(false);
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  /**
   * Confirma y ejecuta la eliminación
   */
  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove();
      modal.showSuccess('Eliminado', 'Tipo de planilla eliminado correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar. Esta funcionalidad aún no está disponible.');
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
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header con rectángulo verde */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#E7DCC1] dark:text-gray-300 uppercase tracking-widest mb-2">
                Gestión de Planillas
              </p>
              <h1 className="text-3xl font-bold text-white leading-none">Tipos de Planilla</h1>
              <p className="text-sm text-white/80 mt-2">
                Gestiona los diferentes tipos de planilla del sistema
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => refetch()} 
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50 border border-white/30"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                Recargar
              </button>
              <button 
                onClick={openCreate} 
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#3B4D36] text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Nuevo Tipo
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-gray-700 mb-6" />

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg shadow-sm">
            <p className="text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-lg text-[#5D4E37] dark:text-gray-300 font-medium">Cargando tipos de planilla...</p>
          </div>
        )}

        {/* Lista de tipos de planilla en tarjetas */}
        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {data.map((payrollType) => (
              <div
                key={payrollType.id}
                className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Header de la tarjeta */}
                <div className="bg-[#EDE5D2] dark:bg-gray-700 px-5 py-4 border-b border-[#D2B48C] dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#6F7153] rounded-xl flex items-center justify-center shadow-sm">
                        <DocumentTextIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#3B4D36] dark:text-white">
                          {payrollType.name}
                        </h3>
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium">{payrollType.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5">
                  {/* Fecha de creación */}
                  {payrollType.created_at && (
                    <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Fecha de Creación</p>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#6F7153]" />
                        <span className="text-sm font-semibold text-[#3B4D36] dark:text-white">{formatDate(payrollType.created_at)}</span>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(payrollType)}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F7153] hover:bg-[#5D614A] text-white rounded-lg transition-colors font-semibold shadow-sm text-sm"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDelete(payrollType)}
                      className="flex items-center justify-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-[#E7DCC1] dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-10 h-10 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white mb-2">
              No hay tipos de planilla registrados
            </h3>
            <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mb-6 max-w-md mx-auto">
              Crea tu primer tipo de planilla para comenzar a gestionar los diferentes períodos de pago
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6F7153] hover:bg-[#5D614A] text-white rounded-lg transition-colors font-semibold shadow-sm"
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
        {(methods: UseFormReturn<Partial<PayrollType>>) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input 
                {...methods.register('name', { required: 'El nombre es requerido' })} 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                placeholder="Ej: Quincenal, Mensual, Semanal"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea 
                {...methods.register('description', { required: 'La descripción es requerida' })} 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
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

      <modal.ModalComponent />
    </div>
  );
}
