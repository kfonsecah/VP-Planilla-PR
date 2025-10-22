import { Request, Response } from "express";
import { BonusesService } from "../service/BonusesService";

export class BonusesController {
  /**
   * Create a new bonus
   * POST /bonuses
   */
  static async createBonus(req: Request, res: Response): Promise<Response> {
    try {
      const bonusData = req.body;
      const newBonus = await BonusesService.createBonus(bonusData);
      return res.status(201).json({
        success: true,
        data: newBonus,
        message: "Bonus created successfully"
      });
    } catch (error) {
      console.error("Error creating bonus:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to create bonus" 
      });
    }
  }

  /**
   * Get bonus by ID
   * GET /bonuses/:id
   */
  static async getBonusById(req: Request, res: Response): Promise<Response> {
    try {
      const bonusId = parseInt(req.params.id, 10);
      
      if (isNaN(bonusId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid bonus ID" 
        });
      }

      const bonus = await BonusesService.getBonusById(bonusId);
      
      if (!bonus) {
        return res.status(404).json({ 
          success: false,
          error: "Bonus not found" 
        });
      }

      return res.status(200).json({
        success: true,
        data: bonus
      });
    } catch (error) {
      console.error("Error retrieving bonus:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to retrieve bonus" 
      });
    }
  }

  /**
   * Update bonus
   * PUT /bonuses/:id
   */
  static async updateBonus(req: Request, res: Response): Promise<Response> {
    try {
      const bonusId = parseInt(req.params.id, 10);
      const bonusData = req.body;

      if (isNaN(bonusId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid bonus ID" 
        });
      }

      const updatedBonus = await BonusesService.updateBonus(bonusId, bonusData);
      
      if (!updatedBonus) {
        return res.status(404).json({ 
          success: false,
          error: "Bonus not found" 
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedBonus,
        message: "Bonus updated successfully"
      });
    } catch (error) {
      console.error("Error updating bonus:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to update bonus" 
      });
    }
  }

  /**
   * Delete bonus
   * DELETE /bonuses/:id
   */
  static async deleteBonus(req: Request, res: Response): Promise<Response> {
    try {
      const bonusId = parseInt(req.params.id, 10);

      if (isNaN(bonusId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid bonus ID" 
        });
      }

      const deletedBonus = await BonusesService.deleteBonus(bonusId);
      
      if (!deletedBonus) {
        return res.status(404).json({ 
          success: false,
          error: "Bonus not found" 
        });
      }

      return res.status(200).json({
        success: true,
        data: deletedBonus,
        message: "Bonus deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting bonus:", error);
      return res.status(500).json({ 
        success: false,
        error: "Failed to delete bonus" 
      });
    }
  }
}