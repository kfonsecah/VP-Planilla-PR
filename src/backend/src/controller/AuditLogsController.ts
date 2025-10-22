import { Request, Response } from "express";
import { AuditLogsService } from "../service/AuditLogsService";

export class AuditLogsController {
  /**
   * Get audit logs with optional filters
   * GET /audit-logs
   */
  static async getAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const filters: any = {};

      if (req.query.userId) {
        filters.userId = parseInt(req.query.userId as string, 10);
      }

      if (req.query.action) {
        filters.action = req.query.action as string;
      }

      if (req.query.entity) {
        filters.entity = req.query.entity as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }

      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string, 10);
      }

      const result = await AuditLogsService.getAuditLogs(filters);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error getting audit logs:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve audit logs",
      });
    }
  }

  /**
   * Get audit log by ID
   * GET /audit-logs/:id
   */
  static async getAuditLogById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid audit log ID",
        });
      }

      const log = await AuditLogsService.getAuditLogById(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          error: "Audit log not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error("Error getting audit log:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve audit log",
      });
    }
  }
}
