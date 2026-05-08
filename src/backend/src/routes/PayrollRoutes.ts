import { Router } from "express";
import { PayrollController } from "../controller/PayrollController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { validateBody } from '../middleware/validateBody';
import { createPayrollSchema, updatePayrollSchema, employeeOverrideSchema } from '../schemas/PayrollSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   GET /payrolls
 * @desc    Get all payrolls
 * @access  Private
 */
/**
 * @swagger
 * /api/payrolls:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Get all payrolls
 *     description: Retrieve all payroll records from the system
 *     responses:
 *       '200':
 *         description: Payrolls retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/payrolls", asyncHandler(PayrollController.getAllPayrolls));

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
router.post("/payroll/create", validateBody(createPayrollSchema), asyncHandler(PayrollController.createPayroll));

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
router.put("/payroll/:id", validateBody(updatePayrollSchema), asyncHandler(PayrollController.updatePayroll));

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

/**
 * @route   GET /payroll/:id/snapshot
 * @desc    Get payroll parameter snapshot captured at approval time
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/{id}/snapshot:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Get payroll parameter snapshot
 *     description: Retrieve the parameter snapshot captured when the payroll was approved. Returns empty snapshot for payrolls approved before Phase 64.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       '200':
 *         description: Snapshot retrieved successfully
 *       '404':
 *         description: Payroll not found
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll/:id/snapshot", asyncHandler(PayrollController.getPayrollSnapshot));

/**
 * @route   POST /payroll/:id/approve
 * @desc    Approve a payroll (BORRADOR -> APROBADA)
 * @access  Private
 */
router.post("/payroll/:id/approve", asyncHandler(PayrollController.approvePayroll));

/**
 * @route   POST /payroll/:id/pay
 * @desc    Mark payroll as paid (APROBADA -> PAGADA)
 * @access  Private
 */
router.post("/payroll/:id/pay", asyncHandler(PayrollController.markAsPaid));

/**
 * @route   POST /payroll/:id/reopen
 * @desc    Reopen a payroll (APROBADA -> BORRADOR)
 * @access  Private
 */
router.post("/payroll/:id/reopen", asyncHandler(PayrollController.reopenPayroll));

/**
 * @route   POST /payroll/:id/recalculate
 * @desc    Recalculate a payroll in BORRADOR state
 * @access  Private
 */
router.post("/payroll/:id/recalculate", asyncHandler(PayrollController.recalculatePayroll));

/**
 * @route   GET /payroll/aguinaldo/:employeeId/:year
 * @desc    Calculate aguinaldo for an employee
 * @access  Private
 */
router.get("/payroll/aguinaldo/:employeeId/:year", asyncHandler(PayrollController.calculateAguinaldo));

/**
 * @route   PATCH /payroll/:id/employee/:empId/override
 * @desc    Save per-employee hour/deduction override (BORRADOR only)
 * @access  Private
 */
router.patch(
  "/payroll/:id/employee/:empId/override",
  validateBody(employeeOverrideSchema),
  asyncHandler(PayrollController.saveEmployeeOverride)
);

/**
 * @route   GET /payroll/:id/aguinaldo-summary
 * @desc    Get aguinaldo summary for a payroll
 * @access  Private
 */
router.get("/payroll/:id/aguinaldo-summary", asyncHandler(PayrollController.getAguinaldoSummary));

/**
 * @swagger
 * /api/payrolls/{payrollId}/payslip/{employeeId}/pdf:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Download payslip PDF for an employee
 *     description: Generates and streams the payslip PDF for a specific employee in a payroll. PDF is generated in memory and never stored to disk.
 *     parameters:
 *       - in: path
 *         name: payrollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       '200':
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Invalid IDs
 *       '403':
 *         description: Insufficient permissions (requires admin or analyst role)
 *       '404':
 *         description: Payroll or employee not found in payroll
 *       '500':
 *         description: PDF generation failed
 */
router.get(
  '/payrolls/:payrollId/payslip/:employeeId/pdf',
  AuthMiddleware.requireRole(['admin', 'analyst']),
  asyncHandler(PayrollController.downloadPayslipPdf)
);

/**
 * @route   POST /payrolls/:id/resend-payslip/:employeeId
 * @desc    Resend payslip PDF to a specific employee (admin/analyst only)
 * @access  Private — admin, analyst
 */
/**
 * @swagger
 * /api/payrolls/{id}/resend-payslip/{employeeId}:
 *   post:
 *     tags:
 *       - Payroll
 *     summary: Resend payslip to employee
 *     description: Generate and resend the payslip PDF to a specific employee without reopening the payroll
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       '200':
 *         description: Payslip resent successfully
 *       '400':
 *         description: Invalid IDs
 *       '422':
 *         description: Employee has no email or not found in payroll
 *       '403':
 *         description: Insufficient permissions
 *       '500':
 *         description: Internal server error
 */
router.post(
  "/payrolls/:id/resend-payslip/:employeeId",
  AuthMiddleware.requireRole(['admin', 'analyst']),
  asyncHandler(PayrollController.resendPayslip)
);

export default router;
