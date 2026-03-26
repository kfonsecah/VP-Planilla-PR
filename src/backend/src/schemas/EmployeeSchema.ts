import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employee_first_name: z.string().min(1, 'El primer nombre es requerido').max(50, 'El primer nombre no puede exceder 50 caracteres'),
  employee_last_name: z.string().min(1, 'El apellido es requerido').max(50, 'El apellido no puede exceder 50 caracteres'),
  employee_middle_name: z.string().max(50, 'El segundo nombre no puede exceder 50 caracteres').optional().default(''),
  employee_national_id: z.string().max(30, 'La cedula no puede exceder 30 caracteres').optional().default(''),
  employee_social_code: z.string().max(100, 'El codigo social no puede exceder 100 caracteres').optional().default(''),
  employee_email: z.string().email('Correo electronico invalido').max(100, 'El correo no puede exceder 100 caracteres'),
  employee_position_id: z.coerce.number().int().positive('Position ID invalido'),
  employee_hire_date: z.string().min(1, 'Fecha de contratacion requerida'),
  employee_required_hours_biweekly: z.coerce.number().optional().nullable(),
  // employee_status acepta tanto el código de 1 char ('A','V','I','M') como los strings largos del frontend
  // ('active','vacation','incomplete_assistance','incapacity_maternity'). El service mapea al Char(1) de la DB.
  employee_status: z.string().max(25, 'Estado de empleado invalido').optional().default('A'),
});

export const updateEmployeeSchema = z.object({
  // Frontend sends without employee_ prefix
  name: z.string().max(50).optional().nullable(),
  last_name: z.string().max(50).optional().nullable(),
  middle_name: z.string().max(50).optional().nullable(),
  national_id: z.string().max(30).optional().nullable(),
  social_code: z.string().max(100).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  position_id: z.coerce.number().int().positive().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  required_hours_biweekly: z.coerce.number().optional().nullable(),
  status: z.string().max(25).optional().nullable(),
  // Also accept with employee_ prefix (backward compatibility)
  employee_first_name: z.string().max(50).optional().nullable(),
  employee_last_name: z.string().max(50).optional().nullable(),
  employee_middle_name: z.string().max(50).optional().nullable(),
  employee_national_id: z.string().max(30).optional().nullable(),
  employee_social_code: z.string().max(100).optional().nullable(),
  employee_email: z.string().email().max(100).optional().nullable(),
  employee_position_id: z.coerce.number().int().positive().optional().nullable(),
  employee_hire_date: z.string().optional().nullable(),
  employee_required_hours_biweekly: z.coerce.number().optional().nullable(),
  employee_status: z.string().max(25).optional().nullable(),
  // Dismiss fields
  employee_exit_date: z.string().optional().nullable(),
  employee_fired: z.boolean().optional(),
  exit_date: z.string().optional().nullable(),
  fired: z.boolean().optional(),
  // Version for optimistic locking
  employee_version: z.coerce.number().optional(),
  version: z.coerce.number().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
