import { Router } from "express";
import { ClockLogsController } from "../controller/ClockLogsController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const controller = new ClockLogsController();

/**
 * @route   GET /clock-logs
 * @desc    Get clock logs with date range filter
 * @access  Private
 */
/**
 * @swagger
 * /api/clock-logs:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get clock logs
 *     description: Retrieve clock logs within a specified date range
 *     parameters:
 *       - in: query
 *         name: initDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       '200':
 *         description: Clock logs retrieved successfully
 *       '400':
 *         description: Missing required parameters
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs", asyncHandler((req, res) => controller.getClockLogs(req, res)));

export default router;
