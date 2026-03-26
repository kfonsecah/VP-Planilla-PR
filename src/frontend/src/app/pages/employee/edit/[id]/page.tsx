"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEmployeeEdit } from '@/hooks/useEmployeeEdit';
import { employeeSchema, EmployeeSchemaType, EmployeeSchemaInputType } from '@/schemas/employee';
import { usePositions } from '@/hooks/usePositions';

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página de edición de empleado individual
 * Permite actualizar todos los datos de un empleado existente
 */
export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { employee, isLoading, error, update } = useEmployeeEdit(id);
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const positionOptions = (positions || []).map((position) => ({
    id: String(position.id),
    name: position.name || 'Sin nombre',
    salary: typeof position.base_salary === 'number' ? position.base_salary : Number(position.base_salary) || 0
  }));

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (employee) {
      reset({
        employee_first_name: employee.name || '',
        employee_middle_name: employee.middle_name || '',
        employee_last_name: employee.last_name || '',
        employee_national_id: employee.national_id || '',
        employee_social_code: employee.social_code || '',
        employee_email: employee.email || '',
        employee_phone: employee.phone || '',
        employee_position_id: String(employee.position_id || ''),
        employee_hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
        employee_gender: employee.gender || '',
        employee_schedule: employee.schedule || 'Horario Diurno',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeSchemaType) => {
    setUpdateSuccess(false);
    setUpdateError(null);

    try {
      const updates = {
        name: data.employee_first_name,
        middle_name: data.employee_middle_name || undefined,
        last_name: data.employee_last_name,
        national_id: data.employee_national_id || null,
        social_code: data.employee_social_code || null,
        email: data.employee_email,
        phone: data.employee_phone || null,
        position_id: data.employee_position_id ? parseInt(data.employee_position_id) : null,
        hire_date: data.employee_hire_date || undefined,
        gender: data.employee_gender || null,
        schedule: data.employee_schedule || null,
      };

      await update(updates);
      setUpdateSuccess(true);
      
      setTimeout(() => {
        router.push('/pages/employee/list');
      }, 2000);
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Error al actualizar empleado');
      console.error('Error updating employee:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto"></div>
          <p className="mt-4 text-[#3B4D36] dark:text-gray-300">Cargando empleado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-600 dark:text-red-400 text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push('/pages/employee/list')}
              className="mt-4 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/pages/employee/list')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white rounded-lg hover:bg-[#F5F1E8] dark:hover:bg-[#333333] transition-colors border border-[#D2B48C] dark:border-gray-700"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver
            </button>
            <h1 className="text-2xl font-semibold text-[#3B4D36] dark:text-white">
              Editar Empleado
            </h1>
          </div>
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg"
          >
            ✓ Empleado actualizado correctamente. Redirigiendo...
          </motion.div>
        )}

        {/* Error Message */}
        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg"
          >
            ✗ {updateError}
          </motion.div>
        )}

        {/* Formulario */}
        <div className="bg-[#F9F1DC] dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 overflow-hidden">
          <div className="bg-[#6F7153] px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Información del Empleado
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nombres */}
              <div>
                <h3 className="text-lg font-medium text-[#3B4D36] dark:text-white mb-3 border-b border-[#D2B48C] dark:border-gray-700 pb-2">
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Primer nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_first_name')}
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                    {errors.employee_first_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_first_name?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Segundo nombre
                    </label>
                    <input
                      {...register('employee_middle_name')}
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_last_name')}
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                    {errors.employee_last_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_last_name?.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Identificación */}
              <div>
                <h3 className="text-lg font-medium text-[#3B4D36] dark:text-white mb-3 border-b border-[#D2B48C] dark:border-gray-700 pb-2">
                  Identificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Cédula de identidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_national_id')}
                      placeholder="1-2345-6789"
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                    {errors.employee_national_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_national_id?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Código de la CCSS
                    </label>
                    <input
                      {...register('employee_social_code')}
                      placeholder="123456789012"
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-medium text-[#3B4D36] dark:text-white mb-3 border-b border-[#D2B48C] dark:border-gray-700 pb-2">
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_email')}
                      type="email"
                      placeholder="juan.rodriguez@empresa.com"
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                    {errors.employee_email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_email?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Número telefónico
                    </label>
                    <input
                      {...register('employee_phone')}
                      placeholder="8888-1234"
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h3 className="text-lg font-medium text-[#3B4D36] dark:text-white mb-3 border-b border-[#D2B48C] dark:border-gray-700 pb-2">
                  Información Laboral
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Posición <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('employee_position_id')}
                      disabled={positionsLoading}
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    >
                      <option value="">{positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}</option>
                      {positionOptions.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.name} - ₡{position.salary.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {errors.employee_position_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_position_id?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Fecha de contratación
                    </label>
                    <input
                      {...register('employee_hire_date')}
                      type="date"
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-1">
                      Horario
                    </label>
                    <select
                      {...register('employee_schedule')}
                      className="w-full px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-[#2a2a2a] text-[#3B4D36] dark:text-white"
                    >
                      <option value="Horario Diurno">Horario Diurno</option>
                      <option value="Horario Nocturno">Horario Nocturno</option>
                      <option value="Horario Mixto">Horario Mixto</option>
                      <option value="Medio Tiempo">Medio Tiempo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5D4E37] dark:text-gray-300 mb-2">
                      Género
                    </label>
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          {...register('employee_gender')}
                          type="radio"
                          value="Masculino"
                          className="mr-2"
                        />
                        <span className="text-[#5D4E37] dark:text-gray-300">Masculino</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          {...register('employee_gender')}
                          type="radio"
                          value="Femenino"
                          className="mr-2"
                        />
                        <span className="text-[#5D4E37] dark:text-gray-300">Femenino</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          {...register('employee_gender')}
                          type="radio"
                          value="Otro"
                          className="mr-2"
                        />
                        <span className="text-[#5D4E37] dark:text-gray-300">Otro</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="border-t border-[#E0D6B7] dark:border-gray-700 pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/pages/employee/list')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 text-[#3B4D36] dark:text-white border border-[#3B4D36] dark:border-gray-600 rounded-lg hover:bg-[#E7DCC1] dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
