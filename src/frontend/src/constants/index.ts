/**
 * Constantes de la aplicación
 */

// Estados de empleados
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active' as const,
  VACATION: 'vacation' as const,
  INCOMPLETE_ASSISTANCE: 'incomplete_assistance' as const,
  INCAPACITY_MATERNITY: 'incapacity_maternity' as const,
} as const;

// Configuración de badges de estado
export const STATUS_BADGE_CONFIG = {
  [EMPLOYEE_STATUS.ACTIVE]: {
    text: 'Al día',
    className: 'px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full'
  },
  [EMPLOYEE_STATUS.VACATION]: {
    text: 'Vacaciones',
    className: 'px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full'
  },
  [EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE]: {
    text: 'Asistencia incompleta',
    className: 'px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full'
  },
  [EMPLOYEE_STATUS.INCAPACITY_MATERNITY]: {
    text: 'Incapacidad/maternidad',
    className: 'px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full'
  }
} as const;

// Mensajes de la aplicación
export const MESSAGES = {
  EMPLOYEE_ACTIONS: {
    DELETE_CONFIRM: '¿Está seguro que desea eliminar este empleado?',
    SAVE_SUCCESS: 'Empleado guardado exitosamente',
    DELETE_SUCCESS: 'Empleado eliminado exitosamente',
  }
} as const;
