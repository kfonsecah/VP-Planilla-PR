"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePositions } from '@/hooks/usePositions';
import { Position } from '@/services/positionsService';
import { useModal } from '@/hooks/useModal';

export default function PositionsPage() {
  const { data, isLoading, error, refetch, create, update, remove } = usePositions();
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

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        try {
          await update(editing.id, values);
          modal.showSuccess('Actualizado', 'Posición actualizada correctamente');
        } catch (err: any) {
          // Detect conflict
          if (err?.status === 409) {
            setConflictMessage(err.message || 'Conflicto al actualizar. Otro usuario modificó el registro.');
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
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Posición eliminada correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
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
        <h2 className="text-2xl font-semibold">Posiciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 rounded">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">Nueva posición</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Posición' : 'Nueva Posición'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: any) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input {...methods.register('name')} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input {...methods.register('description')} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Salario base</label>
              <input {...methods.register('base_salary', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
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
