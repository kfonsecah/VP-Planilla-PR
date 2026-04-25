import { z } from 'zod';
import { PayrollStatus } from '@prisma/client';

export const createPayrollSchema = z.object({
  payroll_type_id: z.coerce.number().int().positive('Tipo de planilla requerido'),
  period_start: z.string().min(1, 'Fecha inicio requerida'),
  period_end: z.string().min(1, 'Fecha fin requerida'),
  payment_date: z.string().optional(),
  status: z.nativeEnum(PayrollStatus).optional().default(PayrollStatus.BORRADOR),
});

export const updatePayrollSchema = createPayrollSchema.partial();

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;
