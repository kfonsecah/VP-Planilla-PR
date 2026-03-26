'use client';

import React, { useEffect, useState } from 'react';
import { NoSymbolIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [error, setError] = useState<string | null>(null);

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setExitDate(todayISO());
      setBusy(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!exitDate) {
      setError('La fecha de salida es requerida.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(exitDate);
    } catch {
      setError('No se pudo procesar el despido. Intenta de nuevo.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#F9F1DC] dark:bg-[#2d2d2d] rounded-xl shadow-2xl border border-[#D2B48C] dark:border-[#404040] overflow-hidden">

        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Warning notice */}
          <div className="flex gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <NoSymbolIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Esta acción marcará al empleado como despedido
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                El registro se mantendrá en el sistema pero el empleado quedará
                inactivo y no podrá ser incluido en nóminas futuras.
              </p>
            </div>
          </div>

          {/* Employee name */}
          <div>
            <label className="block text-xs font-bold text-[#5D4E37] dark:text-[#A3A3A3] uppercase tracking-widest mb-1">
              Empleado
            </label>
            <p className="text-base font-semibold text-[#3B4D36] dark:text-[#E5E5E5] bg-[#EDE4CC] dark:bg-[#333333] rounded-lg px-4 py-2.5 border border-[#D2B48C] dark:border-[#404040]">
              {employeeName}
            </p>
          </div>

          {/* Exit date */}
          <div>
            <label
              htmlFor="dismiss-exit-date"
              className="block text-xs font-bold text-[#5D4E37] dark:text-[#A3A3A3] uppercase tracking-widest mb-1"
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
              className="w-full px-3 py-2.5 border border-[#D2B48C] dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white dark:bg-[#333333] text-[#3B4D36] dark:text-[#E5E5E5] text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D2B48C] dark:border-[#404040] bg-[#F2E8CF] dark:bg-[#252525]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm border border-[#D2B48C] dark:border-[#404040] text-[#5D4E37] dark:text-[#A3A3A3] rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
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
