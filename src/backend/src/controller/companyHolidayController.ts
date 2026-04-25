import { Request, Response } from "express";
import { CompanyHolidayService } from "../service/companyHolidayService";
import { asyncHandler } from "../utils/asyncHandler";

export class CompanyHolidayController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const holidays = await CompanyHolidayService.getAll(year);
    res.json({ success: true, data: holidays });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const holiday = await CompanyHolidayService.getById(id);
    if (!holiday) {
      res.status(404).json({ success: false, error: "Holiday not found" });
      return;
    }
    res.json({ success: true, data: holiday });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const newHoliday = await CompanyHolidayService.create(req.body);
    res.status(201).json({ success: true, data: newHoliday });
  });

  static createMany = asyncHandler(async (req: Request, res: Response) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      res.status(400).json({ success: false, error: "Request body must be an array of holidays" });
      return;
    }
    const result = await CompanyHolidayService.createMany(req.body);
    res.status(201).json({ success: true, data: result });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const updatedHoliday = await CompanyHolidayService.update(id, req.body);
    res.json({ success: true, data: updatedHoliday });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const deletedHoliday = await CompanyHolidayService.delete(id);
    res.json({ success: true, data: deletedHoliday });
  });
}
