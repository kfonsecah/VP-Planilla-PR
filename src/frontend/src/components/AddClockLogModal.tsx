'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { clockLogAdjustmentService, ClockLog, AddClockLogPayload } from '@/services/clockLogAdjustmentService';
import { getEmployees } from '@/services/employeeService';
import { Select, SelectItem } from '@/components/ui/Select';

// Lazy-load framer-motion
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface EmployeeOption {
  id: string;
  name: string;
}

interface AddClockLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string; // Optional pre-filled
  employeeName?: string; // Optional for locked display
  initialDate?: string;
  initialType?: 'IN' | 'OUT';
  onSuccess?: (newMark: ClockLog) => void;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 20, stiffness: 250 },
  },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } },
};

const AddClockLogModal: React.FC<AddClockLogModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  initialDate,
  initialType,
  onSuccess,
}) => {
  // Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employeeId || '');
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [type, setType] = useState<'IN' | 'OUT'>(initialType || 'IN');
  const [justification, setJustification] = useState<string>('');
  
  // UI state
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load employees on mount
  useEffect(() => {
    if (isOpen) {
      setIsLoadingEmployees(true);
      getEmployees()
        .then((emps) => {
          setEmployees(
            emps.map((e: { id: string | number; first_name?: string; last_name?: string; employee_first_name?: string; employee_last_name?: string }) => ({
              id: String(e.id),
              name: `${e.first_name || e.employee_first_name || ''} ${e.last_name || e.employee_last_name || ''}`.trim(),
            }))
          );
        })
        .catch((err) => {
          console.error('[AddClockLogModal] Error loading employees:', err);
          toast.error('Error al cargar empleados');
        })
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen]);

  // Pre-fill employee if provided
  useEffect(() => {
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
  }, [employeeId]);

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setType(initialType || 'IN');
      setJustification('');
      setShowPreview(false);
    }
  }, [isOpen, initialDate, initialType]);

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast.error('Seleccione un empleado');
      return;
    }

    const justificationTrimmed = justification.trim();
    if (justificationTrimmed.length < 10) {
      toast.error('La justificación debe tener al menos 10 caracteres');
      return;
    }

    // Combine date and time, interpret as local time, then convert to ISO
    const localDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(localDateTime.getTime())) {
      toast.error('Fecha o hora inválida');
      return;
    }
    const timestamp = localDateTime.toISOString();

    setIsSubmitting(true);
    try {
      const payload: AddClockLogPayload = {
        employeeId: selectedEmployeeId,
        timestamp,
        type,
        justification: justificationTrimmed,
      };

      const result = await clockLogAdjustmentService.addClockLog(payload);
      toast.success('Marca agregada correctamente');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (error) {
      console.error('[AddClockLogModal] Error adding clock log:', error);
      toast.error(error instanceof Error ? error.message : 'Error al agregar la marca');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewText = () => {
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    const empName = employeeName || emp?.name || 'empleado';
    const typeLabel = type === 'IN' ? 'Entrada' : 'Salida';
    const formattedDate = new Date(date).toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `Se agregará una marca de ${typeLabel} para ${empName} el ${formattedDate} a las ${time}`;
  };

  const isFormValid = selectedEmployeeId && justification.trim().length >= 10;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-black/60 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <MotionDiv
          className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Blue accent for ADD */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white dark:text-zinc-100">
              {employeeId ? 'Agregar Marca' : 'Nueva Marca'}
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Pre-filled employee display */}
          {employeeId && employeeName && (
            <div className="px-6 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Agregando marca para: <strong>{employeeName}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Employee Selection (disabled if pre-filled) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Empleado
              </label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                placeholder={isLoadingEmployees ? 'Cargando...' : 'Seleccionar empleado'}
                disabled={!!employeeId || isLoadingEmployees}
              >
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Hora (24h)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Tipo de Marca
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="markType"
                    value="IN"
                    checked={type === 'IN'}
                    onChange={() => setType('IN')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Entrada</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="markType"
                    value="OUT"
                    checked={type === 'OUT'}
                    onChange={() => setType('OUT')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Salida</span>
                </label>
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Justificación
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explicar motivo de la corrección..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${justification.trim().length >= 10 ? 'text-green-600' : 'text-zinc-400'}`}>
                  {justification.trim().length}/10 caracteres mínimos
                </span>
              </div>
            </div>

            {/* Preview Section */}
            <div
              className={`p-4 rounded-lg border transition-all ${
                showPreview && isFormValid
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ver preview antes de confirmar
                </span>
              </label>
              {showPreview && isFormValid && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  {getPreviewText()}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting || (showPreview && !isFormValid)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl transition-colors font-medium shadow-md"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar corrección'}
            </button>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};

export default AddClockLogModal;