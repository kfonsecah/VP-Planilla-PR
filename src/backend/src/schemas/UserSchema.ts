import { z } from 'zod';

export const updatePermissionsSchema = z.object({
  role: z.string().min(1, 'El rol es requerido'),
});

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
