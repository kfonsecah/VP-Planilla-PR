import { Request, Response } from 'express';
import { IntegrityService } from '../service/IntegrityService';

export class IntegrityController {
  /**
   * Obtiene el estado actual de integridad para el dashboard.
   * 
   * @route GET /api/integrity/dashboard
   */
  static async getDashboardStatus(req: Request, res: Response): Promise<void> {
    const status = await IntegrityService.getDashboardStatus();
    res.json({
      success: true,
      data: status
    });
  }

  /**
   * Ejecuta una auditoría manual y retorna los resultados frescos.
   * 
   * @route POST /api/integrity/audit
   */
  static async runAudit(req: Request, res: Response): Promise<void> {
    const alerts = await IntegrityService.runAudit();
    res.json({
      success: true,
      data: alerts
    });
  }
}
