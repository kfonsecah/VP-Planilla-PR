/**
 * Utilidades para empleados
 */

import { Employee, EmployeeStats } from '@/types';
import { EMPLOYEE_STATUS, POSITIONS, DEFAULT_SALARY, STATUS_BADGE_CONFIG } from '@/constants';

/**
 * Formatea un salario para mostrarlo al usuario
 */
export const formatSalary = (salary: number): string => {
  return `₡${salary.toLocaleString()}`;
};

/**
 * Calcula las estadísticas de una lista de empleados
 */
export const calculateEmployeeStats = (employees: Employee[]): EmployeeStats => {
  return {
    total: employees.length,
    onVacation: employees.filter(emp => emp.status === EMPLOYEE_STATUS.VACATION).length,
    incompleteAssistance: employees.filter(emp => emp.status === EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE).length,
    incapacityMaternity: employees.filter(emp => emp.status === EMPLOYEE_STATUS.INCAPACITY_MATERNITY).length,
  };
};

/**
 * Obtiene el nombre de una posición por su ID
 */
export const getPositionName = (positionId: string): string => {
  return POSITIONS[positionId as keyof typeof POSITIONS]?.name || 'Posición no especificada';
};

/**
 * Obtiene el salario de una posición por su ID
 */
export const getPositionSalary = (positionId: string): number => {
  return POSITIONS[positionId as keyof typeof POSITIONS]?.salary || DEFAULT_SALARY;
};

/**
 * Obtiene la configuración del badge de estado
 */
export const getStatusBadgeConfig = (status: string) => {
  const statusKey = status as keyof typeof STATUS_BADGE_CONFIG;
  return STATUS_BADGE_CONFIG[statusKey] || {
    text: 'Desconocido',
    className: 'px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded-full'
  };
};

/**
 * Filtra empleados por término de búsqueda
 */
export const filterEmployees = (employees: Employee[], searchTerm: string): Employee[] => {
  if (!searchTerm.trim()) return employees;
  
  const term = searchTerm.toLowerCase();
  return employees.filter(employee =>
    employee.name.toLowerCase().includes(term) ||
    employee.position.toLowerCase().includes(term)
  );
};

/**
 * Genera un ID único para un nuevo empleado
 */
export const generateEmployeeId = (): string => {
  return Date.now().toString();
};
