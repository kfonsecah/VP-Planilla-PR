"use client";

import React, { useState } from 'react';
import Table from '@/components/ui/Table';
import FormModal from '@/components/ui/FormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useBonuses } from '@/hooks/useBonuses';
import { Bonus } from '@/services/bonusesService';
import { useModal } from '@/hooks/useModal';
import { useForm, Controller } from 'react-hook-form';

export default function BonusesPage() {
  const { data, isLoading, error, refetch, create, update, remove } = useBonuses();
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

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(editing.id, values);
        modal.showSuccess('Actualizado', 'Bonificación actualizada correctamente');
      } else {
        await create(values);
        modal.showSuccess('Creado', 'Bonificación creada correctamente');
      }
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Bonificación eliminada correctamente');
      refetch();
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Bonificaciones</h2>
        <div>
          <button onClick={() => refetch()} className="mr-2 px-4 py-2 bg-gray-200 rounded">Recargar</button>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">Nueva bonificación</button>
        </div>
      </div>

      <Table columns={columns} data={data || []} onEdit={openEdit} onDelete={openDelete} />

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar Bonificación' : 'Nueva Bonificación'} initialValues={editing || undefined} onSubmit={handleSubmit}>
        {(methods: any) => (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empleado (ID)</label>
              <input {...methods.register('employee_id', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payroll ID</label>
              <input {...methods.register('payroll_id', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <input {...methods.register('year', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mes</label>
              <input {...methods.register('month', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input {...methods.register('description')} className="w-full border px-2 py-1 rounded" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Monto</label>
              <input {...methods.register('amount', { valueAsNumber: true })} className="w-full border px-2 py-1 rounded" />
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog open={confirmOpen} title="Eliminar bonificación" description="¿Confirma eliminar esta bonificación?" onCancel={() => setConfirmOpen(false)} onConfirm={handleConfirmDelete} />

    </div>
  );
}
