'use client';

import React, { useState } from 'react';
import { PlusIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import DismissEmployeeModal from '@/components/DismissEmployeeModal';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import PositionsModal from '@/components/PositionsModal';
import useEmployeeList from '@/hooks/useEmployeeList';

/**
 * Página principal de lista de empleados
 * Incluye estadísticas, tabla de empleados y modales para agregar/editar empleados
 */
const EmployeeListPage: React.FC = () => {
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const {
    employees,
    isLoading,
    error,
    searchTerm,
    stats,
    positions,
    positionsLoading,
    positionsError,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    showDismissModal,
    dismissingEmployee,
    showFiredEmployees,
    setShowFiredEmployees,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
    handleConfirmDismiss,
    closeDismissModal,
    createPosition,
    updatePosition,
    deletePosition,
    refreshPositions,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    closeEditEmployeeModal,
    refreshEmployees
  } = useEmployeeList();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-[#A3A3A3] uppercase tracking-widest mb-1">
              Recursos Humanos
            </p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-[#E5E5E5] leading-none">Empleados</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPositionsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#6F7153] dark:border-[#4a4a4a] text-zinc-700 dark:text-[#E5E5E5] text-sm font-medium rounded-lg hover:bg-[#D5CDB3] dark:hover:bg-[#3d3d3d] transition-colors"
            >
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Gestionar posiciones
            </button>
            <button
              onClick={openAddEmployeeModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-700 dark:bg-[#4a4a4a] text-white text-sm font-semibold rounded-lg hover:bg-green-800 dark:hover:bg-[#3d3d3d] transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Añadir Empleado
            </button>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-5" />

        {/* Error banner for positions */}
        {positionsError && (
          <div className="mb-4 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400 mx-auto" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar posiciones</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{positionsError}</p>
              <button onClick={refreshPositions} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto">
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Error banner for employees */}
        {error && (
          <div className="mb-4 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400 mx-auto" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar empleados</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button onClick={refreshEmployees} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto">
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Employee Tabs */}
        <EmployeeTabs />

        {/* Stats Cards — skeleton or real */}
        {isLoading && employees.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-3" />
                <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <EmployeeStatsCards stats={stats} />
        )}

        {/* Employee Table — skeleton or real */}
        {isLoading && employees.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse">
            <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded flex-1" />
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded flex-1" />
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-10" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmployeeTable
            employees={employees}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onEmployeeAction={handleEmployeeAction}
            showFiredEmployees={showFiredEmployees}
            onToggleFiredEmployees={setShowFiredEmployees}
          />
        )}

      </div>

      {/* Modal para agregar empleado */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={closeAddEmployeeModal}
        onSubmit={handleAddEmployee}
        positions={positions}
        positionsLoading={positionsLoading}
      />

      {/* Modal para editar empleado */}
      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={closeEditEmployeeModal}
        onSubmit={handleUpdateEmployee}
        employeeData={editingEmployeeData ?? undefined}
        isLoading={isLoadingEmployee}
        positions={positions}
        positionsLoading={positionsLoading}
      />

      <PositionsModal
        isOpen={showPositionsModal}
        onClose={() => setShowPositionsModal(false)}
        positions={positions}
        isLoading={positionsLoading}
        onCreate={createPosition}
        onUpdate={updatePosition}
        onDelete={deletePosition}
        onRefresh={refreshPositions}
      />

      {/* Modal de despido */}
      <DismissEmployeeModal
        isOpen={showDismissModal}
        employeeName={dismissingEmployee?.name ?? ''}
        onConfirm={handleConfirmDismiss}
        onClose={closeDismissModal}
      />
    </div>
  );
};

export default EmployeeListPage;