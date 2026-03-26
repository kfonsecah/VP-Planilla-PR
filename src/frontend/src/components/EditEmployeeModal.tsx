"use client";

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeSchema, EmployeeSchemaType, EmployeeSchemaInputType } from '@/schemas/employee';
import { Position } from '@/services/positionsService';

interface RawEmployeeData {
  employee_first_name?: string;
  name?: string;
  employee_middle_name?: string;
  middle_name?: string;
  employee_last_name?: string;
  last_name?: string;
  national_id?: string;
  social_code?: string;
  email?: string;
  phone?: string;
  position_id?: string | number | null;
  hire_date?: string;
  gender?: string;
  required_hours_biweekly?: string;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeSchemaType) => Promise<void> | void;
  employeeData?: RawEmployeeData;
  isLoading?: boolean;
  positions?: Position[] | null;
  positionsLoading?: boolean;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employeeData,
  isLoading = false,
  positions,
  positionsLoading = false
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const positionOptions = (positions || []).map((position) => ({
    id: String(position.id),
    name: position.name || 'Sin nombre',
    salary: typeof position.base_salary === 'number' ? position.base_salary : Number(position.base_salary) || 0
  }));

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
  });

  // Resetear formulario cuando cambian los datos del empleado
  useEffect(() => {
    if (isOpen && employeeData) {
      reset({
        employee_first_name: employeeData.employee_first_name ?? employeeData.name ?? '',
        employee_middle_name: employeeData.employee_middle_name ?? employeeData.middle_name ?? '',
        employee_last_name: employeeData.employee_last_name ?? employeeData.last_name ?? '',
        employee_national_id: employeeData.national_id || '',
        employee_social_code: employeeData.social_code || '',
        employee_email: employeeData.email || '',
        employee_phone: employeeData.phone || '',
        employee_position_id: String(employeeData.position_id || ''),
        employee_hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split('T')[0] : '',
        employee_gender: employeeData.gender || '',
        employee_required_hours_biweekly: employeeData.required_hours_biweekly || '',
      });
    }
  }, [isOpen, employeeData, reset]);

  useEffect(() => {
    if (!isOpen) return;
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }, [isOpen]);

  // Motion variants
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 30 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 250 } },
    exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } }
  };

  const onFormSubmit = async (data: EmployeeSchemaType) => {
    await onSubmit(data);
    onClose();
  };

  if (isLoading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 dark:bg-black/60 z-40"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="pointer-events-auto bg-[#F9F1DC] dark:bg-gray-800 rounded-xl shadow-2xl border border-[#E0D6B7] dark:border-gray-700 p-8"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto"></div>
                  <p className="mt-4 text-[#3B4D36] dark:text-white">Cargando empleado...</p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              className="pointer-events-auto w-full max-w-4xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#F9F1DC] dark:bg-gray-800 rounded-xl shadow-2xl border border-[#E0D6B7] dark:border-gray-700 overflow-hidden">
                <div className="bg-[#6F7153] dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Editar empleado</h2>
                  <div className="flex items-center gap-2">
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
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Datos Personales */}
                    <div>
                      <h3 className="text-base font-medium text-[#3B4D36] dark:text-white mb-3 pb-2 border-b border-[#D2B48C] dark:border-gray-600">
                        Datos Personales
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Primer nombre *</label>
                          <input {...register('employee_first_name')} className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                          {errors.employee_first_name && <p className="mt-1 text-sm text-red-600">{String(errors.employee_first_name?.message)}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Segundo nombre</label>
                          <input {...register('employee_middle_name')} className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Apellidos *</label>
                          <input {...register('employee_last_name')} className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                          {errors.employee_last_name && <p className="mt-1 text-sm text-red-600">{String(errors.employee_last_name?.message)}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Identificación */}
                    <div>
                      <h3 className="text-base font-medium text-[#3B4D36] dark:text-white mb-3 pb-2 border-b border-[#D2B48C] dark:border-gray-600">
                        Identificación
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Cédula de identidad *</label>
                          <input {...register('employee_national_id')} placeholder="1-2345-6789" className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                          {errors.employee_national_id && <p className="mt-1 text-sm text-red-600">{String(errors.employee_national_id?.message)}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Código de la CCSS</label>
                          <input {...register('employee_social_code')} placeholder="123456789012" className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Información de Contacto */}
                    <div>
                      <h3 className="text-base font-medium text-[#3B4D36] dark:text-white mb-3 pb-2 border-b border-[#D2B48C] dark:border-gray-600">
                        Información de Contacto
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Correo electrónico *</label>
                          <input {...register('employee_email')} type="email" placeholder="juan.rodriguez@empresa.com" className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                          {errors.employee_email && <p className="mt-1 text-sm text-red-600">{String(errors.employee_email?.message)}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Número telefónico</label>
                          <input {...register('employee_phone')} placeholder="8888-1234" className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Información Laboral */}
                    <div>
                      <h3 className="text-base font-medium text-[#3B4D36] dark:text-white mb-3 pb-2 border-b border-[#D2B48C] dark:border-gray-600">
                        Información Laboral
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Posición *</label>
                          <select
                            {...register('employee_position_id')}
                            disabled={positionsLoading}
                            className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white"
                          >
                            <option value="">{positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}</option>
                            {positionOptions.map((position) => (
                              <option key={position.id} value={position.id}>
                                {position.name} - ₡{position.salary.toLocaleString()} | HExtra: ₡{(position.salary * 1.5).toLocaleString()}
                              </option>
                            ))}
                          </select>
                          {errors.employee_position_id && <p className="mt-1 text-sm text-red-600">{String(errors.employee_position_id?.message)}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Fecha de contratación</label>
                          <input {...register('employee_hire_date')} type="date" className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">Horas requeridas por quincena</label>
                          <input 
                            {...register('employee_required_hours_biweekly')} 
                            type="number"
                            step="0.01"
                            min="0"
                            max="999.99"
                            placeholder="104.00" 
                            className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white" 
                          />
                          <p className="mt-1 text-xs text-[#8B7355] dark:text-gray-400">Ejemplo: 104h medio tiempo, 208h tiempo completo</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-2">Género</label>
                          <div className="flex gap-4 pt-2">
                            <label className="flex items-center cursor-pointer">
                              <input {...register('employee_gender')} type="radio" value="Masculino" className="mr-2" />
                              <span className="text-[#5D4E37] dark:text-gray-300">Masculino</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input {...register('employee_gender')} type="radio" value="Femenino" className="mr-2" />
                              <span className="text-[#5D4E37] dark:text-gray-300">Femenino</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input {...register('employee_gender')} type="radio" value="Otro" className="mr-2" />
                              <span className="text-[#5D4E37] dark:text-gray-300">Otro</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#E0D6B7] dark:border-gray-600 pt-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-3 text-[#3B4D36] dark:text-white border border-[#3B4D36] dark:border-gray-500 rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-gray-600 transition-all duration-200 font-medium">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-all duration-200 font-medium">
                          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditEmployeeModal;
