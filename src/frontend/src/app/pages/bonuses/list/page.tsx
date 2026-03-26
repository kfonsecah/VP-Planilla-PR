"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useBonuses } from '@/hooks/useBonuses';
import { Bonus } from '@/services/bonusesService';
import { useModal } from '@/hooks/useModal';
import { UseFormReturn } from 'react-hook-form';

export default function BonusesPage() {
  const { data, refetch, create, update, remove } = useBonuses();
  const modal = useModal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bonus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Bonus | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b: Bonus) => {
    setEditing(b);
    setFormOpen(true);
  };

  const openDelete = (b: Bonus) => {
    setToDelete(b);
    setConfirmOpen(true);
  };

  const handleSubmit = async (values: Partial<Bonus>) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Bonificación actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Bonificación creada correctamente');
      }
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Bonificación eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'employee_id', title: 'Empleado' },
    { key: 'year', title: 'Año' },
    { key: 'month', title: 'Mes' },
    { key: 'description', title: 'Descripción' },
    { key: 'amount', title: 'Monto', render: (r: Bonus) => r.amount?.toFixed(2) },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#3B4D36] dark:text-white">Bonificaciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Nueva bonificación</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Bonificación' : 'Nueva Bonificación'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: UseFormReturn<Partial<Bonus>>) => (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Empleado (ID)</label>
              <input {...methods.register('employee_id', { valueAsNumber: true })} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Payroll ID</label>
              <input {...methods.register('payroll_id', { valueAsNumber: true })} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Año</label>
              <input {...methods.register('year', { valueAsNumber: true })} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Mes</label>
              <input {...methods.register('month', { valueAsNumber: true })} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Descripción</label>
              <input {...methods.register('description')} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[#3B4D36] dark:text-white">Monto</label>
              <input {...methods.register('amount', { valueAsNumber: true })} className="w-full border border-[#E0D6B7] dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white" />
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar bonificación" description="¿Confirma eliminar esta bonificación?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />

    </div>
  );
}
