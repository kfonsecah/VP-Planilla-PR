import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  status: 'active' | 'vacation' | 'incomplete_assistance' | 'incapacity_maternity';
}

interface EmployeeTableProps {
  employees: Employee[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEmployeeAction: (action: string, employeeId: string) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  searchTerm, 
  onSearchChange, 
  onEmployeeAction 
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Al día</span>;
      case 'vacation':
        return <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">Vacaciones</span>;
      case 'incomplete_assistance':
        return <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">Asistencia incompleta</span>;
      case 'incapacity_maternity':
        return <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">Incapacidad/maternidad</span>;
      default:
        return <span className="px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded-full">Desconocido</span>;
    }
  };

  const formatSalary = (salary: number) => {
    return `₡${salary.toLocaleString()}`;
  };

  const handleEmployeeAction = (action: string, employeeId: string) => {
    onEmployeeAction(action, employeeId);
    setSelectedEmployee(null);
  };

  return (
    <div className="bg-[#F9F1DC] rounded-lg">
      {/* Table Header with Search and Filter */}
      <div className="p-3 bg-[#D5CDB3] rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-[#5D4E37]">
            Total de empleados: {employees.length} Empleados
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute w-4 h-4 text-[#3B4D36] transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Buscar empleado"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="py-2 pl-10 pr-4 border border-[#D2B48C] rounded-lg focus:outline-none bg-[#B5AF9A] text-[#3B4D36]"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-[#D2B48C] rounded-lg hover:bg-[#B5AF9A] bg-[#B5AF9A] text-[#3B4D36]"
            >
              <FunnelIcon className="w-4 h-4" />
              Filtro
            </button>
          </div>
        </div>
      </div>

      <div className='border-b border-[#D2B48C] flex w-full h-50px'></div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto rounded-b-lg max-h-130">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#5D4E37]">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#5D4E37]">
                Posición
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#5D4E37]">
                Salario
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#5D4E37]">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#5D4E37]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D2B48C]">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-[#EEEEDC] transition-colors">
                <td className="px-6 py-4 text-sm text-[#5D4E37]">
                  {employee.name}
                </td>
                <td className="px-6 py-4 text-sm text-[#6B5B3D]">
                  {employee.position}
                </td>
                <td className="px-6 py-4 text-sm text-[#5D4E37] font-medium">
                  {formatSalary(employee.salary)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(employee.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="relative">
                    <button
                      onClick={() => setSelectedEmployee(selectedEmployee === employee.id ? null : employee.id)}
                      className="p-1 rounded-full hover:bg-[#DDDDC8] transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                    {selectedEmployee === employee.id && (
                      <div className="absolute right-0 z-10 w-48 mt-2 bg-[#F9F1DC] border rounded-md shadow-lg">
                        <div className="py-1">
                          <button
                            onClick={() => handleEmployeeAction('view', employee.id)}
                            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1]"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Ver Perfil
                          </button>
                          <button
                            onClick={() => handleEmployeeAction('edit', employee.id)}
                            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-[#3B4D36] hover:bg-[#E7DCC1]"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Editar Información
                          </button>
                          <div className="border-t border-[#E7DCC1] mx-2 my-1"></div>
                          <button
                            onClick={() => handleEmployeeAction('delete', employee.id)}
                            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-[#E7DCC1]"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
