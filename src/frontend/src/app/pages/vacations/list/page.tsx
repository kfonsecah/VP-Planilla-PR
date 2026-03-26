"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useVacations } from '@/hooks/useVacations';
import { Vacation } from '@/services/vacationsService';
import { useModal } from '@/hooks/useModal';
import {
  CalendarDaysIcon,
  PlusCircleIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function VacationsListPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch, remove } = useVacations();
  const modal = useModal();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Vacation | null>(null);

  const openDelete = (v: Vacation) => { setToDelete(v); setConfirmOpen(true); };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      modal.showSuccess('Eliminado', 'Vacación eliminada correctamente');
      refetch();
    } catch (err: unknown) {
      modal.showError('Error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <CheckCircleIcon className="w-3 h-3" />
          Aprobado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <XCircleIcon className="w-3 h-3" />
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
        <ClockIcon className="w-3 h-3" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1] dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <CalendarDaysIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Solicitudes de Vacaciones</h1>
                <p className="text-white/80 dark:text-gray-300 mt-1">
                  Gestiona todas las solicitudes de vacaciones
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 border border-white/20"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Recargar'}
              </button>
              <button
                onClick={() => router.push('/pages/vacations/create')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#3B4D36] rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Nueva Solicitud
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="font-semibold">Error al cargar</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37] dark:text-gray-300 font-medium">Cargando solicitudes...</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((vacation) => (
              <div
                key={vacation.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-[#E0D6B7] dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#6F7153] to-[#3B4D36] dark:from-gray-600 dark:to-gray-700 rounded-xl shadow-md">
                        <CalendarDaysIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#3B4D36] dark:text-white">
                          Solicitud #{vacation.id}
                        </h3>
                        <p className="text-sm text-[#6B5B3D] dark:text-gray-400 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-[#6F7153] rounded-full"></span>
                          Empleado #{vacation.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 ml-18">
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Fecha Inicio</p>
                        <p className="text-sm font-semibold text-[#3B4D36] dark:text-white">
                          {formatDate(vacation.start_date)}
                        </p>
                      </div>
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Fecha Fin</p>
                        <p className="text-sm font-semibold text-[#3B4D36] dark:text-white">
                          {formatDate(vacation.end_date)}
                        </p>
                      </div>
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Días Totales</p>
                        <p className="text-sm font-semibold text-[#3B4D36] dark:text-white">
                          {vacation.total_days || calculateDays(vacation.start_date, vacation.end_date)} días
                        </p>
                      </div>
                      <div className="bg-[#F9F1DC] dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium mb-1">Estado</p>
                        <div className="mt-1">
                          {getStatusBadge(vacation.status, vacation.paid)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/pages/vacations/${vacation.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => openDelete(vacation)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-[#E0D6B7] dark:border-gray-700 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#F9F1DC] dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-inner">
                <CalendarDaysIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] dark:text-white mb-3">
              No hay solicitudes de vacaciones
            </h3>
            <p className="text-[#6B5B3D] dark:text-gray-400 mb-8 max-w-md mx-auto">
              Comienza creando la primera solicitud de vacaciones para tus empleados
            </p>
            <button
              onClick={() => router.push('/pages/vacations/create')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] text-white rounded-xl hover:shadow-xl transition-all font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Crear Primera Solicitud
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar solicitud"
        description={`¿Estás seguro de que deseas eliminar la solicitud #${toDelete?.id}? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
