"use client";

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useEmployeeEdit } from '@/hooks/useEmployeeEdit';
import { employeeSchema, EmployeeSchemaType, EmployeeSchemaInputType } from '@/schemas/employee';
import { usePositions } from '@/hooks/usePositions';
import { Select, SelectItem } from '@/components/ui/Select';

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

const EMPLOYEE_LIST_PATH = '/pages/employee/list';

/**
 * Página de edición de empleado individual
 * Permite actualizar todos los datos de un empleado existente
 */
export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { employee, isLoading, error, update } = useEmployeeEdit(id);
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const positionOptions = (positions || []).map((position) => ({
    id: String(position.id),
    name: position.name || 'Sin nombre',
    salary: typeof position.base_salary === 'number' ? position.base_salary : Number(position.base_salary) || 0
  }));

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (employee) {
      const positionIdValue = employee.position_id != null ? String(employee.position_id) : '';
      console.log('[DEBUG] EditEmployeePage - reset employee_position_id:', {
        name: employee.name,
        position_id: employee.position_id,
        positionIdValue: positionIdValue,
        typeof_position_id: typeof employee.position_id,
        positionsLoaded: !!positions,
        positionsCount: positions?.length,
        positionOptionsLength: positionOptions.length
      });
      reset({
        employee_first_name: employee.name || '',
        employee_middle_name: employee.middle_name || '',
        employee_last_name: employee.last_name || '',
        employee_national_id: employee.national_id || '',
        employee_social_code: employee.social_code || '',
        employee_email: employee.email || '',
        employee_phone: employee.phone || '',
        employee_position_id: positionIdValue,
        employee_hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
        employee_gender: employee.gender || '',
        employee_schedule: employee.schedule || 'Horario Diurno',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, reset, positions]);

  const onSubmit = async (data: EmployeeSchemaType) => {
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
      toast.success('Empleado actualizado correctamente');
      setTimeout(() => {
        router.push(EMPLOYEE_LIST_PATH);
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar empleado');
      console.error('Error updating employee:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Form skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-green-700 px-6 py-4">
              <div className="h-6 w-48 bg-green-600 rounded animate-pulse" />
            </div>

            <div className="p-6 space-y-6">
              {/* Datos Personales */}
              <div>
                <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Identificación */}
              <div>
                <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacto */}
              <div>
                <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex gap-3">
                <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(EMPLOYEE_LIST_PATH)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg hover:bg-[#F5F1E8] dark:hover:bg-[#333333] transition-colors border border-zinc-300 dark:border-zinc-700"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Volver
              </button>
            </div>
          </div>
          <div className="overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos del empleado</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => router.push(EMPLOYEE_LIST_PATH)}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  Volver a la lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(EMPLOYEE_LIST_PATH)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg hover:bg-[#F5F1E8] dark:hover:bg-[#333333] transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver
            </button>
            <h1 className="text-2xl font-semibold text-zinc-700 dark:text-white">
              Editar Empleado
            </h1>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-green-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Información del Empleado
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nombres */}
              <div>
                <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-100 mb-3 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Primer nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_first_name')}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                    />
                    {errors.employee_first_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_first_name?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Segundo nombre
                    </label>
                    <input
                      {...register('employee_middle_name')}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_last_name')}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
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
                <h3 className="text-lg font-medium text-zinc-700 dark:text-white mb-3 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                  Identificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Cédula de identidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_national_id')}
                      placeholder="1-2345-6789"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                    {errors.employee_national_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_national_id?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Código de la CCSS
                    </label>
                    <input
                      {...register('employee_social_code')}
                      placeholder="123456789012"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-medium text-zinc-700 dark:text-white mb-3 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employee_email')}
                      type="email"
                      placeholder="juan.rodriguez@empresa.com"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                    {errors.employee_email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_email?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Número telefónico
                    </label>
                    <input
                      {...register('employee_phone')}
                      placeholder="8888-1234"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h3 className="text-lg font-medium text-zinc-700 dark:text-white mb-3 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                  Información Laboral
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Posición <span className="text-red-500">*</span>
                    </label>
<Controller
                      name="employee_position_id"
                      control={control}
                      render={({ field }) => {
                        const selectedPosition = positionOptions.find(p => String(p.id) === String(field.value));
                        const displayLabel = selectedPosition?.name || (field.value ? `Posición ID: ${field.value}` : '');
                        
                        // DEBUG: Log what Controller actually receives
                        console.log('[DEBUG] Select Controller render:', {
                          fieldValue: field.value,
                          fieldValueType: typeof field.value,
                          selectedPosition: selectedPosition?.name,
                          displayLabel: displayLabel,
                          positionOptionsLength: positionOptions.length,
                          positionsLoaded: !!positions
                        });
                        
                        return (
                          <Select
                            value={field.value || ''}
                            selectedLabel={displayLabel}
                            onValueChange={field.onChange}
                            disabled={positionsLoading}
                            placeholder={positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}
                            className="border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                          >
                            {positionOptions.map((position) => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.name} - ₡{position.salary.toLocaleString()}
                              </SelectItem>
                            ))}
                          </Select>
                        );
                      }}
                    />
                    {errors.employee_position_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {String(errors.employee_position_id?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Fecha de contratación
                    </label>
                    <input
                      {...register('employee_hire_date')}
                      type="date"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B5AF9A] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Horario
                    </label>
                    <Controller
                      name="employee_schedule"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar horario"
                          className="border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-white"
                        >
                          <SelectItem value="Horario Diurno">Horario Diurno</SelectItem>
                          <SelectItem value="Horario Nocturno">Horario Nocturno</SelectItem>
                          <SelectItem value="Horario Mixto">Horario Mixto</SelectItem>
                          <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-2">
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
                        <span className="text-zinc-600 dark:text-zinc-300">Masculino</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          {...register('employee_gender')}
                          type="radio"
                          value="Femenino"
                          className="mr-2"
                        />
                        <span className="text-zinc-600 dark:text-zinc-300">Femenino</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          {...register('employee_gender')}
                          type="radio"
                          value="Otro"
                          className="mr-2"
                        />
                        <span className="text-zinc-600 dark:text-zinc-300">Otro</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(EMPLOYEE_LIST_PATH)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 text-zinc-700 dark:text-white border border-[#3B4D36] dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all duration-200 font-medium disabled:opacity-50"
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
