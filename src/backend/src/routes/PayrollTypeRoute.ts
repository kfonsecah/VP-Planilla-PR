import { Router } from "express";
import { PayrollTypesController } from "../controller/PayrollTypesController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   POST /payroll-type/create
 * @desc    Create a new payroll type
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll-type/create:
 *   post:
 *     tags:
 *       - Payroll Types
 *     summary: Create a new payroll type
 *     description: Create a new payroll type in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - frequency
 *             properties:
 *               name:
 *                 type: string
 *                 description: Payroll type name
 *                 example: "Monthly Salary"
 *               description:
 *                 type: string
 *                 description: Payroll type description
 *                 example: "Regular monthly salary payment"
 *               frequency:
 *                 type: string
 *                 description: Payment frequency
 *                 example: "monthly"
 *     responses:
 *       '201':
 *         description: Payroll type created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/payroll-type/create", asyncHandler(PayrollTypesController.createPayrollType));

/**
 * @route   PUT /payroll-type/:id
 * @desc    Update payroll type by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll-type/{id}:
 *   put:
 *     tags:
 *       - Payroll Types
 *     summary: Update payroll type
 *     description: Update an existing payroll type
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Payroll type name
 *               description:
 *                 type: string
 *                 description: Payroll type description
 *               frequency:
 *                 type: string
 *                 description: Payment frequency
 *     responses:
 *       '200':
 *         description: Payroll type updated successfully
 *       '404':
 *         description: Payroll type not found
 *       '500':
 *         description: Internal server error
 */
router.put("/payroll-type/:id", asyncHandler(PayrollTypesController.updatePayrollType));

/**
 * @route   GET /payroll-type/:id
 * @desc    Get payroll type by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll-type/{id}:
 *   get:
 *     tags:
 *       - Payroll Types
 *     summary: Get payroll type by ID
 *     description: Retrieve a specific payroll type by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll type ID
 *     responses:
 *       '200':
 *         description: Payroll type retrieved successfully
 *       '404':
 *         description: Payroll type not found
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll-type/:id", asyncHandler(PayrollTypesController.getPayrollType));

/**
 * @route   GET /payroll-types
 * @desc    Get all payroll types
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll-types:
 *   get:
 *     tags:
 *       - Payroll Types
 *     summary: Get all payroll types
 *     description: Retrieve all payroll types from the system
 *     responses:
 *       '200':
 *         description: Payroll types retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll-types", asyncHandler(PayrollTypesController.getAllPayrollTypes));

export default router;
