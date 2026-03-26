"use client";

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePositions } from '@/hooks/usePositions';
import { Position } from '@/services/positionsService';
import { useModal } from '@/hooks/useModal';

export default function PositionsPage() {
  const { data, refetch, create, update, remove } = usePositions();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Position | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Position) => { setEditing(p); setFormOpen(true); };
  const openDelete = (p: Position) => { setToDelete(p); setConfirmOpen(true); };

  const handleSubmit = async (values: Partial<Position>) => {
    try {
      if (editing) {
        try {
          await update(editing.id, values);
          modal.showSuccess('Actualizado', 'Posición actualizada correctamente');
        } catch (err: unknown) {
          // Detect conflict
          const apiErr = err as { status?: number; message?: string };
          if (apiErr?.status === 409) {
            setConflictMessage(apiErr.message || 'Conflicto al actualizar. Otro usuario modificó el registro.');
            setConflictOpen(true);
            return;
          }
          throw err;
        }
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Posición creada correctamente');
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
      modal.showSuccess('Eliminado', 'Posición eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleConflictReload = async () => {
    setConflictOpen(false);
    setConflictMessage(null);
    await refetch();
    // reopen form with fresh data if editing
    if (editing) {
      const fresh = (data || []).find(d => d.id === editing.id) as Position | undefined;
      setEditing(fresh || null);
      setFormOpen(true);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Nombre' },
    { key: 'description', title: 'Descripción' },
    { key: 'base_salary', title: 'Salario base', render: (r: Position) => r.base_salary?.toFixed?.(2) ?? '' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#3B4D36] dark:text-white">Posiciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Nueva posición</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Posición' : 'Nueva Posición'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: UseFormReturn<Partial<Position>>) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Nombre</label>
              <input {...methods.register('name')} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 rounded text-[#3B4D36] dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Descripción</label>
              <input {...methods.register('description')} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 rounded text-[#3B4D36] dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Salario base</label>
              <input {...methods.register('base_salary', { valueAsNumber: true })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 rounded text-[#3B4D36] dark:text-white" />
            </div>

            {/* version se envía en update para control optimista */}
            <input type="hidden" {...(methods.register ? methods.register('version') : {})} />
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar posición" description="¿Confirma eliminar esta posición?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />

      <ConfirmDialog open={conflictOpen} title="Conflicto de actualización" description={conflictMessage || 'El registro fue modificado por otro usuario. ¿Deseas recargar los datos?'} onCancel={() => setConflictOpen(false)} onConfirm={handleConflictReload} />
    </div>
  );
}
