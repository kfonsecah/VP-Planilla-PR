'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { EmployeeLaborEvent } from '@/types/laborEvent';

interface EventPopoverProps {
  event: EmployeeLaborEvent;
  anchor: { x: number; y: number };
  employeeName: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// Mapa de colores por tipo de evento
const EVENT_TYPE_BORDER: Record<string, string> = {
  vacacion: 'border-l-blue-500',
  incapacidad: 'border-l-orange-500',
  permiso: 'border-l-purple-500',
  libre: 'border-l-teal-500',
  suspensi: 'border-l-red-500',
};

function getEventTypeBorder(eventName?: string): string {
  const name = (eventName || '').toLowerCase();
  for (const [key, cls] of Object.entries(EVENT_TYPE_BORDER)) {
    if (name.includes(key)) return cls;
  }
  return 'border-l-zinc-500';
}

function getStatusConfig(status?: string) {
  switch (status) {
    case 'active': return { label: 'Activo', cls: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' };
    case 'completed': return { label: 'Completado', cls: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' };
    case 'cancelled': return { label: 'Cancelado', cls: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' };
    default: return { label: 'Pendiente', cls: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300' };
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  anchor,
  employeeName,
  onView,
  onEdit,
  onDelete,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(anchor);
  const openedAtRef = useRef(Date.now());

  // Collision detection — reposition if overflows viewport
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const padding = 8;
    let x = anchor.x;
    let y = anchor.y;

    if (x + rect.width > window.innerWidth - padding) {
      x = anchor.x - rect.width - 16;
    }
    if (y + rect.height > window.innerHeight - padding) {
      y = window.innerHeight - rect.height - padding;
    }
    if (x < padding) x = padding;
    if (y < padding) y = padding;

    setPosition({ x, y });
  }, [anchor]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close on click outside (con debounce 200ms)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (Date.now() - openedAtRef.current < 200) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const statusConfig = getStatusConfig(event.status);
  const typeBorder = getEventTypeBorder(event.labor_event_name);
  const eventName = event.labor_event_name || `Evento #${event.labor_event_id}`;

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15 }}
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 1000 }}
        className={`w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl border-l-4 ${typeBorder}`}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-white truncate">
                {eventName}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {employeeName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Fechas y estado */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.cls}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {formatDate(event.start_date)}
              {event.end_date && ` — ${formatDate(event.end_date)}`}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 mx-2" />

        {/* Actions */}
        <div className="py-1">
          <button
            onClick={onView}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <EyeIcon className="w-4 h-4 text-zinc-400" />
            Ver Detalles
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <PencilIcon className="w-4 h-4 text-zinc-400" />
            Editar Evento
          </button>
          <div className="border-t border-zinc-100 dark:border-zinc-800 mx-2 my-0.5" />
          <button
            onClick={onDelete}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventPopover;
