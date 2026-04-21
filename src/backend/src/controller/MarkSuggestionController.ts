import { Request, Response } from 'express';
import { MarkSuggestionService } from '../service/MarkSuggestionService';

export class MarkSuggestionController {
  static async suggest(req: Request, res: Response) {
    const { employeeId, date, existingMarks } = req.body;
    const suggestion = await MarkSuggestionService.suggestMissingMark(employeeId, date, existingMarks);
    res.json({ success: true, data: suggestion });
  }
}
