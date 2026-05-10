import { z } from 'zod';

/**
 * Validation schema for the "Agregar Documento" modal.
 * In the current scope (no binary upload), `file_path` is the document
 * name and `document_type` is a free-text classifier.
 */
export const documentSchema = z.object({
  file_path: z
    .string()
    .min(1, 'El nombre del documento es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  document_type: z
    .string()
    .min(1, 'El tipo es requerido')
    .max(50, 'El tipo no puede superar 50 caracteres'),
});

export type DocumentFormData = z.infer<typeof documentSchema>;
