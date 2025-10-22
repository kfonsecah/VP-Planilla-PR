import { z } from 'zod';

export const employeeSchema = z.object({
  employee_first_name: z.string().min(1, 'El primer nombre es requerido'),
  // optional inputs are transformed to empty string so the output type is string
  employee_middle_name: z.string().optional().transform((v) => v ?? ''),
  employee_last_name: z.string().min(1, 'El apellido es requerido'),
  employee_national_id: z.string().min(1, 'La cédula es requerida'),
  employee_social_code: z.string().optional().transform((v) => v ?? ''),
  employee_email: z.string().email('Correo inválido'),
  employee_phone: z.string().optional().transform((v) => v ?? ''),
  employee_position_id: z.string().min(1, 'Seleccionar una posición'),
  employee_hire_date: z.string().optional().transform((v) => v ?? ''),
  employee_gender: z.string().optional().transform((v) => v ?? ''),
  employee_schedule: z.string().optional().transform((v) => v ?? ''),
});

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;
