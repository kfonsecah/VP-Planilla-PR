"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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

const formatSalary = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '';
  return `₡${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatSalaryInput = (raw: string): string => {
  if (!raw) return '';
  const endsWithDot = raw.endsWith('.');
  const [intPart, decPart] = raw.split('.');
  const intFormatted = Number(intPart || '0').toLocaleString('en-US');
  if (endsWithDot) return `${intFormatted}.`;
  if (decPart !== undefined) return `${intFormatted}.${decPart}`;
  return intFormatted;
};

const sanitizeSalaryInput = (input: string): string => {
  const digits = input.replace(/[^\d.]/g, '');
  const parts = digits.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : digits;
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
        ? position.base_salary.toFixed(2)
        : position.base_salary
          ? String(Number(position.base_salary).toFixed(2))
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
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar la posicion.' });
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
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo eliminar la posicion.' });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl pointer-events-auto">
        <div
          className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-[#D2B48C] dark:border-gray-700 overflow-hidden flex flex-col"
          style={{ maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="bg-[#6F7153] px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">Gestionar Posiciones</h2>
              {!isLoading && sortedPositions.length > 0 && (
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {sortedPositions.length} registradas
                </span>
              )}
            </div>
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

          {/* Two-column body */}
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT PANEL: Form */}
            <div className="w-2/5 flex-shrink-0 border-r border-[#D2B48C] dark:border-gray-700 flex flex-col bg-[#F2E8CF] dark:bg-[#2a2a2a]">
              {/* Panel title */}
              <div className="px-6 pt-5 pb-4 border-b border-[#D2B48C] dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${editing ? 'bg-amber-500' : 'bg-[#6F7153]'}`} />
                  <h3 className="text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-widest">
                    {editing ? 'Editando posición' : 'Nueva posición'}
                  </h3>
                </div>
                {editing && (
                  <p className="mt-1.5 text-xs text-[#6B5B3D] dark:text-gray-400 pl-5 italic">{editing.name}</p>
                )}
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`mx-6 mt-4 rounded-lg border px-4 py-2.5 text-sm ${
                  feedback.type === 'error'
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'border-green-300 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {feedback.message}
                </div>
              )}

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-6 py-5 gap-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Cajero(a)"
                    className="w-full px-3 py-2.5 border border-[#D2B48C] dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-white text-sm placeholder-[#C5BFAA] dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Atención al cliente y caja"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-[#D2B48C] dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-white text-sm placeholder-[#C5BFAA] dark:placeholder-gray-500 resize-y min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Salario Base <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355] dark:text-gray-400 text-sm font-medium select-none pointer-events-none">₡</span>
                    <input
                      value={formatSalaryInput(baseSalary)}
                      onChange={(e) => setBaseSalary(sanitizeSalaryInput(e.target.value))}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-[#D2B48C] dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-white text-sm placeholder-[#C5BFAA] dark:placeholder-gray-500"
                    />
                  </div>
                  {baseSalary && Number(baseSalary) > 0 && (
                    <p className="mt-1 text-xs text-[#8B7355] dark:text-gray-400 pl-1">
                      {formatSalary(Number(baseSalary))}
                    </p>
                  )}
                </div>

                {/* Action buttons pinned to bottom */}
                <div className="mt-auto pt-4 border-t border-[#D2B48C] dark:border-gray-700 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 bg-[#6F7153] text-white text-sm font-semibold rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-60"
                  >
                    {busy ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear posición'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={clearForm}
                      className="w-full px-4 py-2 border border-[#3B4D36] dark:border-gray-600 text-[#3B4D36] dark:text-white text-sm rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar edición
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={busy}
                    className="w-full px-4 py-2 border border-[#D2B48C] dark:border-gray-600 text-[#8B7355] dark:text-gray-400 text-sm rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
                  >
                    Recargar lista
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT PANEL: Positions table */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Panel title */}
              <div className="px-6 py-4 border-b border-[#D2B48C] dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-[#F9F1DC] dark:bg-[#1e1e1e]">
                <h3 className="text-xs font-bold text-[#3B4D36] dark:text-white uppercase tracking-widest">
                  Posiciones registradas
                </h3>
                {isLoading && (
                  <span className="text-xs text-[#8B7355] dark:text-gray-400 italic">Cargando...</span>
                )}
              </div>

              {/* Scrollable table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[#E7DCC1] dark:bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">Salario base <span className="text-[10px] font-normal text-[#8B7355] dark:text-gray-500 normal-case">x Hora</span></th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">Hora Extra <span className="text-[10px] font-normal text-[#8B7355] dark:text-gray-500 normal-case">(x1.5)</span></th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DEC4] dark:divide-gray-700">
                    {isLoading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[#8B7355] dark:text-gray-400 text-sm">
                          Cargando posiciones...
                        </td>
                      </tr>
                    )}
                    {!isLoading && sortedPositions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center">
                          <div className="flex flex-col items-center gap-2 text-[#8B7355] dark:text-gray-400">
                            <svg className="w-10 h-10 text-[#D2B48C] dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium">No hay posiciones registradas</span>
                            <span className="text-xs text-[#B5AF9A] dark:text-gray-500">Use el formulario para agregar una nueva posición</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isLoading && sortedPositions.map((position) => (
                      <tr
                        key={position.id}
                        className={`transition-colors ${
                          editing?.id === position.id
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400'
                            : 'bg-[#FDFCF9] dark:bg-[#1e1e1e] hover:bg-[#F5EDD5] dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <td className="px-4 py-3 text-[#3B4D36] dark:text-white font-semibold text-sm">{position.name}</td>
                        <td className="px-4 py-3 text-[#6B5B3D] dark:text-gray-400 text-xs max-w-[180px] truncate">{position.description}</td>
                        <td className="px-4 py-3 text-[#3B4D36] dark:text-white font-medium text-sm">{formatSalary(position.base_salary ?? null)}</td>
                        <td className="px-4 py-3 text-[#3B4D36] dark:text-white font-medium text-sm">
                          {formatSalary(position.base_salary ? position.base_salary * 1.5 : null)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(position)}
                              className="p-1.5 bg-[#D5CDB3] dark:bg-gray-600 text-[#3B4D36] dark:text-white rounded-md hover:bg-[#C5BFAA] dark:hover:bg-gray-500 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(position)}
                              className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delete confirmation */}
              {pendingDelete && (
                <div className="flex-shrink-0 border-t-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4">
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-3">
                    ¿Eliminar la posición &ldquo;{pendingDelete.name}&rdquo;?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={busy}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {busy ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      className="px-4 py-2 border border-[#D2B48C] dark:border-gray-600 text-[#5D4E37] dark:text-gray-300 text-sm rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-gray-700 transition-colors"
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
