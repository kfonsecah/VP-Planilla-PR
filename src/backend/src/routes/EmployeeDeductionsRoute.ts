import { Router } from "express";
import { EmployeeDeductionsController } from "../controller/EmployeeDeductionsController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @swagger
 * /api/employee-deductions/assign:
 *   post:
 *     summary: Assign a deduction to an employee
 *     tags: [Employee Deductions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - deductionId
 *             properties:
 *               employeeId:
 *                 type: number
 *                 description: The employee ID
 *               deductionId:
 *                 type: number
 *                 description: The deduction ID
 *     responses:
 *       201:
 *         description: Deduction assigned successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  "/employee-deductions/assign",
  asyncHandler(EmployeeDeductionsController.assignDeduction)
);

/**
 * @swagger
 * /api/employee-deductions/{employeeId}/{deductionId}:
 *   delete:
 *     summary: Remove a deduction from an employee
 *     tags: [Employee Deductions]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: number
 *         description: The employee ID
 *       - in: path
 *         name: deductionId
 *         required: true
 *         schema:
 *           type: number
 *         description: The deduction ID
 *     responses:
 *       200:
 *         description: Deduction removed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.delete(
  "/employee-deductions/:employeeId/:deductionId",
  asyncHandler(EmployeeDeductionsController.removeDeduction)
);

export default router;
