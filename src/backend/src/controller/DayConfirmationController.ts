import { Request, Response } from 'express';
import { DayConfirmationService } from '../service/DayConfirmationService';
import { DayConfirmationInput } from '../schemas/DayConfirmationSchema';

export class DayConfirmationController {
  static async upsert(req: Request, res: Response) {
    const data = DayConfirmationInput.parse(req.body);
    const userId = (req as any).user?.user_id || (req as any).user?.userId || 1;
    const result = await DayConfirmationService.upsert(data.employeeId, data.confirmationDate, userId, data.notes);
    res.status(201).json({ success: true, data: result });
  }
  
  static async get(req: Request, res: Response) {
    const { employeeId, startDate, endDate } = req.query;
    const result = await DayConfirmationService.getByEmployee(Number(employeeId), String(startDate), String(endDate));
    res.json({ success: true, data: result });
  }
}
