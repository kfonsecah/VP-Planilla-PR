'use client';

import React, { useEffect, useState } from 'react';
import { NoSymbolIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface DismissEmployeeModalProps {
  isOpen: boolean;
  employeeName: string;
  onConfirm: (exitDate: string) => Promise<void>;
  onClose: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const DismissEmployeeModal: React.FC<DismissEmployeeModalProps> = ({
  isOpen,
  employeeName,
  onConfirm,
  onClose,
}) => {
  const [exitDate, setExitDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExitDate(todayISO());
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!exitDate) {
      toast.error('La fecha de salida es requerida.');
      return;
    }
    setBusy(true);
    try {
      await onConfirm(exitDate);
      toast.success('Empleado despedido exitosamente');
      onClose();
    } catch {
      toast.error('No se pudo procesar el despido. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 bg-red-700">
          <div className="flex items-center gap-3">
            <NoSymbolIcon className="w-5 h-5 text-white flex-shrink-0" />
            <h2 className="text-base font-semibold text-white">Despedir Empleado</h2>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-white hover:text-red-200 transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          <div className="flex gap-3 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3">
            <NoSymbolIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">
                Esta acción marcará al empleado como despedido
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                El registro se mantendrá en el sistema pero el empleado quedará
                inactivo y no podrá ser incluido en nóminas futuras.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1">
              Empleado
            </label>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-2.5 border border-zinc-200 dark:border-zinc-700">
              {employeeName}
            </p>
          </div>

          <div>
            <label
              htmlFor="dismiss-exit-date"
              className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1"
            >
              Fecha de salida <span className="text-red-500">*</span>
            </label>
            <input
              id="dismiss-exit-date"
              type="date"
              value={exitDate}
              max={todayISO()}
              onChange={(e) => setExitDate(e.target.value)}
              disabled={busy}
              className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            <NoSymbolIcon className="w-4 h-4" />
            {busy ? 'Procesando...' : 'Confirmar despido'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DismissEmployeeModal;
