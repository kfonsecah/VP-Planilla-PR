import { Request, Response } from 'express';
import { ClockAliasService } from '../service/ClockAliasService';

export class ClockAliasController {
  /**
   * POST /api/employees/:id/aliases
   * Body: { alias_name: string } (already Zod-normalized by validateBody middleware)
   */
  async create(req: Request, res: Response): Promise<Response> {
    const idParam = req.params.id as string;
    const employeeId = parseInt(idParam, 10);
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({ success: false, error: 'ID de empleado inválido' });
    }

    const { alias_name } = req.body as { alias_name: string };

    try {
      const alias = await ClockAliasService.create(employeeId, alias_name);
      return res.status(201).json({ success: true, data: alias });
    } catch (error: any) {
      if (error.message === 'ALIAS_DUPLICATE') {
        return res.status(409).json({ success: false, error: 'Este alias ya está registrado para este empleado' });
      }
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/employees/:id/aliases
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    const idParam = req.params.id as string;
    const employeeId = parseInt(idParam, 10);
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({ success: false, error: 'ID de empleado inválido' });
    }

    try {
      const aliases = await ClockAliasService.getAll(employeeId);
      return res.json({ success: true, data: aliases });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * DELETE /api/employees/:id/aliases/:aliasId
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const aliasIdParam = req.params.aliasId as string;
    const aliasId = parseInt(aliasIdParam, 10);
    if (isNaN(aliasId) || aliasId <= 0) {
      return res.status(400).json({ success: false, error: 'ID de alias inválido' });
    }

    try {
      await ClockAliasService.delete(aliasId);
      return res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'ALIAS_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Alias no encontrado' });
      }
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}