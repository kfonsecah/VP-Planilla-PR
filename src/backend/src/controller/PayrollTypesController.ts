import { Request, Response } from "express";
import { PayrollTypeService } from "../service/PayrollTypeService";

export class PayrollTypesController {
  /**
   * Create a new payroll type in the system
   * POST /payroll-type/create
   * @param req - Express request object containing payroll type data
   * @param res - Express response object
   * @returns Promise<void> - HTTP response with created payroll type data or error
   */
  static async createPayrollType(req: Request, res: Response): Promise<void> {
    try {
      const payrollType = await PayrollTypeService.createPayrollType(req.body);
      res.status(201).json(payrollType);
    } catch (error) {
      console.error("Error creating payroll type:", error);
      res.status(500).json({ error: "Failed to create payroll type" });
    }
  }

  /**
   * Update an existing payroll type
   * PUT /payroll-type/:id
   * @param req - Express request object containing payroll type ID in params and update data in body
   * @param res - Express response object
   * @returns Promise<void> - HTTP response with updated payroll type data or error
   */
  static async updatePayrollType(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid payroll type ID" });
      return;
    }

    try {
      const updatedPayrollType = await PayrollTypeService.updatePayrollType(
        id,
        req.body
      );
      if (!updatedPayrollType) {
        res.status(404).json({ error: "Payroll type not found" });
        return;
      }
      res.status(200).json(updatedPayrollType);
    } catch (error) {
      console.error("Error updating payroll type:", error);
      res.status(500).json({ error: "Failed to update payroll type" });
    }
  }

  /**
   * Get payroll type by ID
   * GET /payroll-type/:id
   * @param req - Express request object containing payroll type ID in params
   * @param res - Express response object
   * @returns Promise<void> - HTTP response with payroll type data or error
   */
  static async getPayrollType(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid payroll type ID" });
      return;
    }

    try {
      const payrollType = await PayrollTypeService.getPayrollTypeById(id);
      if (!payrollType) {
        res.status(404).json({ error: "Payroll type not found" });
        return;
      }
      res.status(200).json(payrollType);
    } catch (error) {
      console.error("Error fetching payroll type:", error);
      res.status(500).json({ error: "Failed to fetch payroll type" });
    }
  }

  /**
   * Get all payroll types from the system
   * GET /payroll-types
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<void> - HTTP response with array of payroll types or error
   */
  static async getAllPayrollTypes(req: Request, res: Response): Promise<void> {
    try {
      const payrollTypes = await PayrollTypeService.getAllPayrollTypes();
      res.status(200).json(payrollTypes);
    } catch (error) {
      console.error("Error fetching all payroll types:", error);
      res.status(500).json({ error: "Failed to fetch payroll types" });
    }
  }
}
