import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employee_first_name: z.string().min(1, 'El primer nombre es requerido'),
  employee_last_name: z.string().min(1, 'El apellido es requerido'),
  employee_middle_name: z.string().optional().default(''),
  employee_national_id: z.string().optional().default(''),
  employee_social_code: z.string().optional().default(''),
  employee_email: z.string().email('Correo electronico invalido'),
  employee_position_id: z.coerce.number().int().positive('Position ID invalido'),
  employee_hire_date: z.string().min(1, 'Fecha de contratacion requerida'),
  employee_required_hours_biweekly: z.coerce.number().optional().nullable(),
  employee_status: z.string().optional().default('active'),
});

export const updateEmployeeSchema = createEmployeeSchema.extend({
  employee_exit_date: z.string().optional(),
  employee_fired: z.boolean().optional().default(false),
  employee_version: z.coerce.number().optional(),
}).partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
