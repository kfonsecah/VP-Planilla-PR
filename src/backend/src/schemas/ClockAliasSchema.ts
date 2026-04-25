import { z } from 'zod';

/**
 * Normalizes an alias name for consistent storage and lookup.
 * Applies: lowercase, NFD Unicode normalization (strips diacritics), collapse whitespace, trim.
 */
const normalizeAliasName = (value: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const createClockAliasSchema = z.object({
  alias_name: z.string()
    .min(1, 'El nombre del alias es requerido')
    .max(100, 'El alias no puede superar 100 caracteres')
    .transform(normalizeAliasName),
});

export const updateClockAliasSchema = z.object({
  alias_name: z.string()
    .min(1, 'El nombre del alias es requerido')
    .max(100, 'El alias no puede superar 100 caracteres')
    .transform(normalizeAliasName),
});

export type CreateClockAliasInput = z.infer<typeof createClockAliasSchema>;
export type UpdateClockAliasInput = z.infer<typeof updateClockAliasSchema>;