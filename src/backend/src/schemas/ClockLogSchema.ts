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
