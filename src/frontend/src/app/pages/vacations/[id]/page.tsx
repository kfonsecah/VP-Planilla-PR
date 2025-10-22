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
      } catch (err: any) {
        setError(err.message || 'Error al cargar vacación');
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

  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (status === 'approved' || paid) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="w-4 h-4" />
          Aprobado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
          <XCircleIcon className="w-4 h-4" />
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="w-4 h-4" />
        Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E7DCC1] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
          <p className="text-[#5D4E37]">Cargando detalle de vacación...</p>
        </div>
      </div>
    );
  }

  if (error || !vacation) {
    return (
      <div className="min-h-screen bg-[#E7DCC1]">
        <div className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-6 text-center">
            <p className="text-lg font-medium mb-2">⚠️ Error</p>
            <p>{error || 'No se pudo cargar la información de la vacación'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#6F7153] hover:text-[#5D614A] transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#3B4D36]">
                Detalle de Vacación #{vacation.id}
              </h1>
              <p className="text-sm text-[#6B5B3D] mt-1">
                Información completa de la solicitud de vacaciones
              </p>
            </div>
            {getStatusBadge(vacation.status, vacation.paid)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information Card */}
          <div className="lg:col-span-2 bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-[#6F7153] rounded-lg">
                <CalendarDaysIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[#3B4D36]">Información de Vacaciones</h2>
            </div>

            <div className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#E0D6B7]">
                  <p className="text-xs text-[#6B5B3D] mb-1">Fecha de Inicio</p>
                  <p className="text-lg font-semibold text-[#3B4D36]">
                    {formatDate(vacation.start_date)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E0D6B7]">
                  <p className="text-xs text-[#6B5B3D] mb-1">Fecha de Fin</p>
                  <p className="text-lg font-semibold text-[#3B4D36]">
                    {formatDate(vacation.end_date)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-lg p-4 border border-[#E0D6B7]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B5B3D] mb-1">Duración Total</p>
                    <p className="text-2xl font-bold text-[#6F7153]">
                      {vacation.days} días
                    </p>
                  </div>
                  <ClockIcon className="w-12 h-12 text-[#D2B48C]" />
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-lg p-4 border border-[#E0D6B7]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B5B3D] mb-1">Estado de Pago</p>
                    <p className="text-lg font-semibold text-[#3B4D36]">
                      {vacation.paid ? 'Pagado' : 'No Pagado'}
                    </p>
                  </div>
                  <CurrencyDollarIcon 
                    className={`w-10 h-10 ${vacation.paid ? 'text-green-500' : 'text-gray-400'}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Employee and Additional Info */}
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#6F7153] rounded-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#3B4D36]">Empleado</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border border-[#E0D6B7]">
                <p className="text-sm text-[#6B5B3D]">ID del Empleado</p>
                <p className="text-xl font-semibold text-[#3B4D36]">#{vacation.employee_id}</p>
              </div>
            </div>

            {/* Metadata */}
            {vacation.created_at && (
              <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
                <h3 className="text-lg font-semibold text-[#3B4D36] mb-4">Información Adicional</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-[#E0D6B7]">
                    <p className="text-xs text-[#6B5B3D]">Fecha de Creación</p>
                    <p className="text-sm font-medium text-[#3B4D36]">
                      {formatDate(vacation.created_at)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#E0D6B7]">
                    <p className="text-xs text-[#6B5B3D]">Estado</p>
                    <p className="text-sm font-medium text-[#3B4D36]">
                      {vacation.status || 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
              <h3 className="text-lg font-semibold text-[#3B4D36] mb-4">Acciones</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/pages/vacations/edit/${vacation.id}`)}
                  className="w-full px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
                >
                  Editar Vacación
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors"
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
