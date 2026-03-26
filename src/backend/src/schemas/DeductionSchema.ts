import { z } from 'zod';

export const createDeductionSchema = z.object({
  name: z.string().min(1, 'Nombre de deduccion requerido'),
  description: z.string().min(1, 'Descripcion requerida'),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().positive().optional(),
});

export const updateDeductionSchema = createDeductionSchema.partial();

export type CreateDeductionInput = z.infer<typeof createDeductionSchema>;
export type UpdateDeductionInput = z.infer<typeof updateDeductionSchema>;
