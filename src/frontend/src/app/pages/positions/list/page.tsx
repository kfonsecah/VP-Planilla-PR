"use client";

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePositions } from '@/hooks/usePositions';
import { Position } from '@/services/positionsService';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function PositionsPage() {
  const { data, isLoading, error, refetch, create, update, remove } = usePositions();

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
          toast.success('Posición actualizada correctamente');
        } catch (err: unknown) {
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
        toast.success('Posición creada correctamente');
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
      toast.success('Posición eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleConflictReload = async () => {
    setConflictOpen(false);
    setConflictMessage(null);
    await refetch();
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
    { key: 'occupation_code', title: 'Cód. Ocupación (INS)' },
    { key: 'risk_class', title: 'Clase Riesgo' },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="mb-2">
        <p className="text-xs text-zinc-400 uppercase tracking-widest">Configuración / Posiciones</p>
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Posiciones</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Recargar
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Nueva posición
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <Table columns={columns} data={data || []} isLoading={isLoading} error={error} onRetry={refetch} onEdit={openEdit} onDelete={openDelete} />
      </div>

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Posición' : 'Nueva Posición'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: UseFormReturn<Partial<Position>>) => (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Nombre</label>
              <input {...methods.register('name')} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-zinc-800 dark:text-zinc-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Descripción</label>
              <input {...methods.register('description')} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-zinc-800 dark:text-zinc-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Salario base</label>
              <input {...methods.register('base_salary', { valueAsNumber: true })} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-zinc-800 dark:text-zinc-100" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Cód. Ocupación (INS)</label>
                <input {...methods.register('occupation_code')} placeholder="P.ej. 0101" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-zinc-800 dark:text-zinc-100" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-100">Clase Riesgo</label>
                <input {...methods.register('risk_class')} placeholder="P.ej. IV" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-zinc-800 dark:text-zinc-100" />
              </div>
            </div>

            <input type="hidden" {...(methods.register ? methods.register('version') : {})} />
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar posición" description="¿Confirma eliminar esta posición?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />

      <ConfirmDialog open={conflictOpen} title="Conflicto de actualización" description={conflictMessage || 'El registro fue modificado por otro usuario. ¿Deseas recargar los datos?'} onCancel={() => setConflictOpen(false)} onConfirm={handleConflictReload} />
    </div>
  );
}
