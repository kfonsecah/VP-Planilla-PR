"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Position } from '@/services/positionsService';

interface PositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions?: Position[] | null;
  isLoading?: boolean;
  onCreate: (payload: Partial<Position>) => Promise<Position>;
  onUpdate: (id: number, payload: Partial<Position>) => Promise<Position | null>;
  onDelete: (id: number) => Promise<void>;
  onRefresh?: () => void;
}

const formatSalary = (value?: number | null) => {
  if (typeof value !== 'number') return '';
  return `₡${value.toLocaleString()}`;
};

const PositionsModal: React.FC<PositionsModalProps> = ({
  isOpen,
  onClose,
  positions,
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh
}) => {
  const [editing, setEditing] = useState<Position | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Position | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEditing(null);
    setName('');
    setDescription('');
    setBaseSalary('');
    setFeedback(null);
    setPendingDelete(null);
  }, [isOpen]);

  const sortedPositions = useMemo(() => {
    return [...(positions || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [positions]);

  const startEdit = (position: Position) => {
    setEditing(position);
    setName(position.name || '');
    setDescription(position.description || '');
    setBaseSalary(
      typeof position.base_salary === 'number'
        ? String(position.base_salary)
        : position.base_salary
          ? String(position.base_salary)
          : ''
    );
    setFeedback(null);
  };

  const clearForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setBaseSalary('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const salaryNumber = Number(baseSalary);

    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'El nombre es requerido.' });
      return;
    }

    if (!trimmedDescription) {
      setFeedback({ type: 'error', message: 'La descripcion es requerida.' });
      return;
    }

    if (!Number.isFinite(salaryNumber) || salaryNumber < 0) {
      setFeedback({ type: 'error', message: 'El salario base debe ser un numero valido.' });
      return;
    }

    if (editing && (editing.version === undefined || editing.version === null)) {
      setFeedback({ type: 'error', message: 'No se puede editar sin version del registro.' });
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: trimmedName,
          description: trimmedDescription,
          base_salary: salaryNumber,
          version: editing.version
        });
        setFeedback({ type: 'success', message: 'Posicion actualizada correctamente.' });
      } else {
        await onCreate({
          name: trimmedName,
          description: trimmedDescription,
          base_salary: salaryNumber
        });
        setFeedback({ type: 'success', message: 'Posicion creada correctamente.' });
      }
      clearForm();
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'No se pudo guardar la posicion.' });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await onDelete(pendingDelete.id);
      setFeedback({ type: 'success', message: 'Posicion eliminada correctamente.' });
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'No se pudo eliminar la posicion.' });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-4xl pointer-events-auto">
        <div className="bg-[#F9F1DC] rounded-xl shadow-2xl border border-[#E0D6B7] overflow-hidden">
          <div className="bg-[#6F7153] px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Gestionar posiciones</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {feedback && (
              <div className={
                feedback.type === 'error'
                  ? 'rounded-lg border border-red-300 bg-red-100 text-red-700 px-4 py-2'
                  : 'rounded-lg border border-green-300 bg-green-100 text-green-700 px-4 py-2'
              }>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[#5D4E37] mb-1">Nombre *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[#5D4E37] mb-1">Descripcion *</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[#5D4E37] mb-1">Salario base *</label>
                <input
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                />
              </div>

              <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-60"
                >
                  {editing ? 'Guardar cambios' : 'Crear posicion'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-4 py-2 border border-[#3B4D36] text-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-colors"
                  >
                    Cancelar edicion
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRefresh}
                  className="px-4 py-2 border border-[#3B4D36] text-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-colors"
                >
                  Recargar lista
                </button>
              </div>
            </form>

            <div className="border-t border-[#E0D6B7] pt-4">
              <h3 className="text-base font-medium text-[#3B4D36] mb-3">Posiciones registradas</h3>
              <div className="overflow-x-auto rounded-lg border border-[#E0D6B7]">
                <table className="w-full text-sm">
                  <thead className="bg-[#E7DCC1] text-[#5D4E37]">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Descripcion</th>
                      <th className="px-4 py-2 text-left">Salario base</th>
                      <th className="px-4 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0D6B7]">
                    {isLoading && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-[#6B5B3D]">
                          Cargando posiciones...
                        </td>
                      </tr>
                    )}
                    {!isLoading && sortedPositions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-[#6B5B3D]">
                          No hay posiciones registradas.
                        </td>
                      </tr>
                    )}
                    {!isLoading && sortedPositions.map((position) => (
                      <tr key={position.id} className="bg-[#FDFCF9]">
                        <td className="px-4 py-2 text-[#3B4D36] font-medium">{position.name}</td>
                        <td className="px-4 py-2 text-[#6B5B3D]">{position.description}</td>
                        <td className="px-4 py-2 text-[#3B4D36]">{formatSalary(position.base_salary ?? null)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(position)}
                              className="px-3 py-1 text-sm bg-[#B5AF9A] text-[#3B4D36] rounded-md hover:bg-[#A7A18D]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(position)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pendingDelete && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                  <div className="text-sm text-red-700">
                    Confirmas eliminar la posicion "{pendingDelete.name}"?
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={busy}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                    >
                      Si, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      className="px-4 py-2 border border-[#3B4D36] text-[#3B4D36] rounded-lg hover:bg-[#E7DCC1]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionsModal;
