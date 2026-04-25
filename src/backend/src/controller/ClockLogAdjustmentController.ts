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
   * GET /api/clock-logs/effective?employee_id=X&initDate=YYYY-MM-DD&endDate=YYYY-MM-DD&branch_id=Y&page=1&pageSize=20
   */
  async getEffectiveMarks(req: Request, res: Response): Promise<Response> {
    const { employee_id, initDate, endDate, branch_id, page, pageSize, status } = req.query;

    if (!initDate || !endDate) {
      return res.status(400).json({ success: false, error: 'initDate and endDate are required' });
    }

    try {
      const start = parseLocalDate(initDate as string);
      const end = parseLocalDateEnd(endDate as string);

      if (!start || !end) {
        return res.status(400).json({ success: false, error: 'Invalid date parameters' });
      }

      const employeeId = employee_id ? parseInt(employee_id as string, 10) : undefined;
      const branchId = branch_id ? parseInt(branch_id as string, 10) : undefined;
      const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
      const pageSizeNum = pageSize ? Math.max(1, parseInt(pageSize as string, 10)) : 20;

      // Parse status if provided (comma separated)
      let statusArray: string[] | undefined = undefined;
      if (typeof status === 'string' && status.length > 0) {
        statusArray = status.split(',').map(s => s.trim());
      } else if (Array.isArray(status)) {
        statusArray = status.map(s => String(s));
      }

      const { data, total } = await ClockLogEffectiveService.getPaginatedEffectiveMarks({
        initDate: start,
        endDate: end,
        employeeId: employeeId !== undefined && !isNaN(employeeId) ? employeeId : undefined,
        branchId: branchId !== undefined && !isNaN(branchId) ? branchId : undefined,
        page: isNaN(pageNum) ? 1 : pageNum,
        pageSize: isNaN(pageSizeNum) ? 20 : pageSizeNum,
        status: statusArray,
      });

      return res.json({
        success: true,
        data,
        total,
        page: isNaN(pageNum) ? 1 : pageNum,
        pageSize: isNaN(pageSizeNum) ? 20 : pageSizeNum
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
