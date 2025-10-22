import { Request, Response } from "express";
import { ClockLogsService } from "../service/ClockLogsService";

export class ClockLogsController {
    /**
     * Get clock logs within a specified date range
     * GET /clock-logs?initDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * @param req - Express request object containing initDate and endDate query parameters
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with clock logs data or error
     */
    async getClockLogs(req: Request, res: Response): Promise<Response> {
        const { initDate, endDate } = req.query;
        let nomineeLogs;

        if (!initDate || !endDate) {
            return res.status(400).json({ error: "initDate and endDate are required" });
        }

        const service = new ClockLogsService();
        try {
            const logs = await service.getClockLogs({
                initDate: new Date(initDate as string),
                endDate: new Date(endDate as string)
            });
            return res.json(logs);
            nomineeLogs = logs;

        } catch (error) {
            return res.status(500).json({ error: "Internal server error" });
        }
    }

}