import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

const EMPLOYEE_TABLE_CELL_CLASS = 'px-6 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors select-none';
const EMPLOYEE_TD_FIRED_CLASS = 'text-red-400 line-through';
const EMPLOYEE_TD_NORMAL_CLASS = 'text-zinc-700 dark:text-zinc-100';
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

import useEmployeeTable from '@/hooks/useEmployeeTable';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatDateDisplay } from '@/utils/formatters';

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

const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  employees, 
  searchTerm, 
  onSearchChange, 
  onEmployeeAction,
  showFiredEmployees,
  onToggleFiredEmployees
}) => {
  const router = useRouter();
  const {
    filterOpen,
    setFilterOpen,
    selectedEmployee,
    setSelectedEmployee,
    getStatusBadge,
  } = useEmployeeTable();

  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!selectedEmployee) return;
    const close = () => setSelectedEmployee(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [selectedEmployee, setSelectedEmployee]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
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
  }, [employees, sortColumn, sortDirection]);

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

  const handleEmployeeAction = (action: string, employeeId: string) => {
    onEmployeeAction(action, employeeId);
    setSelectedEmployee(null);
  };

  return (
    <>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Directorio
            </h2>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
              {employees.length} {employees.length === 1 ? 'empleado registrado' : 'empleados registrados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute w-4 h-4 text-zinc-400 dark:text-zinc-500 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="py-2 pl-9 pr-4 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 w-52"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              Filtro
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Estado de empleado:
              </label>
              <select
                value={showFiredEmployees ? "all" : "active"}
                onChange={(e) => onToggleFiredEmployees(e.target.value === "all")}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 text-sm"
              >
                <option value="active">Solo activos</option>
                <option value="all">Todos (incluir despedidos)</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-130">
          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 z-10">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className={EMPLOYEE_TABLE_CELL_CLASS}
                >
                  Nombre{renderSortIcon('name')}
                </th>
                <th 
                  onClick={() => handleSort('position')}
                  className={EMPLOYEE_TABLE_CELL_CLASS}
                >
                  Posición{renderSortIcon('position')}
                </th>
                <th 
                  onClick={() => handleSort('salary')}
                  className={EMPLOYEE_TABLE_CELL_CLASS}
                >
                  Salario <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 normal-case">x Hora</span>{renderSortIcon('salary')}
                </th>
                <th 
                  onClick={() => handleSort('extraHours')}
                  className={EMPLOYEE_TABLE_CELL_CLASS}
                >
                  Hora Extra <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 normal-case">(x1.5)</span>{renderSortIcon('extraHours')}
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className={EMPLOYEE_TABLE_CELL_CLASS}
                >
                  Estado{renderSortIcon('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sortedEmployees.map((employee) => {
                const isFired = employee.fired === true || employee.status === 'fired';
                return (
                <tr
                  key={employee.id}
                  className={`transition-colors ${
                    isFired
                      ? 'bg-red-50 dark:bg-red-900/10 opacity-70'
                      : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <td className={`px-6 py-3.5 text-sm font-semibold ${isFired ? EMPLOYEE_TD_FIRED_CLASS : EMPLOYEE_TD_NORMAL_CLASS}`}>
                    {employee.name}
                  </td>
                  <td className={`px-6 py-3.5 text-sm ${isFired ? EMPLOYEE_TD_FIRED_CLASS : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {employee.position}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? EMPLOYEE_TD_FIRED_CLASS : EMPLOYEE_TD_NORMAL_CLASS}`}>
                    {formatSalary(employee.salary)}
                  </td>
                  <td className={`px-6 py-3.5 text-sm font-medium ${isFired ? EMPLOYEE_TD_FIRED_CLASS : EMPLOYEE_TD_NORMAL_CLASS}`}>
                    {formatSalary(employee.salary * 1.5)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={getStatusBadge(employee.status).className}>
                      {getStatusBadge(employee.status).text}
                    </span>
                    {isFired && employee.exit_date && (
                      <p className="mt-1 text-xs text-red-400 dark:text-red-400">
                        Salida: {formatDateDisplay(employee.exit_date)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedEmployee === employee.id) {
                          setSelectedEmployee(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          setSelectedEmployee(employee.id);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      aria-label="Opciones del empleado"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                    {selectedEmployee === employee.id && dropdownPos && createPortal(
                      <div
                        style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
                        className="w-52 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <Tooltip content="Ver perfil completo">
                            <button
                              onClick={() => {
                                setSelectedEmployee(null);
                                router.push(`/pages/employee/${employee.id}`);
                              }}
                              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              Ver Perfil
                            </button>
                          </Tooltip>
                          {!isFired && (
                            <Tooltip content="Editar información del empleado">
                              <button
                                onClick={() => handleEmployeeAction('edit', employee.id)}
                                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Editar Información
                              </button>
                            </Tooltip>
                          )}
                          {!isFired && (
                            <>
                              <div className="border-t border-zinc-200 dark:border-zinc-700 mx-2 my-1" />
                              <Tooltip content="Despedir empleado">
                                <button
                                  onClick={() => handleEmployeeAction('dismiss', employee.id)}
                                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <NoSymbolIcon className="w-4 h-4" />
                                  Despedir empleado
                                </button>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>,
                      document.body
                    )}
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
