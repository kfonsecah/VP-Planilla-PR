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
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1]">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DocumentTextIcon className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Tipos de Planilla</h1>
                <p className="text-[#E7DCC1]">
                  Gestiona los diferentes tipos de planilla del sistema
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
                Nuevo Tipo
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-lg text-[#5D4E37] font-medium">Cargando tipos de planilla...</p>
          </div>
        )}

        {/* Lista de tipos de planilla en tarjetas */}
        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map((payrollType) => (
              <div
                key={payrollType.id}
                className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-[#E7DCC1] to-[#F9F1DC] px-6 py-4 border-b border-[#E0D6B7]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#6F7153] rounded-xl flex items-center justify-center shadow-md">
                      <DocumentTextIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#3B4D36]">
                        {payrollType.name}
                      </h3>
                      <p className="text-xs text-[#6B5B3D]">ID: {payrollType.id}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Descripción */}
                  <div className="mb-4">
                    <p className="text-sm text-[#5D4E37] leading-relaxed">
                      {payrollType.description || 'Sin descripción'}
                    </p>
                  </div>

                  {/* Fecha de creación */}
                  {payrollType.created_at && (
                    <div className="flex items-center gap-2 text-xs text-[#6B5B3D] mb-4 bg-[#F9F1DC] rounded-lg px-3 py-2">
                      <CalendarIcon className="w-4 h-4 text-[#6F7153]" />
                      <span>Creado: {formatDate(payrollType.created_at)}</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t border-[#E0D6B7]">
                    <button
                      onClick={() => openEdit(payrollType)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-md"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => openDelete(payrollType)}
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

        {/* Estado vacío */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] mb-3">
              No hay tipos de planilla registrados
            </h3>
            <p className="text-base text-[#6B5B3D] mb-8 max-w-md mx-auto">
              Crea tu primer tipo de planilla para comenzar a gestionar los diferentes períodos de pago
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <PlusCircleIcon className="w-6 h-6" />
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

      <modal.ModalComponent />
    </div>
  );
}
