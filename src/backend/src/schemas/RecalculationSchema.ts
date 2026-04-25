import { z } from 'zod';

/**
 * Zod schema for payroll recalculations (Phase 32).
 *
 * Records the reason for a recalculation and an optional snapshot
 * of payroll_employee data captured before the recalc runs.
 */
export const createRecalculationSchema = z.object({
  payroll_id: z.number().int().positive('payroll_id debe ser un entero positivo'),
  reason: z.string().min(10, 'La razón debe tener al menos 10 caracteres'),
  data_snapshot: z.record(z.string(), z.unknown()).optional(),
});

export type CreateRecalculationInput = z.infer<typeof createRecalculationSchema>;
