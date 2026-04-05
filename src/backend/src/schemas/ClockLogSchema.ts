import { z } from 'zod';

const clockLogItemSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp requerido'),
  log_type: z.string().min(1, 'Tipo de log requerido'),
  employee_id: z.coerce.number().optional(),
  employee_name: z.string().optional(),
  remarks: z.string().optional().nullable(),
});

export const bulkCreateClockLogSchema = z.object({
  logs: z.array(clockLogItemSchema).min(1, 'Se requiere al menos un log'),
});

export type BulkCreateClockLogInput = z.infer<typeof bulkCreateClockLogSchema>;

export const resolveOrphanSchema = z.object({
  action: z.enum(['assign_complement', 'discard']),
  justification: z.string().min(1, 'La justificación es requerida').max(500),
  complementTimestamp: z.string().datetime().optional(),
  complementLogType: z.enum(['IN', 'OUT']).optional(),
}).refine(
  (data) => {
    if (data.action === 'assign_complement') {
      return !!data.complementTimestamp && !!data.complementLogType;
    }
    return true;
  },
  { message: 'complementTimestamp y complementLogType son requeridos para assign_complement', path: ['complementTimestamp'] }
);

/**
 * Schema for creating manual clock log entries (Phase 21)
 */
export const createManualLogSchema = z.object({
  employee_id: z.coerce.number().int().positive("Employee ID must be a positive integer"),
  timestamp: z.string().datetime({ message: "Invalid date format" }),
  log_type: z.enum(['IN', 'OUT']),
  remarks: z.string().optional().nullable(),
  justification: z.string().min(1, 'La justificación es requerida').max(500),
});
export type CreateManualLogInput = z.infer<typeof createManualLogSchema>;

/**
 * Schema for updating clock log status (Phase 21)
 */
export const updateClockLogStatusSchema = z.object({
  status: z.enum(['corrected']), // Phase 21: only corrected required
  justification: z.string().min(1, 'La justificación es requerida').max(500),
});
export type UpdateClockLogStatusInput = z.infer<typeof updateClockLogStatusSchema>;
