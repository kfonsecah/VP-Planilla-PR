import { Request, Response } from "express";
import { DeductionsService } from "../service/DeductionsService";

export class DeductionsController {
  /**
   * Create a new deduction in the system
   * POST /deduction/create
   * @param req - Express request object containing deduction data
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with created deduction data or error
   */
  static async createDeduction(req: Request, res: Response): Promise<Response> {
    try {
      const deduction = await DeductionsService.createDeduction(req.body);
      return res.status(201).json(deduction);
    } catch (error) {
      console.error("Error creating deduction:", error);
      return res.status(500).json({ error: "Failed to create deduction" });
    }
  }

  /**
   * Get all deductions from the system
   * GET /deductions
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with array of deductions or error
   */
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

  /**
   * Update an existing deduction
   * PUT /deductions/:id
   * @param req - Express request object containing deduction ID in params and update data in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with updated deduction data or error
   */
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

  /**
   * Delete a deduction by ID
   * DELETE /deductions/:id
   * @param req - Express request object containing deduction ID in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with success message or error
   */
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
