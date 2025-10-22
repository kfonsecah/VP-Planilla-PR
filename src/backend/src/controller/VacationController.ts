import { Request, Response } from "express";
import { VacationService } from "../service/VacationService";

export class VacationController {
  /**
   * Create a new vacation
   * POST /vacations
   */
  static async createVacation(req: Request, res: Response): Promise<Response> {
    try {
      const vacationData = req.body;
      const newVacation = await VacationService.createVacation(vacationData);
      
      return res.status(201).json({
        success: true,
        data: newVacation,
        message: "Vacation created successfully"
      });
    } catch (error) {
      console.error("Error creating vacation:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to create vacation" 
      });
    }
  }

  /**
   * Get vacation by ID
   * GET /vacations/:id
   */
  static async getVacationById(req: Request, res: Response): Promise<Response> {
    try {
      const vacationId = parseInt(req.params.id, 10);
      
      if (isNaN(vacationId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid vacation ID" 
        });
      }

      const vacation = await VacationService.getVacationById(vacationId);
      
      if (!vacation) {
        return res.status(404).json({ 
          success: false,
          error: "Vacation not found" 
        });
      }

      return res.status(200).json({
        success: true,
        data: vacation
      });
    } catch (error) {
      console.error("Error retrieving vacation:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to retrieve vacation" 
      });
    }
  }

  /**
   * Get all vacations
   * GET /vacations
   */
  static async getAllVacations(req: Request, res: Response): Promise<Response> {
    try {
      const vacations = await VacationService.getAllVacations();
      
      return res.status(200).json({
        success: true,
        data: vacations
      });
    } catch (error) {
      console.error("Error retrieving vacations:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to retrieve vacations" 
      });
    }
  }

  /**
   * Update vacation
   * PUT /vacations/:id
   */
  static async updateVacation(req: Request, res: Response): Promise<Response> {
    try {
      const vacationId = parseInt(req.params.id, 10);
      const vacationData = req.body;

      if (isNaN(vacationId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid vacation ID" 
        });
      }

      const updatedVacation = await VacationService.updateVacation(vacationId, vacationData);
      
      if (!updatedVacation) {
        return res.status(404).json({ 
          success: false,
          error: "Vacation not found" 
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedVacation,
        message: "Vacation updated successfully"
      });
    } catch (error) {
      console.error("Error updating vacation:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to update vacation" 
      });
    }
  }

  /**
   * Delete vacation
   * DELETE /vacations/:id
   */
  static async deleteVacation(req: Request, res: Response): Promise<Response> {
    try {
      const vacationId = parseInt(req.params.id, 10);

      if (isNaN(vacationId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid vacation ID" 
        });
      }

      const deleted = await VacationService.deleteVacation(vacationId);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false,
          error: "Vacation not found" 
        });
      }

      return res.status(200).json({
        success: true,
        message: "Vacation deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting vacation:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to delete vacation" 
      });
    }
  }
}