import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { Employee } from '@/types';
import { formatSalary } from '@/utils/employeeUtils';
import EmployeeProfileModal from './EmployeeProfileModal';
import useEmployeeTable from '@/hooks/useEmployeeTable';

interface EmployeeTableProps {
  employees: Employee[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEmployeeAction: (action: string, employeeId: string) => void;
}

/**
 * Componente de tabla de empleados con funcionalidades de búsqueda y acciones
 */
const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  searchTerm, 
  onSearchChange, 
  onEmployeeAction 
}) => {
  const {
    filterOpen,
    setFilterOpen,
    selectedEmployee,
    setSelectedEmployee,
    showProfileModal,
    selectedEmployeeData,
    getStatusBadge,
    handleViewProfile,
    closeProfileModal,
    getEmployeeProfileData
  } = useEmployeeTable();

  /**
   * Maneja las acciones sobre empleados específicos
   */
  const handleEmployeeAction = (action: string, employeeId: string) => {
    onEmployeeAction(action, employeeId);
    setSelectedEmployee(null);
  };

  return (
    <>
      {/* Modal de perfil del empleado */}
      <EmployeeProfileModal 
        isOpen={showProfileModal} 
        onClose={closeProfileModal}
        // getEmployeeProfileData returns a shape compatible at runtime; cast to any to avoid type mismatch
        employeeData={getEmployeeProfileData(selectedEmployeeData) as any}
      />

      <div className="bg-[#F2E8CF] rounded-xl border border-[#D2B48C] shadow-sm overflow-hidden">
        {/* Encabezado con búsqueda y filtros */}
        <div className="px-5 py-4 bg-[#E7DCC1] border-b border-[#D2B48C] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#5D4E37] uppercase tracking-widest">
              Directorio
            </h2>
            <p className="text-sm text-[#6B5B3D] mt-0.5">
              {employees.length} {employees.length === 1 ? 'empleado registrado' : 'empleados registrados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Campo de búsqueda */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute w-4 h-4 text-[#8B7355] transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="py-2 pl-9 pr-4 border border-[#D2B48C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent bg-white text-[#3B4D36] text-sm placeholder-[#C5BFAA] w-52"
              />
            </div>
            {/* Botón de filtro */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-[#D2B48C] rounded-lg hover:bg-[#D5CDB3] bg-white text-[#5D4E37] text-sm transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              Filtro
            </button>
          </div>
        </div>

        {/* Tabla de empleados */}
        <div className="overflow-x-auto overflow-y-auto max-h-130">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#E7DCC1] z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Salario <span className="text-[10px] font-normal text-[#8B7355] normal-case">x Hora</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Hora Extra <span className="text-[10px] font-normal text-[#8B7355] normal-case">(x1.5)</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DEC4]">
              {employees.map((employee) => {
                const isFired = employee.fired === true || employee.status === 'fired';
                return (
                <tr
                  key={employee.id}
                  className={`transition-colors ${
                    isFired
                      ? 'bg-red-50 opacity-70'
                      : 'hover:bg-[#EEE8D4] bg-[#F9F3E3]'
                  }`}
                >
                  <td className={`px-6 py-3.5 text-sm font-semibold ${isFired ? 'text-red-400 line-through' : 'text-[#3B4D36]'}`}>
                    {employee.name}
                  </td>
                  <td className={`px-6 py-3.5 text-sm ${isFired ? 'text-red-300' : 'text-[#6B5B3D]'}`}>
                    {employee.position}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? 'text-red-300' : 'text-[#3B4D36]'}`}>
                    {formatSalary(employee.salary)}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? 'text-red-300' : 'text-[#3B4D36]'}`}>
                    {formatSalary(employee.salary * 1.5)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={getStatusBadge(employee.status).className}>
                      {getStatusBadge(employee.status).text}
                    </span>
                    {isFired && employee.exit_date && (
                      <p className="mt-1 text-xs text-red-400">
                        Salida: {new Date(employee.exit_date).toLocaleDateString('es-CR')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">
                    <div className="relative">
                      <button
                        onClick={() => setSelectedEmployee(selectedEmployee === employee.id ? null : employee.id)}
                        className="p-1 rounded-full hover:bg-[#DDDDC8] transition-colors"
                        aria-label="Opciones del empleado"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                      {selectedEmployee === employee.id && (
                        <div className="absolute right-0 z-10 w-52 mt-2 bg-[#F9F1DC] border border-[#D2B48C] rounded-lg shadow-xl">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewProfile(employee)}
                              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1] transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Ver Perfil
                            </button>
                            {!isFired && (
                              <button
                                onClick={() => handleEmployeeAction('edit', employee.id)}
                                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1] transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Editar Información
                              </button>
                            )}
                            {!isFired && (
                              <>
                                <div className="border-t border-[#E7DCC1] mx-2 my-1" />
                                <button
                                  onClick={() => handleEmployeeAction('dismiss', employee.id)}
                                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <NoSymbolIcon className="w-4 h-4" />
                                  Despedir empleado
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default EmployeeTable;
