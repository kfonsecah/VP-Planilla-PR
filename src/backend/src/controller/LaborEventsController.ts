import { Request, Response } from "express";
import { LaborEventsService } from "../service/LaborEventsService";
import { EmployeeLaborEvent } from "../model/employeeLaborEvent";

export class LaborEventsController {
  /**
   * Create a new labor event in the system
   * POST /labor-events/create
   * @param req - Express request object containing labor event data
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with created labor event data or error
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
   * Get all labor events from the system
   * GET /labor-events
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with array of labor events or error
   */
  static async getAllLaborEvents(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      // Return both event types and assignments for the calendar
      const laborEvents = await LaborEventsService.getAllLaborEvents();
      const employeeEvents = await LaborEventsService.getAllEmployeeLaborEvents();
      return res.status(200).json({ laborEvents, employeeEvents });
    } catch (error) {
      console.error("Failed to retrieve labor events:", error);
      return res.status(500).json({ error: "Failed to retrieve labor events" });
    }
  }

  /**
   * Update an existing labor event
   * PUT /labor-events/:id
   * @param req - Express request object containing labor event ID in params and update data in body
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with updated labor event data or error
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
   * Delete a labor event by ID
   * DELETE /labor-events/:id
   * @param req - Express request object containing labor event ID in params
   * @param res - Express response object
   * @returns Promise<Response> - HTTP response with success status or error
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
   * @param req - Express request object containing assignment data (employee_id, labor_event_id, dates, status)
   * @param res - Express response object
   * @returns Promise<void> - HTTP response with assignment result or error
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

  /**
   * Delete an employee labor event assignment
   * DELETE /labor-events/assign/:id
   */
  static async deleteEmployeeLaborEvent(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const deleted = await LaborEventsService.deleteEmployeeLaborEvent(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Employee labor event not found' });
      }

      return res.status(200).json({ message: 'Deleted', deleted });
    } catch (error) {
      console.error('Error deleting employee labor event', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
