import { Request, Response } from "express";
import { LaborEventsService } from "../service/LaborEventsService";
import { EmployeeLaborEvent } from "../model/employeeLaborEvent";

export class LaborEventsController {
  /**
   * Create new Labor Event
   * POST /labor-events/create
   */

  static async createLaborEvent(
    req: Request,
    res: Response
  ): Promise<Response> {
    const laborData = req.body;

    try {
      const newLaborEvent = await LaborEventsService.createLaborEvent(
        laborData
      );
      return res.status(201).json(newLaborEvent);
    } catch (error) {
      console.error("Failed to create a labor event:", error);
      return res.status(500).json({ error: "Failed to create a labor event" });
    }
  }

  /**
   * Get all Labor Events
   * GET /labor-events
   */
  static async getAllLaborEvents(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const laborEvents = await LaborEventsService.getAllLaborEvents();
      return res.status(200).json(laborEvents);
    } catch (error) {
      console.error("Failed to retrieve labor events:", error);
      return res.status(500).json({ error: "Failed to retrieve labor events" });
    }
  }

  /**
   *  Update Labor Event
   * PUT /labor-events/:id
   */
  static async updateLaborEvent(
    req: Request,
    res: Response
  ): Promise<Response> {
    const laborEventId = parseInt(req.params.id, 10);
    const laborEventData = req.body;

    try {
      const updatedLaborEvent = await LaborEventsService.updateLaborEvent(
        laborEventId,
        laborEventData
      );
      if (!updatedLaborEvent) {
        return res.status(404).json({ error: "Labor event not found" });
      }
      return res.status(200).json(updatedLaborEvent);
    } catch (error) {
      console.error("Failed to update labor event:", error);
      return res.status(500).json({ error: "Failed to update labor event" });
    }
  }

  /**
   * Delete Labor Event
   * DELETE /labor-events/:id
   */
  static async deleteLaborEvent(
    req: Request,
    res: Response
  ): Promise<Response> {
    const laborEventId = parseInt(req.params.id, 10);

    try {
      const deleted = await LaborEventsService.deleteLaborEvent(laborEventId);
      if (!deleted) {
        return res.status(404).json({ error: "Labor event not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("Failed to delete labor event:", error);
      return res.status(500).json({ error: "Failed to delete labor event" });
    }
  }

  /**
   * Assign labor events to an employee
   * POST /labor-events/assign
   */
  static async assignLaborEventsToEmployee(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { employee_id, labor_event_id, start_date, end_date, status } =
        req.body;

      // Convert date strings to Date objects
      const startDate = new Date(start_date);
      const endDate = end_date ? new Date(end_date) : null;

      if (isNaN(startDate.getTime()) || (end_date && isNaN(endDate!.getTime()))) {
        res.status(400).json({ message: "Invalid date format. Please use ISO-8601 format." });
        return;
      }

      const eventData: EmployeeLaborEvent = {
        employee_id,
        labor_event_id,
        start_date: startDate,
        end_date: endDate,
        status,
        // You might need to provide default/dummy values for these if they are required by the interface
        id: 0, 
        version: 0,
      };

      const result = await LaborEventsService.assignLaborEventsToEmployee(
        eventData
      );
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Failed to assign labor events to employee:", error);
      res.status(500).json({
        message: "Failed to assign labor events to employee",
        error: error.message,
      });
    }
  }
}
