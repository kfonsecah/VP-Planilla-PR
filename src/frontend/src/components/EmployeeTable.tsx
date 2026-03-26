import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  NoSymbolIcon,
  ChevronUpIcon,
  ChevronDownIcon
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
  showFiredEmployees: boolean;
  onToggleFiredEmployees: (show: boolean) => void;
}

type SortColumn = 'name' | 'position' | 'salary' | 'extraHours' | 'status';
type SortDirection = 'asc' | 'desc';

/**
 * Componente de tabla de empleados con funcionalidades de búsqueda y acciones
 */
const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  searchTerm, 
  onSearchChange, 
  onEmployeeAction,
  showFiredEmployees,
  onToggleFiredEmployees
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

  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  /**
   * Maneja el click en el encabezado de una columna para ordenar
   */
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Si ya estamos ordenando por esta columna, invertir la dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es una nueva columna, ordenar ascendente por defecto
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  /**
   * Ordenar empleados según la columna y dirección seleccionadas
   */
  const sortedEmployees = useMemo(() => {
    const sorted = [...employees].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'position':
          aValue = a.position.toLowerCase();
          bValue = b.position.toLowerCase();
          break;
        case 'salary':
          aValue = a.salary;
          bValue = b.salary;
          break;
        case 'extraHours':
          aValue = a.salary * 1.5;
          bValue = b.salary * 1.5;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [employees, sortColumn, sortDirection]);

  /**
   * Renderiza el icono de ordenamiento para una columna
   */
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="inline-block w-4 h-4 ml-1" />
    ) : (
      <ChevronDownIcon className="inline-block w-4 h-4 ml-1" />
    );
  };


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
        employeeData={getEmployeeProfileData(selectedEmployeeData) as Parameters<typeof EmployeeProfileModal>[0]['employeeData']}
      />

      <div className="bg-[#F2E8CF] dark:bg-gray-800 rounded-xl border border-[#D2B48C] dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Encabezado con búsqueda y filtros */}
        <div className="px-5 py-4 bg-[#E7DCC1] dark:bg-gray-700 border-b border-[#D2B48C] dark:border-gray-600 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-widest">
              Directorio
            </h2>
            <p className="text-sm text-[#6B5B3D] dark:text-gray-400 mt-0.5">
              {employees.length} {employees.length === 1 ? 'empleado registrado' : 'empleados registrados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Campo de búsqueda */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute w-4 h-4 text-[#8B7355] dark:text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="py-2 pl-9 pr-4 border border-[#D2B48C] dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] focus:border-transparent bg-white dark:bg-gray-700 text-[#3B4D36] dark:text-white text-sm placeholder-[#C5BFAA] dark:placeholder-gray-400 w-52"
              />
            </div>
            {/* Botón de filtro */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-lg hover:bg-[#D5CDB3] dark:hover:bg-gray-600 bg-white dark:bg-gray-700 text-[#5D4E37] dark:text-gray-300 text-sm transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              Filtro
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {filterOpen && (
          <div className="px-5 py-4 bg-[#F5EDD5] dark:bg-gray-700 border-b border-[#D2B48C] dark:border-gray-600">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[#5D4E37] dark:text-gray-300">
                Estado de empleado:
              </label>
              <select
                value={showFiredEmployees ? "all" : "active"}
                onChange={(e) => onToggleFiredEmployees(e.target.value === "all")}
                className="px-3 py-2 border border-[#D2B48C] dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153] bg-white dark:bg-gray-800 text-[#3B4D36] dark:text-white text-sm"
              >
                <option value="active">Solo activos</option>
                <option value="all">Todos (incluir despedidos)</option>
              </select>
            </div>
          </div>
        )}

        {/* Tabla de empleados */}
        <div className="overflow-x-auto overflow-y-auto max-h-130">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#E7DCC1] dark:bg-gray-700 z-10">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#DDD4B8] dark:hover:bg-gray-600 transition-colors select-none"
                >
                  Nombre{renderSortIcon('name')}
                </th>
                <th 
                  onClick={() => handleSort('position')}
                  className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#DDD4B8] dark:hover:bg-gray-600 transition-colors select-none"
                >
                  Posición{renderSortIcon('position')}
                </th>
                <th 
                  onClick={() => handleSort('salary')}
                  className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#DDD4B8] dark:hover:bg-gray-600 transition-colors select-none"
                >
                  Salario <span className="text-[10px] font-normal text-[#8B7355] dark:text-gray-400 normal-case">x Hora</span>{renderSortIcon('salary')}
                </th>
                <th 
                  onClick={() => handleSort('extraHours')}
                  className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#DDD4B8] dark:hover:bg-gray-600 transition-colors select-none"
                >
                  Hora Extra <span className="text-[10px] font-normal text-[#8B7355] dark:text-gray-400 normal-case">(x1.5)</span>{renderSortIcon('extraHours')}
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[#DDD4B8] dark:hover:bg-gray-600 transition-colors select-none"
                >
                  Estado{renderSortIcon('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#5D4E37] dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DEC4] dark:divide-gray-700">
              {sortedEmployees.map((employee) => {
                const isFired = employee.fired === true || employee.status === 'fired';
                return (
                <tr
                  key={employee.id}
                  className={`transition-colors ${
                    isFired
                      ? 'bg-red-50 dark:bg-red-900/20 opacity-70'
                      : 'hover:bg-[#EEE8D4] dark:hover:bg-gray-700 bg-[#F9F3E3] dark:bg-gray-800'
                  }`}
                >
                  <td className={`px-6 py-3.5 text-sm font-semibold ${isFired ? 'text-red-400 line-through' : 'text-[#3B4D36] dark:text-white'}`}>
                    {employee.name}
                  </td>
                  <td className={`px-6 py-3.5 text-sm ${isFired ? 'text-red-300' : 'text-[#6B5B3D] dark:text-gray-400'}`}>
                    {employee.position}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? 'text-red-300' : 'text-[#3B4D36] dark:text-white'}`}>
                    {formatSalary(employee.salary)}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? 'text-red-300' : 'text-[#3B4D36] dark:text-white'}`}>
                    {formatSalary(employee.salary * 1.5)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={getStatusBadge(employee.status).className}>
                      {getStatusBadge(employee.status).text}
                    </span>
                    {isFired && employee.exit_date && (
                      <p className="mt-1 text-xs text-red-400 dark:text-red-300">
                        Salida: {new Date(employee.exit_date).toLocaleDateString('es-CR')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                    <div className="relative">
                      <button
                        onClick={() => setSelectedEmployee(selectedEmployee === employee.id ? null : employee.id)}
                        className="p-1 rounded-full hover:bg-[#DDDDC8] dark:hover:bg-gray-600 transition-colors"
                        aria-label="Opciones del empleado"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                      {selectedEmployee === employee.id && (
                        <div className="absolute right-0 z-10 w-52 mt-2 bg-[#F9F1DC] dark:bg-gray-700 border border-[#D2B48C] dark:border-gray-600 rounded-lg shadow-xl">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewProfile(employee)}
                              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] dark:text-white hover:bg-[#E7DCC1] dark:hover:bg-gray-600 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Ver Perfil
                            </button>
                            {!isFired && (
                              <button
                                onClick={() => handleEmployeeAction('edit', employee.id)}
                                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] dark:text-white hover:bg-[#E7DCC1] dark:hover:bg-gray-600 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Editar Información
                              </button>
                            )}
                            {!isFired && (
                              <>
                                <div className="border-t border-[#E7DCC1] dark:border-gray-600 mx-2 my-1" />
                                <button
                                  onClick={() => handleEmployeeAction('dismiss', employee.id)}
                                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
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
