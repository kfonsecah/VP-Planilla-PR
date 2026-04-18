import { Router } from 'express';
import { ClockAliasController } from '../controller/ClockAliasController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateBody } from '../middleware/validateBody';
import { createClockAliasSchema } from '../schemas/ClockAliasSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);

const controller = new ClockAliasController();

/**
 * @swagger
 * /api/employees/{id}/aliases:
 *   post:
 *     tags: [Clock Aliases]
 *     summary: Create a clock alias for an employee
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alias_name]
 *             properties:
 *               alias_name: { type: string, maxLength: 100 }
 *     responses:
 *       '201': { description: Alias created }
 *       '409': { description: Alias already exists for this employee }
 */
router.post(
  '/employees/:id/aliases',
  validateBody(createClockAliasSchema),
  asyncHandler((req, res) => controller.create(req, res))
);

/**
 * @swagger
 * /api/employees/{id}/aliases:
 *   get:
 *     tags: [Clock Aliases]
 *     summary: Get all aliases for an employee
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/employees/:id/aliases',
  asyncHandler((req, res) => controller.getAll(req, res))
);

/**
 * @swagger
 * /api/employees/{id}/aliases/{aliasId}:
 *   delete:
 *     tags: [Clock Aliases]
 *     summary: Delete a clock alias
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/employees/:id/aliases/:aliasId',
  asyncHandler((req, res) => controller.delete(req, res))
);

export default router;