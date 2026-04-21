import { Request, Response } from 'express';
import { TimeWindowService } from '../service/TimeWindowService';
import { CreateTimeWindowInput, UpdateTimeWindowInput } from '../schemas/TimeWindowSchema';

export class TimeWindowController {
  static async create(req: Request, res: Response) {
    const data = CreateTimeWindowInput.parse(req.body);
    const result = await TimeWindowService.create({...data, companyId: (req as any).user?.company_id || (req as any).user?.companyId || 1});
    res.status(201).json({ success: true, data: result });
  }

  static async getAll(req: Request, res: Response) {
    const companyId = (req as any).user?.company_id || (req as any).user?.companyId || 1;
    const result = await TimeWindowService.getAll(companyId as number);
    res.json({ success: true, data: result });
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = UpdateTimeWindowInput.parse(req.body);
    const result = await TimeWindowService.update(id, data);
    res.json({ success: true, data: result });
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await TimeWindowService.delete(id);
    res.json({ success: true, data: result });
  }
}
