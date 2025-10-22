import { Router } from "express";
import { NomineeController } from "../controller/NomineeController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   GET /nominee/clocklogs
 * @desc    Get clock logs for nominee calculation
 * @access  Private
 */
/**
 * @swagger
 * /api/nominee/clocklogs:
 *   get:
 *     tags:
 *       - Nominee
 *     summary: Get clock logs for nominee calculation
 *     description: Retrieve clock logs within a date range for nominee calculation
 *     parameters:
 *       - in: query
 *         name: initDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       '200':
 *         description: Clock logs retrieved successfully
 *       '400':
 *         description: Missing required parameters
 *       '500':
 *         description: Internal server error
 */
router.get("/nominee/clocklogs", asyncHandler(NomineeController.getClockLogs));

/**
 * @route   GET /nominee/employee-deductions/:employeeId
 * @desc    Get employee deductions for nominee calculation
 * @access  Private
 */
/**
 * @swagger
 * /api/nominee/employee-deductions/{employeeId}:
 *   get:
 *     tags:
 *       - Nominee
 *     summary: Get employee deductions
 *     description: Retrieve deductions for a specific employee
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       '200':
 *         description: Employee deductions retrieved successfully
 *       '400':
 *         description: Invalid employee ID
 *       '500':
 *         description: Internal server error
 */
router.get("/nominee/employee-deductions/:employeeId", asyncHandler(NomineeController.getEmployeeDeductions));

/**
 * @route   POST /nominee/calculate
 * @desc    Execute the nominee calculation process for payroll (legacy)
 * @access  Private
 */
/**
 * @swagger
 * /api/nominee/calculate:
 *   post:
 *     tags:
 *       - Nominee
 *     summary: Calculate nominee (legacy)
 *     description: Execute the basic nominee calculation process for payroll
 *     responses:
 *       '200':
 *         description: Nominee calculation completed successfully
 *       '500':
 *         description: Internal server error
 */
router.post("/nominee/calculate", asyncHandler(NomineeController.calculateNominee));

/**
 * @route   POST /nominee/calculate-payroll
 * @desc    Calculate complete payroll for all employees in a period
 * @access  Private
 */
/**
 * @swagger
 * /api/nominee/calculate-payroll:
 *   post:
 *     tags:
 *       - Nominee
 *     summary: Calculate complete payroll for period
 *     description: Calculate complete payroll for all employees including hours, deductions, bonuses, and net salary
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of payroll period (YYYY-MM-DD)
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date of payroll period (YYYY-MM-DD)
 *                 example: "2024-01-31"
 *     responses:
 *       '200':
 *         description: Payroll calculation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Complete payroll calculation result
 *                 message:
 *                   type: string
 *                   example: "Cálculo de nómina del periodo completado exitosamente"
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/nominee/calculate-payroll", asyncHandler(NomineeController.calculatePayrollForPeriod));

export default router;