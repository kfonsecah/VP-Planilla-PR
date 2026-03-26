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
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { usePayroll } from '@/hooks/usePayroll';
import { PayrollService, Payroll } from '@/services/payrollService';
import { useModal } from '@/hooks/useModal';

export default function PayrollListPage() {
  const { getAllPayrolls, isLoading, error } = usePayroll();
  const modal = useModal();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D2B48C] dark:bg-amber-900/50 text-[#3B4D36] dark:text-amber-200 border border-[#C5A87A] dark:border-amber-700">
          <ChartBarIcon className="w-4 h-4" />
          Calculado
        </span>
      );
    }

    if (status === 'PAGADO' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6F7153] text-white border border-[#5D614A]">
          <CheckCircleIcon className="w-4 h-4" />
          Pagado
        </span>
      );
    }

    if (status === 'PENDIENTE' || status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E7DCC1] dark:bg-yellow-900/30 text-[#5D4E37] dark:text-yellow-200 border border-[#D2B48C] dark:border-yellow-700">
          <ClockIcon className="w-4 h-4" />
          Pendiente
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F1E8] dark:bg-gray-700 text-[#6B5B3D] dark:text-gray-300 border border-[#E0D6B7] dark:border-gray-600">
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
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-1">
              Gestión de Planillas
            </p>
            <h1 className="text-3xl font-bold text-[#3B4D36] dark:text-white leading-none">Historial de Planillas</h1>
            <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mt-2">
              Gestiona y consulta todas las planillas generadas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPayrolls}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D2B48C] text-[#3B4D36] text-sm font-semibold rounded-lg hover:bg-[#C5A87A] transition-colors disabled:opacity-50 shadow-sm"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <Link
              href="/pages/payroll/calculate"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F7153] text-white text-sm font-semibold rounded-lg hover:bg-[#5D614A] transition-colors shadow-sm"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nueva Planilla
            </Link>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-gray-700 mb-6" />

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg shadow-sm">
            <p className="text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E7DCC1] dark:border-gray-600 border-t-[#6F7153] mx-auto mb-4"></div>
            <p className="text-lg text-[#5D4E37] dark:text-gray-300 font-medium">Cargando planillas...</p>
          </div>
        )}

        {/* Lista de planillas en grid */}
        {!isLoading && payrolls.length > 0 && (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-[#E0D6B7] dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#E7DCC1] dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-[#6F7153]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8B7355] dark:text-gray-400 uppercase tracking-wide">Total Planillas</p>
                    <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">{payrolls.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-[#E0D6B7] dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6F7153] rounded-xl flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8B7355] dark:text-gray-400 uppercase tracking-wide">Pagadas</p>
                    <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">
                      {payrolls.filter(p => p.status === 'PAGADO').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-[#E0D6B7] dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#D2B48C] dark:bg-amber-600 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-[#3B4D36] dark:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8B7355] dark:text-gray-400 uppercase tracking-wide">Pendientes</p>
                    <p className="text-2xl font-bold text-[#3B4D36] dark:text-white">
                      {payrolls.filter(p => p.status === 'PENDIENTE' || p.status === 'CALCULADO').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {payrolls.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* Header de la tarjeta */}
                  <div className="bg-[#EDE5D2] dark:bg-gray-700 px-5 py-4 border-b border-[#D2B48C] dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#6F7153] rounded-xl flex items-center justify-center shadow-sm">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#3B4D36] dark:text-white">
                            Planilla #{p.id}
                          </h3>
                          <p className="text-xs text-[#6B5B3D] dark:text-gray-400 font-medium">
                            {getPayrollTypeName(p.payroll_type)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-5 space-y-4">
                    {/* Periodo */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#E7DCC1] dark:bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-5 h-5 text-[#6F7153]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-0.5">
                          Periodo
                        </p>
                        <p className="text-sm font-bold text-[#3B4D36] dark:text-white">
                          {formatDate(p.period_start)} — {formatDate(p.period_end)}
                        </p>
                      </div>
                    </div>

                    {/* Fecha de pago */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#E7DCC1] dark:bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CurrencyDollarIcon className="w-5 h-5 text-[#6F7153]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#6B5B3D] dark:text-gray-400 uppercase tracking-wide mb-0.5">
                          Fecha de Pago
                        </p>
                        <p className="text-sm font-bold text-[#3B4D36] dark:text-white">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <Link
                      href={`/pages/payroll/${p.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#6F7153] hover:bg-[#5D614A] text-white rounded-lg transition-colors font-semibold shadow-sm mt-2 text-sm"
                    >
                      <EyeIcon className="w-5 h-5" />
                      Ver Detalle
                    </Link>

                    {/* Botón marcar como pagada */}
                    <button
                      onClick={(e) => markAsPaid(p.id, e)}
                      disabled={updatingId === p.id || p.status === 'PAGADO'}
                      className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg transition-colors font-semibold shadow-sm disabled:cursor-not-allowed text-sm ${
                        p.status === 'PAGADO'
                          ? 'bg-[#8B8B8B] text-white'
                          : 'bg-[#6F7153] hover:bg-[#5D614A] text-white disabled:opacity-50'
                      }`}
                    >
                      {updatingId === p.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Actualizando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
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
          <div className="bg-[#F5F1E8] dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E0D6B7] dark:border-gray-700 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-[#E7DCC1] dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm">
                <DocumentTextIcon className="w-12 h-12 text-[#6F7153]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#3B4D36] dark:text-white mb-3">
              No hay planillas guardadas
            </h3>
            <p className="text-base text-[#6B5B3D] dark:text-gray-400 mb-8 max-w-md mx-auto">
              Comienza calculando tu primera planilla para ver el historial completo aquí
            </p>
            <Link
              href="/pages/payroll/calculate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6F7153] hover:bg-[#5D614A] text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Calcular Primera Planilla
            </Link>
          </div>
        )}
      </div>
      <modal.ModalComponent />
    </div>
  );
}
