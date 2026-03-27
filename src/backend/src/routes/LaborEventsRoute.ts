import { Router } from "express";
import { LaborEventsController } from "../controller/LaborEventsController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   POST /labor-events/create
 * @desc    Create a new labor event
 * @access  Private
 */
/**
 * @swagger
 * /api/labor-events/create:
 *   post:
 *     tags:
 *       - Labor Events
 *     summary: Create a new labor event
 *     description: Create a new labor event in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - event_type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Labor event name
 *                 example: "Overtime Work"
 *               description:
 *                 type: string
 *                 description: Labor event description
 *                 example: "Additional hours worked beyond regular schedule"
 *               event_type:
 *                 type: string
 *                 description: Type of labor event
 *                 example: "overtime"
 *     responses:
 *       '201':
 *         description: Labor event created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/labor-events/create", asyncHandler(LaborEventsController.createLaborEvent));

/**
 * @route   GET /labor-events
 * @desc    Get all labor events
 * @access  Private
 */
/**
 * @swagger
 * /api/labor-events:
 *   get:
 *     tags:
 *       - Labor Events
 *     summary: Get all labor events
 *     description: Retrieve all labor events from the system
 *     responses:
 *       '200':
 *         description: Labor events retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/labor-events", asyncHandler(LaborEventsController.getAllLaborEvents));

/**
 * @route   PUT /labor-events/:id
 * @desc    Update labor event by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/labor-events/{id}:
 *   put:
 *     tags:
 *       - Labor Events
 *     summary: Update labor event
 *     description: Update an existing labor event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Labor event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Labor event name
 *               description:
 *                 type: string
 *                 description: Labor event description
 *               event_type:
 *                 type: string
 *                 description: Type of labor event
 *     responses:
 *       '200':
 *         description: Labor event updated successfully
 *       '404':
 *         description: Labor event not found
 *       '500':
 *         description: Internal server error
 */
router.put("/labor-events/:id", asyncHandler(LaborEventsController.updateLaborEvent));

/**
 * @route   DELETE /labor-events/:id
 * @desc    Delete labor event by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/labor-events/{id}:
 *   delete:
 *     tags:
 *       - Labor Events
 *     summary: Delete labor event
 *     description: Delete a labor event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Labor event ID
 *     responses:
 *       '200':
 *         description: Labor event deleted successfully
 *       '404':
 *         description: Labor event not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/labor-events/:id", asyncHandler(LaborEventsController.deleteLaborEvent));

/**
 * @route   POST /labor-events/assign
 * @desc    Assign labor events to employee
 * @access  Private
 */
/**
 * @swagger
 * /api/labor-events/assign:
 *   post:
 *     tags:
 *       - Labor Events
 *     summary: Assign labor events to employee
 *     description: Assign one or more labor events to a specific employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - labor_event_ids
 *             properties:
 *               employee_id:
 *                 type: number
 *                 description: Employee ID
 *                 example: 1
 *               labor_event_ids:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of labor event IDs to assign
 *                 example: [1, 2, 3]
 *     responses:
 *       '200':
 *         description: Labor events assigned successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/labor-events/assign", asyncHandler(LaborEventsController.assignLaborEventsToEmployee));

export default router;
