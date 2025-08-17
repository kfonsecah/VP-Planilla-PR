'use client';

import React from 'react';
import { EmployeeFormData } from '@/types';
import { POSITIONS } from '@/constants';
import useAddEmployeeModal from '@/hooks/useAddEmployeeModal';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeFormData) => void;
}

/**
 * Modal para agregar un nuevo empleado
 * Incluye formulario completo con validación
 */
const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const { 
    formData, 
    handleInputChange, 
    handleSubmit, 
    handleCancel 
  } = useAddEmployeeModal();

  // Convertir las posiciones a formato de opciones para el select
  const positionOptions = Object.entries(POSITIONS).map(([id, position]) => ({
    id,
    name: position.name,
    salary: position.salary
  }));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ 
        WebkitBackdropFilter: 'blur(4px)', 
        backdropFilter: 'blur(4px)', 
        background: 'rgba(0,0,0,0.4)' 
      }}
    >
      <div className="bg-[#F9F1DC] rounded-lg shadow-2xl w-[600px] max-w-[95vw] max-h-[95vh] p-8 relative overflow-auto">
        {/* Botón de cerrar */}
        <button
          className="absolute top-4 right-4 text-[#5D4E37] hover:text-[#3B4D36] text-2xl transition-colors"
          onClick={handleCancel(onClose)}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        {/* Encabezado del modal */}
        <h2 className="text-2xl font-bold text-[#3B4D36] mb-6">
          Añadir empleado
        </h2>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit, onClose)} className="space-y-4">
          {/* Nombres completos */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Primer nombre *
              </label>
              <input
                type="text"
                name="employee_first_name"
                value={formData.employee_first_name}
                onChange={handleInputChange}
                placeholder="Juan"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Segundo nombre
              </label>
              <input
                type="text"
                name="employee_middle_name"
                value={formData.employee_middle_name}
                onChange={handleInputChange}
                placeholder="Carlos"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                name="employee_last_name"
                value={formData.employee_last_name}
                onChange={handleInputChange}
                placeholder="Rodríguez López"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                required
              />
            </div>
          </div>

          {/* Documentación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Cédula de identidad *
              </label>
              <input
                type="text"
                name="employee_national_id"
                value={formData.employee_national_id}
                onChange={handleInputChange}
                placeholder="1-2345-6789"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Código de la CCSS
              </label>
              <input
                type="text"
                name="employee_social_code"
                value={formData.employee_social_code}
                onChange={handleInputChange}
                placeholder="123456789012"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                name="employee_email"
                value={formData.employee_email}
                onChange={handleInputChange}
                placeholder="juan.rodriguez@empresa.com"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5D4E37] mb-1">
                Número telefónico
              </label>
              <input
                type="tel"
                name="employee_phone"
                value={formData.employee_phone}
                onChange={handleInputChange}
                placeholder="8888-1234"
                className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              />
            </div>
          </div>

          {/* Posición */}
          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-1">
              Posición *
            </label>
            <select
              name="employee_position_id"
              value={formData.employee_position_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
              required
            >
              <option value="">Seleccionar posición</option>
              {positionOptions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name} - ₡{position.salary.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de contratación */}
          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-1">
              Fecha de contratación
            </label>
            <input
              type="date"
              name="employee_hire_date"
              value={formData.employee_hire_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
            />
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-2">
              Género
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="employee_gender"
                  value="Masculino"
                  checked={formData.employee_gender === 'Masculino'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-[#5D4E37]">Masculino</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="employee_gender"
                  value="Femenino"
                  checked={formData.employee_gender === 'Femenino'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-[#5D4E37]">Femenino</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="employee_gender"
                  value="Otro"
                  checked={formData.employee_gender === 'Otro'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-[#5D4E37]">Otro</span>
              </label>
            </div>
          </div>

          {/* Horario */}
          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-1">
              Horario
            </label>
            <select
              name="employee_schedule"
              value={formData.employee_schedule}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
            >
              <option value="Horario Diurno">Horario Diurno</option>
              <option value="Horario Nocturno">Horario Nocturno</option>
              <option value="Horario Mixto">Horario Mixto</option>
              <option value="Medio Tiempo">Medio Tiempo</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleCancel(onClose)}
              className="flex-1 px-4 py-2 text-[#5D4E37] bg-white border border-[#D2B48C] rounded-md hover:bg-[#F5F5F5] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-[#6F7153] rounded-md hover:bg-[#5D4E37] transition-colors"
            >
              Guardar empleado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
