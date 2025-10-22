import { Request, Response } from "express";
import { NomineeService } from "../service/NomineeService";

export class NomineeController {
  /**
   * Get clock logs for nominee calculation
   * GET /nominee/clocklogs?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getClockLogs(req: Request, res: Response): Promise<Response> {
    try {
      const nomineeService = new NomineeService();
      return await nomineeService.getClockLogs(req, res);
    } catch (error) {
      console.error("Error getting clock logs for nominee:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to retrieve clock logs for nominee calculation" 
      });
    }
  }

  /**
   * Get employee deductions for nominee calculation
   * GET /nominee/employee-deductions/:employeeId
   */
  static async getEmployeeDeductions(req: Request, res: Response): Promise<Response> {
    try {
      const employeeId = parseInt(req.params.employeeId, 10);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid employee ID" 
        });
      }

      const nomineeService = new NomineeService();
      const deductions = await nomineeService.getEmployeeDeductions(employeeId);

      return res.status(200).json({
        success: true,
        data: deductions
      });
    } catch (error) {
      console.error("Error getting employee deductions:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to retrieve employee deductions" 
      });
    }
  }

  /**
   * Calculate nominee for payroll (legacy method)
   * POST /nominee/calculate
   */
  static async calculateNominee(req: Request, res: Response): Promise<Response> {
    try {
      const nomineeService = new NomineeService();
      await nomineeService.calculateNominee();

      return res.status(200).json({
        success: true,
        message: "Cálculo de nómina completado exitosamente"
      });
    } catch (error) {
      console.error("Error calculating nominee:", error);
      return res.status(500).json({ 
        success: false,
        error: "Error al calcular la nómina" 
      });
    }
  }

  /**
   * Calculate complete payroll for all employees in a given period
   * POST /nominee/calculate-payroll
   */
  static async calculatePayrollForPeriod(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: "Las fechas de inicio y fin son requeridas"
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Formato de fecha inválido. Use YYYY-MM-DD"
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: "La fecha de inicio debe ser anterior a la fecha de fin"
        });
      }

      const nomineeService = new NomineeService();
      const result = await nomineeService.calculatePayrollForPeriod(start, end);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Cálculo de nómina del periodo completado exitosamente"
      });
    } catch (error) {
      console.error("Error calculating payroll for period:", error);
      return res.status(500).json({ 
        success: false,
        error: "Error al calcular la nómina del periodo",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  }
}