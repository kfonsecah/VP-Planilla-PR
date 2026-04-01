/**
 * Utilidades para empleados
 */

import { Employee, EmployeeStats } from '@/types';
import { EMPLOYEE_STATUS, STATUS_BADGE_CONFIG } from '@/constants';

type PositionLike = {
  id: number | string;
  name?: string | null;
  base_salary?: number | null;
};

/**
 * Formatea un salario para mostrarlo al usuario
 * El salario se muestra como precio por hora
 */
export const formatSalary = (salary: number): string => {
  return `₡${salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calcula las estadísticas de una lista de empleados
 */
export const calculateEmployeeStats = (employees: Employee[]): EmployeeStats => {
  const active = employees.filter(emp => emp.status !== EMPLOYEE_STATUS.FIRED);
  return {
    total: active.length,
    onVacation: active.filter(emp => emp.status === EMPLOYEE_STATUS.VACATION).length,
    incompleteAssistance: active.filter(emp => emp.status === EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE).length,
    incapacityMaternity: active.filter(emp => emp.status === EMPLOYEE_STATUS.INCAPACITY_MATERNITY).length,
  };
};

/**
 * Obtiene el nombre de una posición por su ID
 */
export const getPositionName = (positionId: string, positions?: PositionLike[] | null): string => {
  if (!positions || !positionId) return 'Posición no especificada';
  const match = positions.find((p) => String(p.id) === String(positionId));
  return (match?.name || '').trim() || 'Posición no especificada';
};

/**
 * Obtiene el salario de una posición por su ID
 */
export const getPositionSalary = (positionId: string, positions?: PositionLike[] | null): number => {
  if (!positions || !positionId) return 0;
  const match = positions.find((p) => String(p.id) === String(positionId));
  const rawSalary = match?.base_salary;
  if (rawSalary === null || rawSalary === undefined) return 0;
  return typeof rawSalary === 'number' ? rawSalary : Number(rawSalary) || 0;
};

/**
 * Obtiene la configuración del badge de estado
 */
export const getStatusBadgeConfig = (status: string) => {
  const statusKey = status as keyof typeof STATUS_BADGE_CONFIG;
  return STATUS_BADGE_CONFIG[statusKey] || {
    text: 'Desconocido',
    className: 'px-2 py-1 text-xs text-zinc-800 bg-zinc-100 rounded-full'
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
