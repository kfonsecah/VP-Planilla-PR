"use client";

import React, { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { VacationsService, Vacation } from '@/services/vacationsService';
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VacationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVacation = async () => {
      try {
        setLoading(true);
        const data = await VacationsService.getById(parseInt(id));
        setVacation(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar vacación');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVacation();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (status === 'approved' || paid) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
          <CheckCircleIcon className="w-4 h-4" />
          Aprobado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
          <XCircleIcon className="w-4 h-4" />
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">
        <ClockIcon className="w-4 h-4" />
        Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] dark:from-[#121212] via-[#F9F1DC] dark:via-[#1a1a1a] to-[#E7DCC1] dark:to-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-[#E7DCC1] dark:border-gray-700 border-t-[#6F7153] mx-auto mb-4"></div>
          <p className="text-[#5D4E37] dark:text-gray-300 font-medium text-lg">Cargando detalle de vacación...</p>
        </div>
      </div>
    );
  }

  if (error || !vacation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] dark:from-[#121212] via-[#F9F1DC] dark:via-[#1a1a1a] to-[#E7DCC1] dark:to-[#121212]">
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-2xl p-8 text-center shadow-lg">
            <p className="text-2xl font-bold mb-3">⚠️ Error</p>
            <p className="text-lg mb-6">{error || 'No se pudo cargar la información de la vacación'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] dark:from-[#121212] via-[#F9F1DC] dark:via-[#1a1a1a] to-[#E7DCC1] dark:to-[#121212]">
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#6F7153] dark:text-gray-400 hover:text-[#5D614A] dark:hover:text-gray-300 transition-colors mb-4 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </button>
          <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <CalendarDaysIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Detalle de Vacación #{vacation.id}
                  </h1>
                  <p className="text-white/80 mt-1">
                    Información completa de la solicitud de vacaciones
                  </p>
                </div>
              </div>
              {getStatusBadge(vacation.status, vacation.paid)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#6F7153] to-[#3B4D36] rounded-xl shadow-md">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#3B4D36] dark:text-white">Información de Vacaciones</h2>
            </div>

            <div className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-6 border-2 border-[#E0D6B7] dark:border-gray-700">
                  <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-2">Fecha de Inicio</p>
                  <p className="text-lg font-bold text-[#3B4D36] dark:text-white">
                    {formatDate(vacation.start_date)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-6 border-2 border-[#E0D6B7] dark:border-gray-700">
                  <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-2">Fecha de Fin</p>
                  <p className="text-lg font-bold text-[#3B4D36] dark:text-white">
                    {formatDate(vacation.end_date)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gradient-to-br from-[#6F7153] to-[#3B4D36] rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/80 font-medium mb-2">Duración Total</p>
                    <p className="text-4xl font-bold text-white">
                      {vacation.total_days || calculateDays(vacation.start_date, vacation.end_date)} días
                    </p>
                  </div>
                  <ClockIcon className="w-16 h-16 text-white/30" />
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-6 border-2 border-[#E0D6B7] dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-2">Estado de Pago</p>
                    <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">
                      {vacation.paid ? 'Pagado' : 'No Pagado'}
                    </p>
                  </div>
                  <CurrencyDollarIcon 
                    className={`w-12 h-12 ${vacation.paid ? 'text-green-500' : 'text-gray-400'}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Employee and Additional Info */}
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#6F7153] to-[#3B4D36] rounded-xl">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white">Empleado</h3>
              </div>
              <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-5 border-2 border-[#E0D6B7] dark:border-gray-700">
                <p className="text-sm text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">ID del Empleado</p>
                <p className="text-3xl font-bold text-[#3B4D36] dark:text-white">#{vacation.employee_id}</p>
              </div>
            </div>

            {/* Metadata */}
            {vacation.created_at && (
              <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white mb-5">Información Adicional</h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-4 border-2 border-[#E0D6B7] dark:border-gray-700">
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Fecha de Creación</p>
                    <p className="text-sm font-bold text-[#3B4D36] dark:text-white">
                      {formatDate(vacation.created_at)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F9F1DC] to-[#E7DCC1] dark:from-[#2a2a2a] dark:to-[#1e1e1e] rounded-xl p-4 border-2 border-[#E0D6B7] dark:border-gray-700">
                    <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Estado</p>
                    <p className="text-sm font-bold text-[#3B4D36] dark:text-white">
                      {vacation.status || 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-[#3B4D36] dark:text-white mb-5">Acciones</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/pages/vacations/edit/${vacation.id}`)}
                  className="w-full px-5 py-3 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Editar Vacación
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full px-5 py-3 bg-[#E7DCC1] dark:bg-gray-700 text-[#3B4D36] dark:text-white rounded-xl hover:bg-[#D2C9AE] dark:hover:bg-gray-600 transition-all font-medium"
                >
                  Volver a la Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
