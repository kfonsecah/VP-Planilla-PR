import { z } from 'zod';

export const DayConfirmationInput = z.object({
  employeeId: z.number(),
  confirmationDate: z.string(),
  notes: z.string().max(500).optional(),
});
export type DayConfirmationInput = z.infer<typeof DayConfirmationInput>;
