"use client";

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B4D36]/20 dark:bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-[#D2B48C] dark:border-gray-600 p-6">
        {/* Icono de advertencia */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white">{title || 'Confirmar acción'}</h3>
        </div>
        
        <p className="text-sm text-[#5D4E37] dark:text-gray-300 mb-6 leading-relaxed">{description || '¿Estás seguro de que deseas continuar?'}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-2.5 bg-[#E7DCC1] dark:bg-gray-700 hover:bg-[#D2B48C] dark:hover:bg-gray-600 text-[#3B4D36] dark:text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
