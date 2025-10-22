import { Router } from "express";
import { DeductionsController } from "../controller/DeductionsController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   POST /deduction/create
 * @desc    Create a new deduction
 * @access  Private
 */
/**
 * @swagger
 * /api/deduction/create:
 *   post:
 *     tags:
 *       - Deductions
 *     summary: Create a new deduction
 *     description: Create a new deduction rule in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: Deduction name
 *                 example: "Health Insurance"
 *               description:
 *                 type: string
 *                 description: Deduction description
 *                 example: "Monthly health insurance deduction"
 *               fixed_amount:
 *                 type: number
 *                 description: Fixed deduction amount
 *                 example: 100.00
 *               percentage:
 *                 type: number
 *                 description: Percentage-based deduction
 *                 example: 5.0
 *     responses:
 *       '201':
 *         description: Deduction created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/deduction/create", asyncHandler(DeductionsController.createDeduction));

/**
 * @route   GET /deductions
 * @desc    Get all deductions
 * @access  Private
 */
/**
 * @swagger
 * /api/deductions:
 *   get:
 *     tags:
 *       - Deductions
 *     summary: Get all deductions
 *     description: Retrieve all deduction rules from the system
 *     responses:
 *       '200':
 *         description: Deductions retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/deductions", asyncHandler(DeductionsController.getAllDeductions));

/**
 * @route   PUT /deductions/:id
 * @desc    Update deduction by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/deductions/{id}:
 *   put:
 *     tags:
 *       - Deductions
 *     summary: Update deduction
 *     description: Update an existing deduction rule
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deduction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Deduction name
 *               description:
 *                 type: string
 *                 description: Deduction description
 *               fixed_amount:
 *                 type: number
 *                 description: Fixed deduction amount
 *               percentage:
 *                 type: number
 *                 description: Percentage-based deduction
 *     responses:
 *       '200':
 *         description: Deduction updated successfully
 *       '404':
 *         description: Deduction not found
 *       '500':
 *         description: Internal server error
 */
router.put("/deductions/:id", asyncHandler(DeductionsController.updateDeduction));

/**
 * @route   DELETE /deductions/:id
 * @desc    Delete deduction by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/deductions/{id}:
 *   delete:
 *     tags:
 *       - Deductions
 *     summary: Delete deduction
 *     description: Delete a deduction rule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deduction ID
 *     responses:
 *       '200':
 *         description: Deduction deleted successfully
 *       '404':
 *         description: Deduction not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/deductions/:id", asyncHandler(DeductionsController.deleteDeduction));

export default router;
