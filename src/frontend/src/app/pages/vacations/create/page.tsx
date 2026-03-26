"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVacations } from '@/hooks/useVacations';
import { getEmployees } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { useModal } from '@/hooks/useModal';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function CreateVacationPage() {
  const router = useRouter();
  const { create } = useVacations();
  const modal = useModal();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    paid: false,
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const days = calculateDays(formData.start_date, formData.end_date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id) {
      modal.showError('Error', 'Debes seleccionar un empleado');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      modal.showError('Error', 'Debes seleccionar las fechas de inicio y fin');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      modal.showError('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employee_id: parseInt(formData.employee_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: days,
        paid: formData.paid,
        status: 'pending',
      };

      await create(payload);
      modal.showSuccess('Éxito', 'Solicitud de vacaciones creada correctamente');
      setTimeout(() => {
        router.push('/pages/vacations/list');
      }, 1500);
    } catch (error: unknown) {
      modal.showError('Error', error instanceof Error ? error.message : 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#6F7153] hover:text-[#5D614A] transition-colors mb-4 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </button>
          <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nueva Solicitud de Vacaciones</h1>
                <p className="text-white/80 mt-1">
                  Completa los datos para crear una nueva solicitud
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-8">
              <div className="space-y-6">
                {/* Empleado */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#3B4D36] dark:text-white mb-2">
                    <UserIcon className="w-5 h-5 text-[#6F7153]" />
                    Empleado
                  </label>
                  {loadingEmployees ? (
                    <div className="flex items-center gap-2 p-4 bg-[#F9F1DC] dark:bg-gray-700 rounded-xl">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153]"></div>
                      <span className="text-sm text-[#6B5B3D] dark:text-gray-400">Cargando empleados...</span>
                    </div>
                  ) : (
                    <select
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#F9F1DC] dark:bg-gray-700 border-2 border-[#E0D6B7] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent text-[#3B4D36] dark:text-white transition-all"
                    >
                      <option value="">Selecciona un empleado</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.last_name} {emp.middle_name || ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#3B4D36] dark:text-white mb-2">
                      <CalendarDaysIcon className="w-5 h-5 text-[#6F7153]" />
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-[#F9F1DC] dark:bg-gray-700 border-2 border-[#E0D6B7] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent text-[#3B4D36] dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#3B4D36] dark:text-white mb-2">
                      <CalendarDaysIcon className="w-5 h-5 text-[#6F7153]" />
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date}
                      className="w-full px-4 py-3 bg-[#F9F1DC] dark:bg-gray-700 border-2 border-[#E0D6B7] dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent text-[#3B4D36] dark:text-white transition-all"
                    />
                  </div>
                </div>

                {/* Estado de Pago */}
                <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-xl p-4 border-2 border-[#E0D6B7] dark:border-gray-600">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="paid"
                      checked={formData.paid}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#6F7153] border-2 border-[#E0D6B7] dark:border-gray-500 rounded focus:ring-2 focus:ring-[#6F7153] transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-[#6F7153]" />
                      <span className="text-sm font-semibold text-[#3B4D36] dark:text-white">
                        Marcar como pagado
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mt-2 ml-8">
                    Indica si las vacaciones ya fueron pagadas al empleado
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-8 pt-6 border-t-2 border-[#E0D6B7] dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[#E7DCC1] dark:bg-gray-700 text-[#3B4D36] dark:text-white rounded-xl hover:bg-[#D2C9AE] dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creando...
                    </>
                  ) : (
                    'Crear Solicitud'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Panel lateral - Resumen */}
          <div className="space-y-6">
            {/* Resumen de días */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-[#6F7153] to-[#3B4D36] dark:from-gray-600 dark:to-gray-700 p-3 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#3B4D36] dark:text-white">Duración</h3>
              </div>
              <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 text-center">
                <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mb-2">Días Totales</p>
                <p className="text-5xl font-bold text-[#6F7153]">{days}</p>
                <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mt-2">
                  {days === 1 ? 'día' : 'días'} de vacaciones
                </p>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-[#3B4D36] dark:text-white mb-4">Información</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#F9F1DC] dark:bg-gray-700 rounded-lg">
                  <div className="text-xl">📅</div>
                  <div>
                    <p className="text-xs font-semibold text-[#3B4D36] dark:text-white">Periodo</p>
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mt-1">
                      Las fechas incluyen tanto el día de inicio como el de fin
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#F9F1DC] dark:bg-gray-700 rounded-lg">
                  <div className="text-xl">💰</div>
                  <div>
                    <p className="text-xs font-semibold text-[#3B4D36] dark:text-white">Estado de Pago</p>
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mt-1">
                      Puedes marcar si las vacaciones ya fueron pagadas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#F9F1DC] dark:bg-gray-700 rounded-lg">
                  <div className="text-xl">✅</div>
                  <div>
                    <p className="text-xs font-semibold text-[#3B4D36] dark:text-white">Aprobación</p>
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 mt-1">
                      La solicitud quedará pendiente de aprobación
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
