import { Router } from 'express';
import { EnterpriseController } from '../controller/EnterpriseController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateBody } from '../middleware/validateBody';
import { updateEnterpriseSchema } from '../schemas/EnterpriseSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   GET /api/enterprise/config
 * @desc    Obtener configuración de la empresa
 * @access  Private
 */
router.get('/enterprise/config', asyncHandler(EnterpriseController.getConfig));

/**
 * @route   PATCH /api/enterprise/config
 * @desc    Actualizar configuración de la empresa
 * @access  Private (Admin/Payroll Manager)
 */
router.patch(
  '/enterprise/config',
  AuthMiddleware.requireRole(['admin', 'payroll_manager']),
  validateBody(updateEnterpriseSchema),
  asyncHandler(EnterpriseController.updateConfig)
);

export default router;
