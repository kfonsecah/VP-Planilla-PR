"use client";

import React, { useState } from 'react';
import { useBranches } from '@/hooks/useBranches';
import { useModal } from '@/hooks/useModal';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Branch } from '@/types/branch';
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

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Sucursal actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creada', 'Sucursal creada correctamente');
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
      modal.showSuccess('Eliminada', 'Sucursal eliminada correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
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
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B4D36]">Gestión de Sucursales</h1>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Administra las sucursales y ubicaciones de la empresa
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
              Nueva Sucursal
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
            <p className="text-[#5D4E37]">Cargando sucursales...</p>
          </div>
        )}

        {/* Branches Grid */}
        {!isLoading && branches && branches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#6F7153] rounded-lg">
                      <BuildingOfficeIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#3B4D36]">{branch.name}</h3>
                      <p className="text-xs text-[#6B5B3D]">ID: {branch.id}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#5D4E37]">
                    <MapPinIcon className="w-4 h-4 text-[#6F7153]" />
                    <span>{branch.location}</span>
                  </div>
                </div>

                {/* Metadata */}
                {branch.created_at && (
                  <div className="mb-4 text-xs text-[#6B5B3D]">
                    <p>Creada: {formatDate(branch.created_at)}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-[#E0D6B7]">
                  <button
                    onClick={() => openEdit(branch)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => openDelete(branch)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
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
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#E7DCC1] rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="w-8 h-8 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#3B4D36] mb-2">
              No hay sucursales registradas
            </h3>
            <p className="text-sm text-[#6B5B3D] mb-6">
              Crea tu primera sucursal para comenzar
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
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
        {(methods: any) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                Nombre de la Sucursal <span className="text-red-500">*</span>
              </label>
              <input
                {...methods.register('name', { required: 'El nombre es requerido' })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                placeholder="Ej: Sucursal Central, Oficina Sur"
              />
              {methods.formState.errors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36]">
                Ubicación <span className="text-red-500">*</span>
              </label>
              <textarea
                {...methods.register('location', { required: 'La ubicación es requerida' })}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
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
