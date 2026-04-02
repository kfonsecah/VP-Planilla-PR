"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useVacations } from '@/hooks/useVacations';
import { getEmployees } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Select, SelectItem } from '@/components/ui/Select';

export default function CreateVacationPage() {
  const router = useRouter();
  const { create } = useVacations();

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
      toast.error('Debes seleccionar un empleado');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Debes seleccionar las fechas de inicio y fin');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
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
      toast.success('Solicitud de vacaciones creada correctamente');
      setTimeout(() => {
        router.push('/pages/vacations/list');
      }, 1500);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la solicitud');
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-4 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Recursos Humanos</p>
          <h1 className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">Nueva Solicitud de Vacaciones</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                    <UserIcon className="w-4 h-4 text-green-600" />
                    Empleado
                  </label>
                  {loadingEmployees ? (
                    <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-200 dark:border-zinc-700 border-t-green-600"></div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Cargando empleados...</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                      placeholder="Selecciona un empleado"
                      className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                    >
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name} {emp.last_name} {emp.middle_name || ''}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                      <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                      <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-700 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="paid"
                      checked={formData.paid}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 border-zinc-300 dark:border-zinc-600 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Marcar como pagado
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-7">
                    Indica si las vacaciones ya fueron pagadas al empleado
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creando...
                    </>
                  ) : (
                    'Crear Solicitud'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-2 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">Duración</h3>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 text-center border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-400 mb-2">Días Totales</p>
                <p className="text-4xl font-bold text-green-600">{days}</p>
                <p className="text-xs text-zinc-400 mt-2">
                  {days === 1 ? 'día' : 'días'} de vacaciones
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-100 mb-4">Información</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-lg">📅</div>
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Periodo</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Las fechas incluyen tanto el día de inicio como el de fin
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-lg">💰</div>
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Estado de Pago</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Puedes marcar si las vacaciones ya fueron pagadas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-lg">✅</div>
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Aprobación</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
