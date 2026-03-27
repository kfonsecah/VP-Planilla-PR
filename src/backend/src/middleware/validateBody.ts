import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Returns an Express middleware that validates req.body against the provided Zod schema.
 * On failure returns 400 with { success: false, error: "<messages>" }.
 * On success, replaces req.body with the parsed (coerced) value and calls next().
 *
 * @param schema - Zod schema to validate against
 * @returns Express RequestHandler
 */
export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map(i => i.message).join(', ');
      res.status(400).json({ success: false, error: message });
      return;
    }
    req.body = result.data;
    next();
  };
