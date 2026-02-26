'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
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
    searchTerm,
    stats,
    positions,
    positionsLoading,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
    createPosition,
    updatePosition,
    deletePosition,
    refreshPositions,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    closeEditEmployeeModal
  } = useEmployeeList();

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-[#3B4D36]">Empleados</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPositionsModal(true)}
              className="px-4 py-2 border border-[#3B4D36] text-[#3B4D36] rounded-lg hover:bg-[#E7DCC1] transition-colors"
            >
              Gestionar posiciones
            </button>
            <button
              onClick={openAddEmployeeModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Añadir Nuevo Empleado
            </button>
          </div>
        </div>

        {/* Employee Tabs - positioned same as in events */}
        <EmployeeTabs />
        
        <div className="space-y-6 mt-6">
          {/* Stats Cards */}
          <EmployeeStatsCards stats={stats} />

          {/* Employee Table - sin contenedor blanco, integrado al fondo */}
          <EmployeeTable 
            employees={employees}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onEmployeeAction={handleEmployeeAction}
          />
        </div>
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
        employeeData={editingEmployeeData}
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
    </div>
  );
};

export default EmployeeListPage;