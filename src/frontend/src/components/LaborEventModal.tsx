'use client';

import React, { useState, useEffect } from 'react';
import { LaborEventFormData, EmployeeLaborEvent } from '@/types/laborEvent';
import { Employee } from '@/types/employee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LaborEventFormData) => Promise<void>;
  event?: EmployeeLaborEvent;
  employees: Employee[];
}

const LaborEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  employees
}) => {
  const [formData, setFormData] = useState<LaborEventFormData>({
    name: '',
    description: '',
    employee_id: undefined,
    start_date: new Date(),
    end_date: undefined,
    status: 'active'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        employee_id: event.employee_id,
        start_date: new Date(event.start_date),
        end_date: event.end_date ? new Date(event.end_date) : undefined,
        status: event.status
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-[#3B4D36]">
          {event ? 'Editar Evento' : 'Nuevo Evento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Nombre del Evento
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Empleado
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_id: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            >
              <option value="">Seleccionar empleado</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Inicio
              </label>
              <input
                type="datetime-local"
                value={formData.start_date?.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: new Date(e.target.value) }))}
                className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3B4D36]">
                Fecha Fin
              </label>
              <input
                type="datetime-local"
                value={formData.end_date?.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: new Date(e.target.value) }))}
                className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3B4D36]">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'cancelled' }))}
              className="mt-1 block w-full rounded-md border border-[#D2B48C] p-2"
              required
            >
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3B4D36] text-white rounded-lg hover:bg-[#6F7153]"
            >
              {event ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaborEventModal;