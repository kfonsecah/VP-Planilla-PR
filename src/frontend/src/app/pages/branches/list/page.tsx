"use client";

import React, { useState } from 'react';
import { useBranches } from '@/hooks/useBranches';
import { useModal } from '@/hooks/useModal';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Branch, BranchFormData } from '@/types/branch';
import { UseFormReturn } from 'react-hook-form';
import {
  BuildingOfficeIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

/**
 * Branches Management Page
 * Manages company branches/locations
 */
export default function BranchesPage() {
  const { data: branches, isLoading, error, create, update, remove, refetch } = useBranches();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setFormOpen(true);
  };

  const openDelete = (branch: Branch) => {
    setToDelete(branch);
    setConfirmOpen(true);
  };

  const handleSubmit = async (values: Partial<Branch>) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Sucursal actualizada correctamente');
      } else {
        await create(values as BranchFormData);
        modal.showSuccess('Creada', 'Sucursal creada correctamente');
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
      modal.showSuccess('Eliminada', 'Sucursal eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestión de Sucursales</h1>
                <p className="text-white/80 dark:text-gray-300 mt-1">
                  Administra las sucursales y ubicaciones de la empresa
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 border border-white/20"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Recargar'}
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#3B4D36] rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Nueva Sucursal
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="font-semibold">Error al cargar</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37] dark:text-gray-300 font-medium">Cargando sucursales...</p>
          </div>
        )}

        {/* Branches Grid */}
        {!isLoading && branches && branches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#6F7153] to-[#3B4D36] dark:from-gray-600 dark:to-gray-700 rounded-xl shadow-md">
                      <BuildingOfficeIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white">{branch.name}</h3>
                      <p className="text-xs text-[#6B5B3D] dark:text-gray-400 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-[#6F7153] rounded-full"></span>
                        ID: {branch.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-5 bg-[#F9F1DC] dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-5 h-5 text-[#6F7153] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#3B4D36] dark:text-white font-medium">{branch.location}</span>
                  </div>
                </div>

                {/* Metadata */}
                {branch.created_at && (
                  <div className="mb-5 text-xs text-[#6B5B3D] dark:text-gray-400 bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3">
                    <p className="font-medium">Creada: {formatDate(branch.created_at)}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t-2 border-[#E0D6B7]">
                  <button
                    onClick={() => openEdit(branch)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => openDelete(branch)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all text-sm font-medium border border-red-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!branches || branches.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#F9F1DC] dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-inner">
                <BuildingOfficeIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] dark:text-white mb-3">
              No hay sucursales registradas
            </h3>
            <p className="text-[#6B5B3D] dark:text-gray-400 mb-8 max-w-md mx-auto">
              Crea tu primera sucursal para comenzar a organizar las ubicaciones de tu empresa
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-xl transition-all font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Crear Primera Sucursal
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar Sucursal' : 'Nueva Sucursal'}
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
      >
        {(methods: UseFormReturn<Partial<Branch>>) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Nombre de la Sucursal <span className="text-red-500">*</span>
              </label>
              <input
                {...methods.register('name', { required: 'El nombre es requerido' })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                placeholder="Ej: Sucursal Central, Oficina Sur"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">
                Ubicación <span className="text-red-500">*</span>
              </label>
              <textarea
                {...methods.register('location', { required: 'La ubicación es requerida' })}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] text-[#3B4D36] dark:text-white"
                rows={3}
                placeholder="Dirección completa de la sucursal..."
              />
              {methods.formState.errors?.location && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.location.message}
                </p>
              )}
            </div>

            {editing && (
              <input type="hidden" {...methods.register('version')} />
            )}
          </div>
        )}
      </FormModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar sucursal"
        description={`¿Estás seguro de que deseas eliminar la sucursal "${toDelete?.name}"? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
