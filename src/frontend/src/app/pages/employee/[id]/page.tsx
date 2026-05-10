'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowPathIcon, ExclamationTriangleIcon, UserCircleIcon, NoSymbolIcon, BanknotesIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import useEmployeeProfile from '@/hooks/useEmployeeProfile';
import EmployeeProfileTabs, { ProfileTab } from '@/components/EmployeeProfileTabs';
import ProfileSummaryTab from '@/components/ProfileSummaryTab';
import EmployeePayrollsTab from '@/components/EmployeePayrollsTab';
import EmployeeEventsTab from '@/components/EmployeeEventsTab';
import EmployeeDocumentsTab from '@/components/EmployeeDocumentsTab';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import DismissEmployeeModal from '@/components/DismissEmployeeModal';
import { usePositions } from '@/hooks/usePositions';
import { useAguinaldo } from '@/hooks/useAguinaldo';
import { updateEmployee, fireEmployee } from '@/services/employeeService';
import { EmployeeFormData } from '@/types/employee';
import { toast } from 'sonner';
import { getStatusBadgeConfig } from '@/utils/employeeUtils';
import { formatCRC } from '@/utils/number';

/**
 * Página de perfil completo de un empleado
 * Ruta: /pages/employee/[id]
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const EmployeeProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  const { employee, aliases, vacations, isLoading, error, refresh } = useEmployeeProfile(employeeId);
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: aguinaldoData, isLoading: aguinaldoLoading, error: aguinaldoError } = useAguinaldo(employeeId);

  const [activeTab, setActiveTab] = useState<ProfileTab>('resumen');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);

  const fullName = employee?.name ?? '';
  const isFired = employee?.fired ?? false;
  const statusBadge = employee
    ? getStatusBadgeConfig(isFired ? 'fired' : (employee.status === 'A' ? 'active' : employee.status))
    : null;
  const positionName = employee?.position_name ?? 'Sin posición';

  /**
   * Maneja la actualización del empleado desde el modal de edición
   */
  const handleUpdateEmployee = async (data: Partial<EmployeeFormData>) => {
    try {
      await updateEmployee(employeeId, data);
      toast.success('Perfil actualizado correctamente');
      setShowEditModal(false);
      refresh();
    } catch (err) {
      console.error('Error updating employee', err);
      toast.error('No se pudo actualizar el empleado');
      throw err;
    }
  };

  /**
   * Confirma el despido del empleado
   */
  const handleConfirmDismiss = async (exitDate: string) => {
    try {
      await fireEmployee(employeeId, exitDate);
      toast.success('Empleado cesado correctamente');
      setShowDismissModal(false);
      refresh();
    } catch (err) {
      console.error('Error dismissing employee', err);
      toast.error('No se pudo cesar al empleado');
    }
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="px-8 py-6 max-w-screen-2xl mx-auto">
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-6" />
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-56 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !employee) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="px-8 py-6 max-w-screen-2xl mx-auto">
          <button
            onClick={() => router.push('/pages/employee/list')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Empleados
          </button>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 p-8 text-center max-w-lg mx-auto">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
              Error al cargar el perfil
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{error || 'Empleado no encontrado'}</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preparar datos para EditEmployeeModal (necesita prefijo employee_)
  const editingData = {
    employee_id: employee.id,
    employee_first_name: employee.first_name ?? employee.name.split(' ')[0] ?? '',
    employee_middle_name: employee.middle_name ?? '',
    employee_last_name: employee.last_name ?? '',
    employee_national_id: employee.national_id ?? '',
    employee_social_code: employee.social_code ?? '',
    employee_email: employee.email ?? '',
    employee_phone: employee.phone ?? '',
    employee_position_id: String(employee.position_id ?? ''),
    employee_hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
    employee_gender: employee.gender ?? '',
    employee_required_hours_biweekly: employee.required_hours_biweekly != null
      ? String(employee.required_hours_biweekly)
      : '',
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── Back button ── */}
        <button
          onClick={() => router.push('/pages/employee/list')}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-5"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a Empleados
        </button>

        {/* ── Profile Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
              isFired 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-[#E7DCC1] dark:bg-zinc-800 text-[#4A5D3A] dark:text-green-400'
            }`}>
              <UserCircleIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold leading-tight ${
                isFired 
                  ? 'text-red-500 dark:text-red-400 line-through'
                  : 'text-zinc-700 dark:text-[#E5E5E5]'
              }`}>
                {fullName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{positionName}</span>
                {statusBadge && (
                  <span className={statusBadge.className}>{statusBadge.text}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isFired && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 text-sm font-medium border border-[#6F7153] dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-[#D5CDB3] dark:hover:bg-zinc-700 transition-colors"
                >
                  Editar Perfil
                </button>
                <button
                  onClick={() => setShowDismissModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <NoSymbolIcon className="w-4 h-4" />
                  Cesar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-5" />

        {/* ── Profile Tabs ── */}
        <EmployeeProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ── Tab Content ── */}
        {activeTab === 'resumen' && (
          <ProfileSummaryTab
            employee={employee}
            aliases={aliases}
            vacations={vacations}
            onEditClick={() => setShowEditModal(true)}
          />
        )}

        {activeTab === 'planillas' && (
          <EmployeePayrollsTab employeeId={employeeId} />
        )}

        {activeTab === 'eventos' && (
          <EmployeeEventsTab
            employeeId={employeeId}
            currentEmployee={{ id: employee.id, name: fullName }}
          />
        )}

        {activeTab === 'documentos' && (
          <EmployeeDocumentsTab employeeId={employeeId} />
        )}

        {activeTab === 'aguinaldo' && (
          <div className="space-y-4">
            {aguinaldoLoading && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Calculando aguinaldo...</p>
              </div>
            )}
            {aguinaldoError && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-500">{aguinaldoError}</p>
              </div>
            )}
            {aguinaldoData && !aguinaldoLoading && (
              <>
                {/* Period info */}
                <div className="flex flex-wrap gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 text-sm text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-4 h-4" />
                    Período fiscal:&nbsp;
                    <strong>{new Date(aguinaldoData.periodStart + 'T00:00:00').toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                    &nbsp;—&nbsp;
                    <strong>{new Date(aguinaldoData.periodEnd + 'T00:00:00').toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </span>
                  <span className="hidden sm:block text-amber-400">|</span>
                  <span>Fecha límite de pago: <strong>20 de diciembre</strong></span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Planillas incluidas</p>
                    <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-100">
                      {aguinaldoData.payrollsIncluded}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">de {aguinaldoData.periodsPerYear} esperadas</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Salario ordinario del período</p>
                    <p className="text-xl font-bold text-zinc-700 dark:text-zinc-100">
                      {formatCRC(aguinaldoData.totalOrdinarySalary)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <BanknotesIcon className="w-4 h-4 text-[#4A5D3A] dark:text-green-400" />
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Aguinaldo acumulado</p>
                    </div>
                    <p className="text-2xl font-bold text-[#4A5D3A] dark:text-green-400">
                      {formatCRC(aguinaldoData.accrued)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Proyección si el salario se mantiene igual</p>
                    <p className="text-xl font-bold text-zinc-700 dark:text-zinc-100">
                      {formatCRC(aguinaldoData.projectedAnnual)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Progreso del período fiscal</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {aguinaldoData.payrollsIncluded} / {aguinaldoData.periodsPerYear} planillas
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4A5D3A] dark:bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, (aguinaldoData.payrollsIncluded / aguinaldoData.periodsPerYear) * 100)}%` }}
                    />
                  </div>
                  {aguinaldoData.payrollsIncluded >= aguinaldoData.periodsPerYear ? (
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Período completo
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" /> Período en curso
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateEmployee}
        employeeData={editingData}
        isLoading={false}
        positions={positions}
        positionsLoading={positionsLoading}
      />

      <DismissEmployeeModal
        isOpen={showDismissModal}
        employeeName={fullName}
        onConfirm={handleConfirmDismiss}
        onClose={() => setShowDismissModal(false)}
      />
    </div>
  );
};

export default EmployeeProfilePage;
