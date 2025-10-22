"use client";

import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, description, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
        <h3 className="text-lg font-medium mb-2">{title || 'Confirmar acción'}</h3>
        <p className="text-sm text-gray-600 mb-4">{description || '¿Estás seguro de que deseas continuar?'}</p>
        <div className="flex justify-end">
          <button onClick={onCancel} className="mr-3 px-4 py-2 bg-gray-200 rounded">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
