'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import useEmployeeList from '@/hooks/useEmployeeList';

/**
 * Página principal de lista de empleados
 * Incluye estadísticas, tabla de empleados y modal para agregar nuevos empleados
 */
const EmployeeListPage: React.FC = () => {
  const {
    employees,
    searchTerm,
    stats,
    showAddEmployeeModal,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    openAddEmployeeModal,
    closeAddEmployeeModal
  } = useEmployeeList();

  return (
    <div className="min-h-screen p-6 bg-[#E7DCC1]">
      <div className="mx-auto max-w-7xl">
        {/* Tabs de navegación */}
        <EmployeeTabs />
        
        {/* Encabezado con título y botón de agregar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light text-[#3B4D36]">
            Lista de empleados
          </h1>
          <button 
            className="flex items-center gap-2 px-4 py-2 text-[#3B4D36] transition-colors bg-[#A7AA94] rounded-lg hover:bg-[#6F7153]/80" 
            onClick={openAddEmployeeModal}
          >
            <PlusIcon className="w-5 h-5" />
            Añadir Nuevo Empleado
          </button>
        </div>

        {/* Tarjetas de estadísticas */}
        <EmployeeStatsCards stats={stats} />

        {/* Tabla principal de empleados */}
        <EmployeeTable 
          employees={employees}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onEmployeeAction={handleEmployeeAction}
        />

        {/* Modal para agregar empleado */}
        <AddEmployeeModal
          isOpen={showAddEmployeeModal}
          onClose={closeAddEmployeeModal}
          onSubmit={handleAddEmployee}
        />
      </div>
    </div>
  );
};

export default EmployeeListPage;