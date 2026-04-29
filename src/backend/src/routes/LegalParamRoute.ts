import { Router } from 'express';
import { LegalParamController } from '../controller/LegalParamController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// Admin-only middleware — applied to write endpoints and admin-read endpoints
const adminOnly = (req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/**
 * @swagger
 * /api/legal-params:
 *   get:
 *     tags:
 *       - Legal Parameters
 *     summary: Get parameter value at a date
 *     description: Returns the full VpgLegalParam record in effect for the given key and date.
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: "OT_FACTOR"
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *     responses:
 *       '200':
 *         description: Parameter found (may be null if no record exists)
 *       '400':
 *         description: Missing key parameter
 */
router.get(
  '/legal-params',
  AuthMiddleware.verifyToken,
  asyncHandler(LegalParamController.getParamAtDate),
);

/**
 * @swagger
 * /api/legal-params/all:
 *   get:
 *     tags:
 *       - Legal Parameters
 *     summary: Get all legal parameters (admin only)
 *     description: Returns all parameters ordered by key ASC, validFrom DESC.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Array of all VpgLegalParam records
 *       '403':
 *         description: Admin access required
 */
router.get(
  '/legal-params/all',
  AuthMiddleware.verifyToken,
  adminOnly,
  asyncHandler(LegalParamController.getAllParams),
);

/**
 * @swagger
 * /api/legal-params/history/{key}:
 *   get:
 *     tags:
 *       - Legal Parameters
 *     summary: Get change history for a parameter (admin only)
 *     description: Returns all historical records for a key ordered by validFrom DESC.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: "OT_FACTOR"
 *     responses:
 *       '200':
 *         description: Array of VpgLegalParam records (history)
 *       '403':
 *         description: Admin access required
 */
router.get(
  '/legal-params/history/:key',
  AuthMiddleware.verifyToken,
  adminOnly,
  asyncHandler(LegalParamController.getParamHistory),
);

/**
 * @swagger
 * /api/legal-params/category/{category}:
 *   get:
 *     tags:
 *       - Legal Parameters
 *     summary: Get parameters by category at a date
 *     description: Returns one record per key for the given category, in effect at the given date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WORKDAY, OVERTIME, CCSS, MIN_WAGE, FEATURE_FLAG]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *     responses:
 *       '200':
 *         description: Array of VpgLegalParam records for the category
 *       '400':
 *         description: Missing category
 */
router.get(
  '/legal-params/category/:category',
  AuthMiddleware.verifyToken,
  asyncHandler(LegalParamController.getParamsByCategory),
);

/**
 * @swagger
 * /api/legal-params:
 *   post:
 *     tags:
 *       - Legal Parameters
 *     summary: Create a new legal parameter (admin only)
 *     description: >
 *       Insert-only operation: creates a new record and closes the previous open-ended record.
 *       Never updates records in-place to preserve audit trail.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *               - description
 *               - category
 *               - validFrom
 *             properties:
 *               key:
 *                 type: string
 *                 example: "OT_FACTOR"
 *               value:
 *                 type: number
 *                 example: 1.75
 *               description:
 *                 type: string
 *                 example: "Updated OT multiplier"
 *               category:
 *                 type: string
 *                 enum: [WORKDAY, OVERTIME, CCSS, MIN_WAGE, FEATURE_FLAG]
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-01T00:00:00.000Z"
 *               isCritical:
 *                 type: boolean
 *                 default: false
 *               source_decree:
 *                 type: string
 *                 example: "Art. 139 CT"
 *     responses:
 *       '201':
 *         description: Legal parameter created
 *       '400':
 *         description: Missing required fields
 *       '403':
 *         description: Admin access required
 */
router.post(
  '/legal-params',
  AuthMiddleware.verifyToken,
  adminOnly,
  asyncHandler(LegalParamController.upsertParam),
);

/**
 * @swagger
 * /api/legal-params/{key}:
 *   patch:
 *     tags:
 *       - Legal Parameters
 *     summary: Update a legal parameter (admin only)
 *     description: >
 *       Convenience endpoint for partial updates. Internally calls upsertParam to maintain history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Parameter updated
 *       '404':
 *         description: Parameter not found
 *       '403':
 *         description: Admin access required
 */
router.patch(
  '/legal-params/:key',
  AuthMiddleware.verifyToken,
  adminOnly,
  asyncHandler(LegalParamController.patchParam),
);

export default router;
