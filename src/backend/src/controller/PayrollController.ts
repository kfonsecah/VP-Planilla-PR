import { Request, Response } from "express";
import { PayrollService } from "../service/PayrollService";
import { AuditLogsService } from "../service/AuditLogsService";

export class PayrollController {
  /**
   * Get all payrolls
   * GET /payrolls
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with all payrolls or error
   */
  static async getAllPayrolls(req: Request, res: Response) {
    try {
      const payrolls = await PayrollService.getAllPayrolls();
      res.json({
        success: true,
        data: payrolls
      });
    } catch (error) {
      console.error("Failed to retrieve payrolls:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to retrieve payrolls" 
      });
    }
  }

  /**
   * Create a new payroll in the system
   * POST /payroll/create
   * @param req - Express request object containing payroll data
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with created payroll data or error
   */
  static async createPayroll(req: Request, res: Response) {
    try {
      // Map frontend field names to backend model
      const payrollData = {
        id: 0, // Will be assigned by database
        payroll_type: req.body.payroll_type_id || req.body.payroll_type,
        period_start: new Date(req.body.period_start),
        period_end: new Date(req.body.period_end),
        payment_date: req.body.payment_date ? new Date(req.body.payment_date) : new Date(),
        status: req.body.status || 'PENDIENTE',
        version: 1
      };
      
      const payroll = await PayrollService.createPayroll(payrollData);
      await AuditLogsService.createAuditLog({
        userId: req.user.id,
        action: 'CREATE_PAYROLL',
        entity: 'payroll',
        entityId: payroll.id,
        details: `Period: ${payrollData.period_start.toISOString().split('T')[0]} to ${payrollData.period_end.toISOString().split('T')[0]}`,
      });
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

  /**
   * Approve a payroll
   * POST /payroll/:id/approve
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with approved payroll or error
   */
  static async approvePayroll(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      const userId = req.user.id;
      
      const payroll = await PayrollService.approvePayroll(payrollId, userId);
      
      res.json({
        success: true,
        data: payroll
      });
    } catch (error: any) {
      console.error("Failed to approve payroll:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to approve payroll"
      });
    }
  }

  /**
   * Mark a payroll as paid
   * POST /payroll/:id/pay
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with paid payroll or error
   */
  static async markAsPaid(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      
      const payroll = await PayrollService.markAsPaid(payrollId);
      
      res.json({
        success: true,
        data: payroll
      });
    } catch (error: any) {
      console.error("Failed to mark payroll as paid:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to mark payroll as paid"
      });
    }
  }

  /**
   * Reopen a payroll
   * POST /payroll/:id/reopen
   * @param req - Express request object containing reason in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with reopened payroll or error
   */
  static async reopenPayroll(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      const { reason } = req.body;
      const userId = req.user.id;
      
      if (!reason || reason.length < 10) {
        return res.status(400).json({
          success: false,
          error: "El motivo de reopening debe tener al menos 10 caracteres"
        });
      }
      
      const payroll = await PayrollService.reopenPayroll(payrollId, userId, reason);
      
      res.json({
        success: true,
        data: payroll
      });
    } catch (error: any) {
      console.error("Failed to reopen payroll:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to reopen payroll"
      });
    }
  }

  /**
   * Recalculate a payroll
   * POST /payroll/:id/recalculate
   * @param req - Express request object containing reason in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with recalculated payroll or error
   */
  static async recalculatePayroll(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      const { reason } = req.body;
      const userId = req.user.id;
      
      const payroll = await PayrollService.recalculatePayroll(payrollId, userId, reason || 'Recálculo manual');
      
      res.json({
        success: true,
        data: payroll
      });
    } catch (error: any) {
      console.error("Failed to recalculate payroll:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to recalculate payroll"
      });
    }
  }

  /**
   * Calculate aguinaldo for an employee
   * GET /payroll/aguinaldo/:employeeId/:year
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with aguinaldo calculation or error
   */
  static async calculateAguinaldo(req: Request, res: Response) {
    try {
      const employeeId = Number(req.params.employeeId);
      const year = Number(req.params.year);
      
      const result = await PayrollService.calculateAguinaldo(employeeId, year);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error("Failed to calculate aguinaldo:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to calculate aguinaldo"
      });
    }
  }
}
