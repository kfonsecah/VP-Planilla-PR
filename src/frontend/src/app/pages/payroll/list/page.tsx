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
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { usePayroll } from '@/hooks/usePayroll';
import { PayrollService, Payroll } from '@/services/payrollService';
import { useModal } from '@/hooks/useModal';
import { toast } from 'sonner';
import { formatDateDisplay } from '@/utils/formatters';

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
    // Phase 36 state machine: BORRADOR → APROBADA → PAGADA
    if (status === 'BORRADOR' || status === 'draft' || status === 'PENDIENTE' || status === 'CALCULADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-yellow-900/30 text-zinc-600 dark:text-yellow-200 border border-zinc-300 dark:border-yellow-700">
          <ClockIcon className="w-4 h-4" />
          Borrador
        </span>
      );
    }

    if (status === 'APROBADA' || status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
          <CheckCircleIcon className="w-4 h-4" />
          Aprobada
        </span>
      );
    }

    if (status === 'PAGADA' || status === 'PAGADO' || status === 'paid' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white border border-blue-700">
          <CheckCircleIcon className="w-4 h-4" />
          Pagada
        </span>
      );
    }

    // Legacy status handling
    if (status === 'CALCULADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
          <ChartBarIcon className="w-4 h-4" />
          Calculado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
        <ClockIcon className="w-4 h-4" />
        {status || 'Sin estado'}
      </span>
    );
  };

  const formatDate = (date: string | Date | undefined | null) => {
    return formatDateDisplay(date);
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
          await PayrollService.markAsPaid(payrollId);
          await loadPayrolls();
          toast.success('La planilla ha sido marcada como PAGADA');
        } catch (err) {
          const message = (err as Error)?.message || 'Error al actualizar el estado';
          toast.error(message);
        } finally {
          setUpdatingId(null);
        }
      }
    );
  };

  const approvePayroll = async (payrollId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    modal.showConfirmation(
      'Aprobar Planilla',
      '¿Está seguro de aprobar esta planilla? Una vez aprobada no podrá modificarse.',
      async () => {
        setUpdatingId(payrollId);
        try {
          await PayrollService.approvePayroll(payrollId);
          await loadPayrolls();
          toast.success('La planilla ha sido aprobada');
        } catch (err) {
          const message = (err as Error)?.message || 'Error al aprobar la planilla';
          toast.error(message);
        } finally {
          setUpdatingId(null);
        }
      }
    );
  };

  const reopenPayroll = async (payrollId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    modal.showConfirmation(
      'Reabrir Planilla',
      '¿Está seguro de reabrir esta planilla? Podrá modificar los datos nuevamente.',
      async () => {
        setUpdatingId(payrollId);
        try {
          await PayrollService.reopenPayroll(payrollId, 'Reabierta por usuario');
          await loadPayrolls();
          toast.success('La planilla ha sido reabierta');
        } catch (err) {
          const message = (err as Error)?.message || 'Error al reopen la planilla';
          toast.error(message);
        } finally {
          setUpdatingId(null);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              Gestión de Planillas
            </p>
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-none">Historial de Planillas</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Gestiona y consulta todas las planillas generadas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPayrolls}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 text-sm font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <Link
              href="/pages/payroll/calculate"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-500 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nueva Planilla
            </Link>
          </div>
        </div>

        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6" />

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state - skeleton cards */}
        {isLoading && (
          <>
            {/* Skeleton stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      <div className="h-6 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton payroll cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                    <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lista de planillas en grid */}
        {!isLoading && payrolls.length > 0 && (
          <>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Total Planillas</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{payrolls.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Pagadas</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {payrolls.filter(p => p.status === 'PAGADA' || p.status === 'PAGADO').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Pendientes</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
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
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  {/* Header de la tarjeta */}
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center">
                          <DocumentTextIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                            Planilla #{p.id}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
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
                      <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
                          Periodo
                        </p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                          {formatDate(p.period_start)} — {formatDate(p.period_end)}
                        </p>
                      </div>
                    </div>

                    {/* Fecha de pago */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
                          Fecha de Pago
                        </p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                          {formatDate(p.payment_date)}
                        </p>
                      </div>
                    </div>

                    {/* Botón de acción */}
                    <Link
                      href={`/pages/payroll/${p.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold text-sm"
                    >
                      <EyeIcon className="w-5 h-5" />
                      Ver Detalle
                    </Link>

                    {/* Contextual action buttons based on status */}
                    {p.status === 'BORRADOR' && (
                      <button
                        onClick={(e) => approvePayroll(p.id, e)}
                        disabled={updatingId === p.id}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm"
                      >
                        {updatingId === p.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Aprobando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Aprobar</span>
                          </>
                        )}
                      </button>
                    )}

                    {p.status === 'APROBADA' && (
                      <>
                        <button
                          onClick={(e) => markAsPaid(p.id, e)}
                          disabled={updatingId === p.id}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm"
                        >
                          {updatingId === p.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Marcando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              <span>Marcar como Pagada</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => reopenPayroll(p.id, e)}
                          disabled={updatingId === p.id}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm"
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                          <span>Reabrir</span>
                        </button>
                      </>
                    )}

                    {(p.status === 'PAGADA' || p.status === 'PAGADO') && (
                      <button
                        onClick={(e) => reopenPayroll(p.id, e)}
                        disabled={updatingId === p.id}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm"
                      >
                        {updatingId === p.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Reabriendo...</span>
                          </>
                        ) : (
                          <>
                            <ArrowPathIcon className="w-5 h-5" />
                            <span>Reabrir</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Legacy: PENDIENTE/CALCULADO status buttons */}
                    {(p.status === 'PENDIENTE' || p.status === 'CALCULADO') && (
                      <button
                        onClick={(e) => markAsPaid(p.id, e)}
                        disabled={updatingId === p.id}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 text-sm"
                      >
                        {updatingId === p.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Actualizando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Marcar como Pagada</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!isLoading && payrolls.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
              No hay planillas guardadas
            </h3>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              Comienza calculando tu primera planilla para ver el historial completo aquí
            </p>
            <Link
              href="/pages/payroll/calculate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
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
