"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormModal from '@/components/ui/ConfirmDialog';
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
    } catch (err: any) {
      modal.showError('Error', err?.message || 'Error al eliminar');
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

  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (status === 'approved' || paid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="w-3 h-3" />
          Aprobado
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircleIcon className="w-3 h-3" />
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="w-3 h-3" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B4D36]">Solicitudes de Vacaciones</h1>
            <p className="text-sm text-[#6B5B3D] mt-1">
              Gestiona todas las solicitudes de vacaciones
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Cargando...' : 'Recargar'}
            </button>
            <button
              onClick={() => router.push('/pages/vacations/create')}
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6F7153] mx-auto mb-4"></div>
            <p className="text-[#5D4E37]">Cargando solicitudes...</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((vacation) => (
              <div
                key={vacation.id}
                className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 bg-[#6F7153] rounded-lg">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-[#3B4D36]">
                          Solicitud #{vacation.id}
                        </h3>
                        <p className="text-sm text-[#6B5B3D]">
                          Empleado #{vacation.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3 ml-13">
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Fecha Inicio</p>
                        <p className="text-sm font-medium text-[#3B4D36]">
                          {formatDate(vacation.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Fecha Fin</p>
                        <p className="text-sm font-medium text-[#3B4D36]">
                          {formatDate(vacation.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Días Totales</p>
                        <p className="text-sm font-medium text-[#3B4D36]">
                          {vacation.days} días
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B5B3D]">Estado</p>
                        <div className="mt-1">
                          {getStatusBadge(vacation.status, vacation.paid)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => router.push(`/pages/vacations/${vacation.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => openDelete(vacation)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#E7DCC1] rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="w-8 h-8 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#3B4D36] mb-2">
              No hay solicitudes de vacaciones
            </h3>
            <p className="text-sm text-[#6B5B3D] mb-6">
              Crea la primera solicitud para comenzar
            </p>
            <button
              onClick={() => router.push('/pages/vacations/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
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
