import { Request, Response } from "express";
import { PayrollService } from "../service/PayrollService";

export class PayrollController {
  /**
   * Create a new payroll in the system
   * POST /payroll/create
   * @param req - Express request object containing payroll data
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with created payroll data or error
   */
  static async createPayroll(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.createPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error) {
      console.error("Failed to create payroll:", error);
      res.status(500).json({ error: "Failed to create payroll" });
    }
  }

  /**
   * Get payroll by ID
   * GET /payroll/:id
   * @param req - Express request object containing payroll ID in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with payroll data or error
   */
  static async getPayrollById(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.getPayrollById(
        Number(req.params.id)
      );
      if (!payroll) return res.status(404).json({ error: "Payroll not found" });
      res.json(payroll);
    } catch (error) {
        console.error("Failed to retrieve payroll:", error);
      res.status(500).json({ error: "Failed to retrieve payroll" });
    }
  }

  /**
   * Update an existing payroll
   * PUT /payroll/:id
   * @param req - Express request object containing payroll ID in params and update data in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with updated payroll data or error
   */
  static async updatePayroll(req: Request, res: Response) {
    try {
      const payroll = await PayrollService.updatePayroll(
        Number(req.params.id),
        req.body
      );
      if (!payroll) return res.status(404).json({ error: "Payroll not found" });
      res.json(payroll);
    } catch (error) {
        console.error("Failed to update payroll:", error);
      res.status(500).json({ error: "Failed to update payroll" });
    }
  }

  /**
   * Get employees for a specific payroll
   * GET /payroll/:id/employees
   * @param req - Express request object containing payroll ID in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with payroll employees data or error
   */
  static async getPayrollEmployees(req: Request, res: Response) {
    try {
      const employees = await PayrollService.getPayrollEmployees(
        Number(req.params.id)
      );
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error("Failed to retrieve payroll employees:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to retrieve payroll employees" 
      });
    }
  }
}
