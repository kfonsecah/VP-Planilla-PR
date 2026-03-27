import { Router } from "express";
import { AuditLogsController } from "../controller/AuditLogsController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   GET /audit-logs
 * @desc    Get audit logs with optional filters
 * @access  Private
 */
/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit logs
 *     description: Retrieve audit logs with optional filtering
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (partial match)
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter by entity type (partial match)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       '200':
 *         description: Audit logs retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/audit-logs", asyncHandler(AuditLogsController.getAuditLogs));

/**
 * @route   GET /audit-logs/:id
 * @desc    Get audit log by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit log by ID
 *     description: Retrieve a specific audit log by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID
 *     responses:
 *       '200':
 *         description: Audit log retrieved successfully
 *       '404':
 *         description: Audit log not found
 *       '500':
 *         description: Internal server error
 */
router.get("/audit-logs/:id", asyncHandler(AuditLogsController.getAuditLogById));

export default router;
