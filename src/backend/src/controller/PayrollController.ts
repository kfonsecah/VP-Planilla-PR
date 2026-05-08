import { Request, Response } from "express";
import { PayrollService } from "../service/PayrollService";
import { AuditLogsService } from "../service/AuditLogsService";
import { AguinaldoService } from "../service/AguinaldoService";
import { PayslipDispatchService } from "../service/PayslipDispatchService";
import { PayslipDownloadService } from "../service/PayslipDownloadService";

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
   * Get payroll with parameter snapshot captured at approval time.
   * GET /payroll/:id/snapshot
   * @param req - Express request object with payrollId in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with { payroll, snapshot } or error
   */
  static async getPayrollSnapshot(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      if (!Number.isInteger(payrollId) || payrollId <= 0) {
        return res.status(400).json({ success: false, error: 'ID de planilla inválido' });
      }
      const result = await PayrollService.getPayrollWithSnapshot(payrollId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Failed to retrieve payroll snapshot:', error);
      const is404 = error instanceof Error && error.message === 'Payroll not found';
      res.status(is404 ? 404 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payroll snapshot',
      });
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
      const userId = req.user.id;

      const payroll = await PayrollService.markAsPaid(payrollId, userId);

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
   * Download the payslip PDF for a single employee on demand.
   * GET /payrolls/:payrollId/payslip/:employeeId/pdf
   * @param req - Express request with payrollId and employeeId in params
   * @param res - Express response — streams PDF buffer or JSON error
   * @returns Promise<void>
   */
  static async downloadPayslipPdf(req: Request, res: Response): Promise<void> {
    const payrollId = parseInt(String(req.params.payrollId), 10);
    const employeeId = parseInt(String(req.params.employeeId), 10);

    if (isNaN(payrollId) || isNaN(employeeId)) {
      res.status(400).json({ success: false, error: 'IDs de planilla o empleado inválidos' });
      return;
    }

    try {
      const { buffer, filename } = await PayslipDownloadService.generatePayslipBuffer(payrollId, employeeId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      console.error(`[PayslipDownload] Error generando comprobante payrollId=${payrollId} employeeId=${employeeId}:`, error);
      res.status(500).json({ success: false, error: 'No se pudo generar el comprobante' });
    }
  }

  /**
   * Resend a payslip to a single employee
   * POST /payrolls/:id/resend-payslip/:employeeId
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response>
   */
  static async resendPayslip(req: Request, res: Response): Promise<Response> {
    const payrollId = parseInt(String(req.params.id), 10);
    const employeeId = parseInt(String(req.params.employeeId), 10);

    if (isNaN(payrollId) || isNaN(employeeId)) {
      return res.status(400).json({ success: false, error: 'IDs de planilla o empleado inválidos' });
    }

    try {
      const result = await PayslipDispatchService.resendPayslip(payrollId, employeeId, req.user.id);
      if (!result.success) {
        return res.status(422).json({ success: false, error: result.message });
      }
      return res.json({ success: true, message: result.message });
    } catch (error: any) {
      console.error("Failed to resend payslip:", error);
      return res.status(500).json({ success: false, error: error.message || "Error al reenviar comprobante" });
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

      // Note: AguinaldoService.calculateAccruedAguinaldo uses a reference date
      // instead of just a year to determine the fiscal period.
      // Reference date is set to Nov 30 of target year to cover the full fiscal period.
      const asOfDate = new Date(year, 10, 30); 
      const result = await AguinaldoService.calculateAccruedAguinaldo(employeeId, asOfDate);

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
  }  /**
   * Save per-employee hours/deduction override for a payroll
   * PATCH /payroll/:id/employee/:empId/override
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with updated payroll_employee or error
   */
  static async saveEmployeeOverride(req: Request, res: Response): Promise<Response> {
    const payrollId = parseInt(String(req.params.id), 10);
    const employeeId = parseInt(String(req.params.empId), 10);

    if (isNaN(payrollId) || isNaN(employeeId)) {
      return res.status(400).json({ success: false, error: 'IDs de planilla o empleado inválidos' });
    }

    const { regularHours, overtimeHours, weeklyRestHours, totalDeductions } = req.body;

    try {
      const result = await PayrollService.saveEmployeeOverride(payrollId, employeeId, {
        regularHours: regularHours !== undefined ? Number(regularHours) : undefined,
        overtimeHours: overtimeHours !== undefined ? Number(overtimeHours) : undefined,
        weeklyRestHours: weeklyRestHours !== undefined ? Number(weeklyRestHours) : undefined,
        totalDeductions: totalDeductions !== undefined ? Number(totalDeductions) : undefined,
      });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar ajuste de empleado';
      return res.status(400).json({ success: false, error: message });
    }
  }

  /**
   * Get aguinaldo accrual for an employee
   * GET /api/employees/:id/aguinaldo
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response>
   */
  static async getEmployeeAguinaldo(req: Request, res: Response) {
    try {
      const employeeId = Number(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ success: false, error: "ID de empleado inválido" });
      }

      const result = await AguinaldoService.calculateAccruedAguinaldo(employeeId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error("Failed to calculate employee aguinaldo:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to calculate employee aguinaldo"
      });
    }
  }

  /**
   * Get aguinaldo summary for a payroll
   * GET /api/payroll/:id/aguinaldo-summary
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response>
   */
  static async getAguinaldoSummary(req: Request, res: Response) {
    try {
      const payrollId = Number(req.params.id);
      if (isNaN(payrollId)) {
        return res.status(400).json({ success: false, error: "ID de planilla inválido" });
      }

      const result = await AguinaldoService.getAguinaldoSummaryForPayroll(payrollId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error("Failed to get aguinaldo summary:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get aguinaldo summary"
      });
    }
  }

  /**
   * Get aguinaldo projection for all active employees (or a single one).
   * GET /api/aguinaldo/projection?employeeId=&fiscalYear=
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response>
   */
  static async getAguinaldoProjection(req: Request, res: Response) {
    try {
      const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
      const fiscalYear  = req.query.fiscalYear  ? Number(req.query.fiscalYear)  : undefined;

      if (employeeId !== undefined && isNaN(employeeId)) {
        return res.status(400).json({ success: false, error: "employeeId inválido" });
      }
      if (fiscalYear !== undefined && isNaN(fiscalYear)) {
        return res.status(400).json({ success: false, error: "fiscalYear inválido" });
      }

      const result = await AguinaldoService.getProjection(employeeId, fiscalYear);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("Failed to get aguinaldo projection:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get aguinaldo projection",
      });
    }
  }
}
