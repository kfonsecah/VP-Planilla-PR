import { z } from 'zod';

/**
 * Zod schemas for clock log adjustments (Phase 32).
 *
 * Uses discriminatedUnion on 'type' to enforce type-specific field presence:
 * - ADD: no clock_log_id (new mark, no existing log to reference)
 * - EDIT: clock_log_id required (correcting an existing log)
 * - VOID: clock_log_id required (soft-deleting an existing log)
 */
export const createAdjustmentSchema = z.discriminatedUnion('type', [
  // ADD — marca faltante agregada manualmente
  z.object({
    type: z.literal('ADD'),
    employee_id: z.coerce.number().int().positive('employee_id debe ser un entero positivo'),
    new_timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'new_timestamp debe ser una fecha válida (ISO 8601 recomendado)',
    }),
    log_type: z.enum(['IN', 'OUT']),
    justification: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
  }),

  // EDIT — corrección de timestamp de marca existente
  z.object({
    type: z.literal('EDIT'),
    employee_id: z.coerce.number().int().positive('employee_id debe ser un entero positivo'),
    clock_log_id: z.coerce.number().int().positive('clock_log_id debe ser un entero positivo'),
    new_timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'new_timestamp debe ser una fecha válida (ISO 8601 recomendado)',
    }),
    log_type: z.enum(['IN', 'OUT']),
    justification: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
  }),

  // VOID — anulación de marca errónea (soft delete)
  z.object({
    type: z.literal('VOID'),
    employee_id: z.coerce.number().int().positive('employee_id debe ser un entero positivo'),
    clock_log_id: z.coerce.number().int().positive('clock_log_id debe ser un entero positivo'),
    log_type: z.enum(['IN', 'OUT']),
    justification: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
  }),
]);

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
