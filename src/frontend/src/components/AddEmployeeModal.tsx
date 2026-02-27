"use client";

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeSchema, EmployeeSchemaType } from '@/schemas/employee';
import { Position } from '@/services/positionsService';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeSchemaType) => Promise<void> | void;
  positions?: Position[] | null;
  positionsLoading?: boolean;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  positions,
  positionsLoading = false
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const positionOptions = (positions || []).map((position) => ({
    id: String(position.id),
    name: position.name || 'Sin nombre',
    salary: typeof position.base_salary === 'number' ? position.base_salary : Number(position.base_salary) || 0
  }));

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_first_name: '',
      employee_middle_name: '',
      employee_last_name: '',
      employee_national_id: '',
      employee_social_code: '',
      employee_email: '',
      employee_phone: '',
      employee_position_id: '',
      employee_hire_date: '',
      employee_gender: '',
      employee_schedule: '',
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
    reset();
  }, [isOpen, reset]);

  // Motion variants copied from LaborEventModal for parity
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 30 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 250 } },
    exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } }
  };

  const onFormSubmit = async (data: any) => {
    const validated = data as EmployeeSchemaType;
    await onSubmit(validated);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
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
              className="pointer-events-auto w-full max-w-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#F9F1DC] rounded-xl shadow-2xl border border-[#E0D6B7] overflow-hidden">
                <div className="bg-[#6F7153] px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Añadir empleado</h2>
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
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Primer nombre *</label>
                        <input {...register('employee_first_name')} className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                        {errors.employee_first_name && <p className="mt-1 text-sm text-red-600">{String(errors.employee_first_name?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Segundo nombre</label>
                        <input {...register('employee_middle_name')} className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Apellidos *</label>
                        <input {...register('employee_last_name')} className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                        {errors.employee_last_name && <p className="mt-1 text-sm text-red-600">{String(errors.employee_last_name?.message)}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Cédula de identidad *</label>
                        <input {...register('employee_national_id')} placeholder="1-2345-6789" className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                        {errors.employee_national_id && <p className="mt-1 text-sm text-red-600">{String(errors.employee_national_id?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Código de la CCSS</label>
                        <input {...register('employee_social_code')} placeholder="123456789012" className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Correo electrónico *</label>
                        <input {...register('employee_email')} type="email" placeholder="juan.rodriguez@empresa.com" className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                        {errors.employee_email && <p className="mt-1 text-sm text-red-600">{String(errors.employee_email?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#5D4E37] mb-1">Número telefónico</label>
                        <input {...register('employee_phone')} placeholder="8888-1234" className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4E37] mb-1">Posición *</label>
                      <select
                        {...register('employee_position_id')}
                        disabled={positionsLoading}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]"
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
                      <label className="block text-sm font-medium text-[#5D4E37] mb-1">Fecha de contratación</label>
                      <input {...register('employee_hire_date')} type="date" className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4E37] mb-2">Género</label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Masculino" className="mr-2" />
                          <span className="text-[#5D4E37]">Masculino</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Femenino" className="mr-2" />
                          <span className="text-[#5D4E37]">Femenino</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Otro" className="mr-2" />
                          <span className="text-[#5D4E37]">Otro</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5D4E37] mb-1">Horario</label>
                      <select {...register('employee_schedule')} className="w-full px-3 py-2 border border-[#D2B48C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white text-[#3B4D36]">
                        <option value="Horario Diurno">Horario Diurno</option>
                        <option value="Horario Nocturno">Horario Nocturno</option>
                        <option value="Horario Mixto">Horario Mixto</option>
                        <option value="Medio Tiempo">Medio Tiempo</option>
                      </select>
                    </div>

                    <div className="border-t border-[#E0D6B7] p-6 bg-[#F5F1E8] rounded-b-xl">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-3 text-[#3B4D36] border border-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-all duration-200 font-medium">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-all duration-200 font-medium">
                          {isSubmitting ? 'Guardando...' : 'Guardar empleado'}
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

export default AddEmployeeModal;
