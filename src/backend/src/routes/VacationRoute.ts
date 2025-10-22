import { Router } from "express";
import { VacationController } from "../controller/VacationController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   POST /vacations
 * @desc    Create a new vacation request for an employee
 * @access  Private
 */
/**
 * @swagger
 * /api/vacations:
 *   post:
 *     tags:
 *       - Vacations
 *     summary: Create a new vacation
 *     description: Create a new vacation request for an employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - start_date
 *               - end_date
 *             properties:
 *               employee_id:
 *                 type: number
 *                 description: ID of the employee
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Vacation start date
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Vacation end date
 *               total_days:
 *                 type: number
 *                 description: Total vacation days
 *               paid:
 *                 type: boolean
 *                 description: Whether vacation is paid
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 description: Vacation status
 *     responses:
 *       '201':
 *         description: Vacation created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/vacations", asyncHandler(VacationController.createVacation));

/**
 * @route   GET /vacations
 * @desc    Get all vacation records
 * @access  Private
 */
/**
 * @swagger
 * /api/vacations:
 *   get:
 *     tags:
 *       - Vacations
 *     summary: Get all vacations
 *     description: Retrieve all vacation records
 *     responses:
 *       '200':
 *         description: Vacations retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/vacations", asyncHandler(VacationController.getAllVacations));

/**
 * @route   GET /vacations/:id
 * @desc    Get vacation by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/vacations/{id}:
 *   get:
 *     tags:
 *       - Vacations
 *     summary: Get vacation by ID
 *     description: Retrieve a specific vacation by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vacation ID
 *     responses:
 *       '200':
 *         description: Vacation retrieved successfully
 *       '404':
 *         description: Vacation not found
 *       '500':
 *         description: Internal server error
 */
router.get("/vacations/:id", asyncHandler(VacationController.getVacationById));

/**
 * @route   PUT /vacations/:id
 * @desc    Update an existing vacation
 * @access  Private
 */
/**
 * @swagger
 * /api/vacations/{id}:
 *   put:
 *     tags:
 *       - Vacations
 *     summary: Update vacation
 *     description: Update an existing vacation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vacation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               total_days:
 *                 type: number
 *               paid:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       '200':
 *         description: Vacation updated successfully
 *       '404':
 *         description: Vacation not found
 *       '500':
 *         description: Internal server error
 */
router.put("/vacations/:id", asyncHandler(VacationController.updateVacation));

/**
 * @route   DELETE /vacations/:id
 * @desc    Delete a vacation by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/vacations/{id}:
 *   delete:
 *     tags:
 *       - Vacations
 *     summary: Delete vacation
 *     description: Delete a vacation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vacation ID
 *     responses:
 *       '200':
 *         description: Vacation deleted successfully
 *       '404':
 *         description: Vacation not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/vacations/:id", asyncHandler(VacationController.deleteVacation));

export default router;