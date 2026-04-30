'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { employeeSchema, EmployeeSchemaType, EmployeeSchemaInputType } from '@/schemas/employee';
import { Position } from '@/services/positionsService';
import { Select, SelectItem } from '@/components/ui/Select';
import { ClockAliasService } from '@/services/clockAliasService';

// Lazy-load framer-motion animation primitives
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeSchemaType) => Promise<{ id: string | number } | void> | void;
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

  const { register, control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EmployeeSchemaInputType, unknown, EmployeeSchemaType>({
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
      employee_required_hours_biweekly: '',
      shift_type: 'USE_ENTERPRISE_DEFAULT',
    }
  });

  const [pendingAliases, setPendingAliases] = useState<string[]>([]);
  const [newPendingAlias, setNewPendingAlias] = useState('');
  const [aliasError, setAliasError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
    reset();
    setPendingAliases([]);
    setNewPendingAlias('');
    setAliasError('');
  }, [isOpen, reset]);

  const handleAddPending = useCallback(() => {
    const trimmed = newPendingAlias.trim();
    if (!trimmed) return;
    if (pendingAliases.includes(trimmed)) {
      setAliasError('Este alias ya está en la lista');
      return;
    }
    setPendingAliases((prev) => [...prev, trimmed]);
    setNewPendingAlias('');
    setAliasError('');
  }, [newPendingAlias, pendingAliases]);

  const handleRemovePending = useCallback((alias: string) => {
    setPendingAliases((prev) => prev.filter((a) => a !== alias));
  }, []);

  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 30 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 250 } },
    exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } }
  };

  const onFormSubmit = async (data: EmployeeSchemaType) => {
    const result = await onSubmit(data);
    if (result?.id && pendingAliases.length > 0) {
      await Promise.allSettled(
        pendingAliases.map((name) => ClockAliasService.createAlias(result.id, name))
      );
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <MotionDiv
            className="fixed inset-0 bg-black/50 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <MotionDiv
              ref={modalRef}
              className="pointer-events-auto w-full max-w-2xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-green-600 dark:bg-zinc-800 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white dark:text-zinc-100">Añadir empleado</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 hover:bg-white/10 dark:hover:bg-zinc-700 rounded-full"
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
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Primer nombre *</label>
                        <input {...register('employee_first_name')} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                        {errors.employee_first_name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.employee_first_name?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Segundo nombre</label>
                        <input {...register('employee_middle_name')} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Apellidos *</label>
                        <input {...register('employee_last_name')} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                        {errors.employee_last_name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.employee_last_name?.message)}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cédula de identidad *</label>
                        <input {...register('employee_national_id')} placeholder="1-2345-6789" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                        {errors.employee_national_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.employee_national_id?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Código de la CCSS</label>
                        <input {...register('employee_social_code')} placeholder="123456789012" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Correo electrónico *</label>
                        <input {...register('employee_email')} type="email" placeholder="juan.rodriguez@empresa.com" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                        {errors.employee_email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.employee_email?.message)}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Número telefónico</label>
                        <input {...register('employee_phone')} placeholder="8888-1234" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Posición *</label>
<Controller
                          name="employee_position_id"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value || ''}
                              selectedLabel={positionOptions.find(p => String(p.id) === String(field.value))?.name}
                              onValueChange={field.onChange}
                              disabled={positionsLoading}
                              placeholder={positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}
                              className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                            >
                            {positionOptions.map((position) => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.name} - ₡{position.salary.toLocaleString()} | HExtra: ₡{(position.salary * 1.5).toLocaleString()}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.employee_position_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.employee_position_id?.message)}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fecha de contratación</label>
                      <input {...register('employee_hire_date')} type="date" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Género</label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Masculino" className="mr-2 accent-green-600" />
                          <span className="text-zinc-700 dark:text-zinc-300">Masculino</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Femenino" className="mr-2 accent-green-600" />
                          <span className="text-zinc-700 dark:text-zinc-300">Femenino</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input {...register('employee_gender')} type="radio" value="Otro" className="mr-2 accent-green-600" />
                          <span className="text-zinc-700 dark:text-zinc-300">Otro</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Horas requeridas por quincena</label>
                      <input 
                        {...register('employee_required_hours_biweekly')} 
                        type="number"
                        step="0.01"
                        min="0"
                        max="999.99"
                        placeholder="104.00" 
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" 
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Ejemplo: 104 horas para medio tiempo, 208 para tiempo completo</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jornada de trabajo</label>
                      <Controller
                        name="shift_type"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || 'USE_ENTERPRISE_DEFAULT'}
                            selectedLabel={
                              field.value === 'DIURNA' ? 'Jornada diurna (8h/día)' :
                              field.value === 'MIXTA' ? 'Jornada mixta (7h/día)' :
                              field.value === 'NOCTURNA' ? 'Jornada nocturna (6h/día)' :
                              'Default de empresa'
                            }
                            onValueChange={field.onChange}
                            className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                          >
                            <SelectItem value="USE_ENTERPRISE_DEFAULT">Default de empresa</SelectItem>
                            <SelectItem value="DIURNA">Jornada diurna (8h/día)</SelectItem>
                            <SelectItem value="MIXTA">Jornada mixta (7h/día)</SelectItem>
                            <SelectItem value="NOCTURNA">Jornada nocturna (6h/día)</SelectItem>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                      <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-100 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                        Aliases de Reloj
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {pendingAliases.length === 0 ? (
                          <span className="text-sm text-zinc-500">Sin aliases configurados</span>
                        ) : (
                          pendingAliases.map((alias) => (
                            <span
                              key={alias}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm text-zinc-700 dark:text-zinc-300"
                            >
                              <span>{alias}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePending(alias)}
                                className="ml-1 text-zinc-400 hover:text-red-500 transition-colors"
                                aria-label={`Eliminar alias ${alias}`}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPendingAlias}
                          onChange={(e) => setNewPendingAlias(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPending();
                            }
                          }}
                          placeholder="Nuevo alias..."
                          className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddPending}
                          disabled={!newPendingAlias.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                      {aliasError && (
                        <p className="text-sm text-red-600 mt-2">{aliasError}</p>
                      )}
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-3 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 font-medium">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500 text-white rounded-lg transition-all duration-200 font-medium">
                          {isSubmitting ? 'Guardando...' : 'Guardar empleado'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddEmployeeModal;
