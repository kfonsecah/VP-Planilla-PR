import { z } from 'zod';

export const VacationSchema = z.object({
  employee_id: z.number({ required_error: 'Empleado es requerido', invalid_type_error: 'Empleado debe ser un número' }).min(1),
  start_date: z.string().nonempty('Fecha inicio es requerida'),
  end_date: z.string().nonempty('Fecha fin es requerida'),
  days: z.number().min(1, 'Días debe ser al menos 1'),
  paid: z.boolean().optional(),
  status: z.string().optional(),
});

export type VacationForm = z.infer<typeof VacationSchema>;
