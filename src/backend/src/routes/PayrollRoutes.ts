import { Router } from "express";
import { PayrollController } from "../controller/PayrollController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   POST /payroll/create
 * @desc    Create a new payroll
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/create:
 *   post:
 *     tags:
 *       - Payroll
 *     summary: Create a new payroll
 *     description: Create a new payroll record in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payroll_type_id
 *               - period_start
 *               - period_end
 *             properties:
 *               payroll_type_id:
 *                 type: number
 *                 description: Payroll type ID
 *                 example: 1
 *               period_start:
 *                 type: string
 *                 format: date
 *                 description: Payroll period start date
 *                 example: "2024-01-01"
 *               period_end:
 *                 type: string
 *                 format: date
 *                 description: Payroll period end date
 *                 example: "2024-01-31"
 *               status:
 *                 type: string
 *                 description: Payroll status
 *                 example: "draft"
 *     responses:
 *       '201':
 *         description: Payroll created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/payroll/create", asyncHandler(PayrollController.createPayroll));

/**
 * @route   GET /payroll/:id
 * @desc    Get payroll by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/{id}:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Get payroll by ID
 *     description: Retrieve a specific payroll by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       '200':
 *         description: Payroll retrieved successfully
 *       '404':
 *         description: Payroll not found
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll/:id", asyncHandler(PayrollController.getPayrollById));

/**
 * @route   PUT /payroll/:id
 * @desc    Update payroll by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/{id}:
 *   put:
 *     tags:
 *       - Payroll
 *     summary: Update payroll
 *     description: Update an existing payroll record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payroll_type_id:
 *                 type: number
 *                 description: Payroll type ID
 *               period_start:
 *                 type: string
 *                 format: date
 *                 description: Payroll period start date
 *               period_end:
 *                 type: string
 *                 format: date
 *                 description: Payroll period end date
 *               status:
 *                 type: string
 *                 description: Payroll status
 *     responses:
 *       '200':
 *         description: Payroll updated successfully
 *       '404':
 *         description: Payroll not found
 *       '500':
 *         description: Internal server error
 */
router.put("/payroll/:id", asyncHandler(PayrollController.updatePayroll));

/**
 * @route   GET /payroll/:id/employees
 * @desc    Get employees for a specific payroll
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/{id}/employees:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Get payroll employees
 *     description: Retrieve all employees and their calculations for a specific payroll
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       '200':
 *         description: Payroll employees retrieved successfully
 *       '404':
 *         description: Payroll not found
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll/:id/employees", asyncHandler(PayrollController.getPayrollEmployees));

export default router;
