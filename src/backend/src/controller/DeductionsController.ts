import { Request, Response } from "express";
import { DeductionsService } from "../service/DeductionsService";

export class DeductionsController {
  static async createDeduction(req: Request, res: Response): Promise<Response> {
    try {
      const deduction = await DeductionsService.createDeduction(req.body);
      return res.status(201).json(deduction);
    } catch (error) {
      console.error("Error creating deduction:", error);
      return res.status(500).json({ error: "Failed to create deduction" });
    }
  }

  static async getAllDeductions(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const deductions = await DeductionsService.getAllDeductions();
      return res.status(200).json(deductions);
    } catch (error) {
      console.error("Error retrieving deductions:", error);
      return res.status(500).json({ error: "Failed to retrieve deductions" });
    }
  }

  static async updateDeduction(req: Request, res: Response): Promise<Response> {
    const deductionId = parseInt(req.params.id, 10);
    const deductionData = req.body;

    try {
      const updatedDeduction = await DeductionsService.updateDeduction(
        deductionId,
        deductionData
      );
      if (!updatedDeduction) {
        return res.status(404).json({ error: "Deduction not found" });
      }
      return res.status(200).json(updatedDeduction);
    } catch (error) {
      console.error("Error updating deduction:", error);
      return res.status(500).json({ error: "Failed to update deduction" });
    }
  }

  static async deleteDeduction(req: Request, res: Response): Promise<Response> {
    const deductionId = parseInt(req.params.id, 10);

    try {
      const deleted = await DeductionsService.deleteDeduction(deductionId);
      if (!deleted) {
        return res.status(404).json({ error: "Deduction not found" });
      }
      return res
        .status(200)
        .json({ message: "Deduction deleted successfully" });
    } catch (error) {
      console.error("Error deleting deduction:", error);
      return res.status(500).json({ error: "Failed to delete deduction" });
    }
  }
}
