"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  PlusCircleIcon, 
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { usePayroll } from '@/hooks/usePayroll';
import { PayrollService } from '@/services/payrollService';
import { useModal } from '@/hooks/useModal';

export default function PayrollListPage() {
  const { getAllPayrolls, isLoading, error } = usePayroll();
  const modal = useModal();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadPayrolls = useCallback(async () => {
    try {
      const data = await getAllPayrolls();
      console.log('[PayrollList] data received:', data);
      if (Array.isArray(data)) {
        setPayrolls(data);
      } else {
        console.warn('[PayrollList] Expected array, got:', data);
        setPayrolls([]);
      }
    } catch (e) {
      console.error('Error loading payrolls:', e);
    }
  }, [getAllPayrolls]);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'CALCULADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <ChartBarIcon className="w-4 h-4" />
          Calculado
        </span>
      );
    }

    if (status === 'PAGADO' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          <CheckCircleIcon className="w-4 h-4" />
          Pagado
        </span>
      );
    }

    if (status === 'PENDIENTE' || status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
          <ClockIcon className="w-4 h-4" />
          Pendiente
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        <ClockIcon className="w-4 h-4" />
        {status || 'Sin estado'}
      </span>
    );
  };

  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  const getPayrollTypeName = (type: number | undefined) => {
    if (!type) return 'No especificado';
    const types: { [key: number]: string } = {
      1: 'Quincenal',
      2: 'Mensual',
      3: 'Semanal'
    };
    return types[type] || `Tipo ${type}`;
  };

  const markAsPaid = async (payrollId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    modal.showConfirmation(
      'Confirmar acción',
      '¿Estás seguro de marcar esta planilla como PAGADA?',
      async () => {
        setUpdatingId(payrollId);
        try {
          await PayrollService.updatePayroll(payrollId, { status: 'PAGADO' });
          await loadPayrolls();
          modal.showSuccess(
            'Actualización exitosa',
            'La planilla ha sido marcada como PAGADA'
          );
        } catch (err) {
          const message = (err as Error)?.message || 'Error al actualizar el estado';
          modal.showError(
            'Error',
            message
          );
        } finally {
          setUpdatingId(null);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7DCC1] via-[#F9F1DC] to-[#E7DCC1]">
      <div className="p-5 max-w-7xl mx-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#6F7153] to-[#3B4D36] rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-0.5">Historial de Planillas</h1>
                <p className="text-sm text-[#E7DCC1]">
                  Gestiona y consulta todas las planillas generadas
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={loadPayrolls}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm disabled:opacity-50 border border-white/30 text-sm font-medium"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Recargar
              </button>
              <Link
                href="/pages/payroll/calculate"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#3B4D36] rounded-xl hover:bg-[#E7DCC1] transition-all font-semibold shadow-lg text-sm"
              >
                <PlusCircleIcon className="w-4 h-4" />
                Nueva Planilla
              </Link>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-lg text-[#5D4E37] font-medium">Cargando planillas...</p>
          </div>
        )}

        {/* Lista de planillas en grid */}
        {!isLoading && payrolls.length > 0 && (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 border border-[#E0D6B7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B5B3D]">Total Planillas</p>
                    <p className="text-xl font-bold text-[#3B4D36]">{payrolls.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 border border-[#E0D6B7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B5B3D]">Pagadas</p>
                    <p className="text-xl font-bold text-[#3B4D36]">
                      {payrolls.filter(p => p.status === 'PAGADO').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 border border-[#E0D6B7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B5B3D]">Pendientes</p>
                    <p className="text-xl font-bold text-[#3B4D36]">
                      {payrolls.filter(p => p.status === 'PENDIENTE' || p.status === 'CALCULADO').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {payrolls.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-300"
                >
                  {/* Header de la tarjeta */}
                  <div className="bg-gradient-to-r from-[#E7DCC1] to-[#F9F1DC] px-5 py-3 border-b border-[#E0D6B7]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-[#6F7153] rounded-xl flex items-center justify-center shadow-md">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#3B4D36]">
                            Planilla #{p.id}
                          </h3>
                          <p className="text-xs text-[#6B5B3D]">
                            {getPayrollTypeName(p.payroll_type)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-4 space-y-3">
                    {/* Periodo */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-[#E7DCC1] rounded-lg flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-4 h-4 text-[#6F7153]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#6B5B3D] uppercase tracking-wide mb-0.5">
                          Periodo
                        </p>
                        <p className="text-sm font-bold text-[#3B4D36]">
                          {formatDate(p.period_start)} — {formatDate(p.period_end)}
                        </p>
                      </div>
                    </div>

                    {/* Fecha de pago */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-[#E7DCC1] rounded-lg flex items-center justify-center flex-shrink-0">
                        <CurrencyDollarIcon className="w-4 h-4 text-[#6F7153]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#6B5B3D] uppercase tracking-wide mb-0.5">
                          Fecha de Pago
                        </p>
                        <p className="text-sm font-bold text-[#3B4D36]">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <Link
                      href={`/pages/payroll/${p.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg mt-1 text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Ver Detalle
                    </Link>

                    {/* Botón marcar como pagada */}
                    <button
                      onClick={(e) => markAsPaid(p.id, e)}
                      disabled={updatingId === p.id || p.status === 'PAGADO'}
                      className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl transition-all font-semibold shadow-md disabled:cursor-not-allowed text-sm ${
                        p.status === 'PAGADO'
                          ? 'bg-gray-400 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white disabled:opacity-50'
                      }`}
                    >
                      {updatingId === p.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Actualizando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>{p.status === 'PAGADO' ? 'Ya Pagada' : 'Marcar como Pagada'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!isLoading && payrolls.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-[#E0D6B7] p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E7DCC1] to-[#D2B48C] rounded-2xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] mb-3">
              No hay planillas guardadas
            </h3>
            <p className="text-base text-[#6B5B3D] mb-8 max-w-md mx-auto">
              Comienza calculando tu primera planilla para ver el historial completo aquí
            </p>
            <Link
              href="/pages/payroll/calculate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6F7153] to-[#3B4D36] hover:from-[#5C5E44] hover:to-[#2D3A28] text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <PlusCircleIcon className="w-6 h-6" />
              Calcular Primera Planilla
            </Link>
          </div>
        )}
      </div>
      <modal.ModalComponent />
    </div>
  );
}
