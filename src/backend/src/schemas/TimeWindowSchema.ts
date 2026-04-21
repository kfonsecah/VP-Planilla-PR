import { z } from 'zod';

export const TimeWindowTypeEnum = z.enum([
  'ENTRY_MORNING',
  'EXIT_LUNCH', 
  'ENTRY_AFTERNOON',
  'EXIT_EVENING',
]);

export const CreateTimeWindowInput = z.object({
  companyId: z.number(),
  name: z.string().min(1).max(100),
  type: TimeWindowTypeEnum,
  startHour: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/),
  endHour: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/),
});

export const UpdateTimeWindowInput = CreateTimeWindowInput.partial();

export const TimeWindowParams = z.object({
  id: z.string().transform(Number),
});

export type CreateTimeWindowInput = z.infer<typeof CreateTimeWindowInput>;
export type UpdateTimeWindowInput = z.infer<typeof UpdateTimeWindowInput>;
