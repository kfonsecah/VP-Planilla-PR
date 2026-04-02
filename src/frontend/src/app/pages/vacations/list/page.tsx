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
  ExclamationTriangleIcon,
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Recursos Humanos</p>
            <h1 className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">Solicitudes de Vacaciones</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              onClick={() => router.push('/pages/vacations/create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <div className="flex flex-col items-center">
                <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 ml-16">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                    <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((vacation) => (
              <div
                key={vacation.id}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-100">
                          Solicitud #{vacation.id}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Empleado #{vacation.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 ml-16">
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Fecha Inicio</p>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-100">
                          {formatDate(vacation.start_date)}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Fecha Fin</p>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-100">
                          {formatDate(vacation.end_date)}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Días Totales</p>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-100">
                          {vacation.total_days || calculateDays(vacation.start_date, vacation.end_date)} días
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-1">Estado</p>
                        <div className="mt-1">
                          {getStatusBadge(vacation.status, vacation.paid)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/pages/vacations/${vacation.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => openDelete(vacation)}
                      className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="w-10 h-10 text-zinc-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-100 mb-2">
              No hay solicitudes de vacaciones
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              Comienza creando la primera solicitud de vacaciones para tus empleados
            </p>
            <button
              onClick={() => router.push('/pages/vacations/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
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
