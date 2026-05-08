import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { PayrollController } from '../controller/PayrollController';

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @swagger
 * /api/aguinaldo/projection:
 *   get:
 *     tags:
 *       - Aguinaldo
 *     summary: Get aguinaldo projection for all active employees
 *     description: Returns accrued and projected aguinaldo per employee based on PAGADA payrolls in the active fiscal period.
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter to a single employee
 *       - in: query
 *         name: fiscalYear
 *         schema:
 *           type: integer
 *         description: Fiscal year anchor (defaults to current year)
 *     responses:
 *       '200':
 *         description: Projection data returned successfully
 *       '500':
 *         description: Internal server error
 */
router.get('/aguinaldo/projection', asyncHandler(PayrollController.getAguinaldoProjection));

export default router;
