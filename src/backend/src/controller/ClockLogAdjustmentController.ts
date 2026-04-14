import { Request, Response } from 'express';
import { ClockLogAdjustmentService } from '../service/ClockLogAdjustmentService';
import { ClockLogEffectiveService } from '../service/ClockLogEffectiveService';
import { ClockLogsService } from '../service/ClockLogsService';
import { parseLocalDate, parseLocalDateEnd } from '../utils/dateUtils';

/**
 * Controller for clock log adjustments and effective marks.
 */
export class ClockLogAdjustmentController {
  /**
   * Create a new clock log adjustment (ADD, EDIT, VOID)
   * POST /api/clock-logs/adjust
   */
  async createAdjustment(req: Request, res: Response): Promise<Response> {
    const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;

    try {
      const adjustment = await ClockLogAdjustmentService.createAdjustment(req.body, userId);
      return res.status(201).json({
        success: true,
        data: adjustment
      });
    } catch (error: any) {
      if (error.message.includes('PAGADA')) {
        return res.status(403).json({ success: false, error: error.message });
      }
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Create a manual clock log entry
   * POST /api/clock-logs/manual
   */
  async createManualLog(req: Request, res: Response): Promise<Response> {
    const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;
    const { employee_id, timestamp, log_type, remarks, justification } = req.body;

    const ts = new Date(timestamp);
    if (isNaN(ts.getTime())) {
      return res.status(400).json({ success: false, error: 'Timestamp inválido' });
    }

    const service = new ClockLogsService();
    try {
      const result = await service.createManualLog({
        employee_id,
        timestamp: ts,
        log_type,
        remarks: remarks ?? null,
        created_by: userId,
        justification,
      });

      return res.status(201).json({ success: true, clockLogId: result.clockLogId });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get effective marks with pairing logic
   * GET /api/clock-logs/effective?employee_id=X&initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getEffectiveMarks(req: Request, res: Response): Promise<Response> {
    const { employee_id, initDate, endDate } = req.query;

    if (!employee_id || !initDate || !endDate) {
      return res.status(400).json({ success: false, error: 'employee_id, initDate and endDate are required' });
    }

    try {
      const employeeId = parseInt(employee_id as string, 10);
      const start = parseLocalDate(initDate as string);
      const end = parseLocalDateEnd(endDate as string);

      if (isNaN(employeeId) || !start || !end) {
        return res.status(400).json({ success: false, error: 'Invalid parameters' });
      }

      const pairedMarks = await ClockLogEffectiveService.getPairedEffectiveMarks(employeeId, start, end);
      return res.json({
        success: true,
        data: pairedMarks
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
