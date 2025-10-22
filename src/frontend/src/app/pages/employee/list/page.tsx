'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import useEmployeeList from '@/hooks/useEmployeeList';

/**
 * Página principal de lista de empleados
 * Incluye estadísticas, tabla de empleados y modales para agregar/editar empleados
 */
const EmployeeListPage: React.FC = () => {
  const {
    employees,
    searchTerm,
    stats,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
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
          <button
            onClick={openAddEmployeeModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Añadir Nuevo Empleado
          </button>
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
      />

      {/* Modal para editar empleado */}
      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={closeEditEmployeeModal}
        onSubmit={handleUpdateEmployee}
        employeeData={editingEmployeeData}
        isLoading={isLoadingEmployee}
      />
    </div>
  );
};

export default EmployeeListPage;