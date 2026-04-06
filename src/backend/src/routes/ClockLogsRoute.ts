import { Router } from "express";
import { ClockLogsController } from "../controller/ClockLogsController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { validateBody } from '../middleware/validateBody';
import { bulkCreateClockLogSchema, resolveOrphanSchema, createManualLogSchema, updateClockLogStatusSchema } from '../schemas/ClockLogSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);
const controller = new ClockLogsController();

/**
 * @swagger
 * /api/clock-logs/import-sessions:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get recent import sessions
 *     description: Retrieve the most recent clock log import sessions ordered by most recent first
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of sessions to return
 *     responses:
 *       '200':
 *         description: Import sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs/import-sessions", asyncHandler((req, res) => controller.getImportSessions(req, res)));

/**
 * @swagger
 * /api/clock-logs/paginated:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get paginated clock logs with filters
 *     description: Retrieve paginated clock logs with optional status, employee_id, and date range filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: initDate
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated status values (e.g. orphan,anomaly)
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *     responses:
 *       '200':
 *         description: Paginated clock logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       '400':
 *         description: Invalid date format
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs/paginated", asyncHandler((req, res) => controller.getClockLogsPaginated(req, res)));

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

/**
 * @route   GET /clock-logs/stats
 * @desc    Get clock log stats grouped by status and source
 * @access  Private
 */
/**
 * @swagger
 * /api/clock-logs/stats:
 *   get:
 *     tags:
 *       - Clock Logs
 *     summary: Get clock log stats
 *     description: Retrieve aggregated counts of clock logs grouped by status and source within a date range
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
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: object
 *                     bySource:
 *                       type: object
 *                     total:
 *                       type: integer
 *       '400':
 *         description: Missing required parameters
 *       '500':
 *         description: Internal server error
 */
router.get("/clock-logs/stats", asyncHandler((req, res) => controller.getStats(req, res)));

/**
 * @swagger
 * /api/clock-logs/orphans:
 *   get:
 *     tags: [Clock Logs]
 *     summary: Get orphan clock logs
 *     description: Returns paginated list of clock logs with status 'orphan' (IN without matching OUT or vice versa)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: initDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200': { description: Orphan logs retrieved successfully }
 */
router.get("/clock-logs/orphans", asyncHandler((req, res) => controller.getOrphans(req, res)));

/**
 * @swagger
 * /api/clock-logs/anomalies:
 *   get:
 *     tags: [Clock Logs]
 *     summary: Get anomaly clock logs
 *     description: Returns paginated list of clock logs with status 'anomaly' (double entry, double exit, or long sessions)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: initDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       '200': { description: Anomaly logs retrieved successfully }
 */
router.get("/clock-logs/anomalies", asyncHandler((req, res) => controller.getAnomalies(req, res)));

router.post("/clock-logs/bulk", validateBody(bulkCreateClockLogSchema), asyncHandler((req, res) => controller.bulkCreate(req, res)));

/**
 * @swagger
 * /api/clock-logs/import:
 *   post:
 *     tags:
 *       - Clock Logs
 *     summary: Import clock logs with session tracking
 *     description: Creates an import session, bulk-creates clock logs with session reference, and returns session summary with created/skipped/anomaly counts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 description: Array of clock log records to import
 *                 items:
 *                   type: object
 *                   properties:
 *                     employee_id:
 *                       type: integer
 *                     employee_name:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     log_type:
 *                       type: string
 *                       enum: [IN, OUT, ENTRADA, SALIDA]
 *                     remarks:
 *                       type: string
 *               source:
 *                 type: string
 *                 enum: [java_import, excel_import, manual]
 *                 default: excel_import
 *     responses:
 *       '201':
 *         description: Import completed — returns session summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   enum: [completed, partial, failed]
 *                 created:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 anomalies:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       '400':
 *         description: Invalid input — logs array missing or empty
 *       '500':
 *         description: Internal server error
 */
router.post("/clock-logs/import", asyncHandler((req, res) => controller.import(req, res)));

/**
 * @swagger
 * /api/clock-logs/orphans/{id}/resolve:
 *   post:
 *     tags: [Clock Logs]
 *     summary: Resolve an orphan clock log
 *     description: Either assign a complementary manual clock log or discard the orphan with justification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
  *             required:
  *               - action
  *               - justification
  *             properties:
 *               action:
 *                 type: string
 *                 enum: [assign_complement, discard]
 *               justification:
 *                 type: string
 *                 maxLength: 500
 *               complementTimestamp:
 *                 type: string
 *                 format: date-time
 *               complementLogType:
 *                 type: string
 *                 enum: [IN, OUT]
 *     responses:
 *       '200': { description: Orphan resolved successfully }
 *       '400': { description: Invalid request or log is not an orphan }
 *       '404': { description: Clock log not found }
 */
router.post("/clock-logs/orphans/:id/resolve", validateBody(resolveOrphanSchema), asyncHandler((req, res) => controller.resolveOrphan(req, res)));

/**
 * @swagger
 * /api/clock-logs/correct:
 *   post:
 *     tags:
 *       - Clock Logs
 *     summary: Create manual clock log
 *     description: Create a manual clock log entry with justification. Source is always manual.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - timestamp
 *               - log_type
 *               - justification
 *             properties:
 *               employee_id:
 *                 type: integer
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               log_type:
 *                 type: string
 *                 enum: [IN, OUT]
 *               remarks:
 *                 type: string
 *               justification:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       '201':
 *         description: Manual clock log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 clockLogId:
 *                   type: integer
 *       '400':
 *         description: Invalid input (validation error)
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden (non-admin)
 *       '404':
 *         description: Employee not found
 *       '500':
 *         description: Internal server error
 */
router.post("/clock-logs/correct", AuthMiddleware.requireRole(['admin']), validateBody(createManualLogSchema), asyncHandler((req, res) => controller.createManualLog(req, res)));

/**
 * @swagger
 * /api/clock-logs/:id/status:
 *   patch:
 *     tags:
 *       - Clock Logs
 *     summary: Update clock log status
 *     description: Change status (e.g., to corrected) with justification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - justification
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [corrected]
 *               justification:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       '200':
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '400':
 *         description: Invalid request (bad ID or validation error)
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden (non-admin)
 *       '404':
 *         description: Clock log not found
 *       '500':
 *         description: Internal server error
 */
router.patch("/clock-logs/:id/status", AuthMiddleware.requireRole(['admin']), validateBody(updateClockLogStatusSchema), asyncHandler((req, res) => controller.updateClockLogStatus(req, res)));

export default router;
