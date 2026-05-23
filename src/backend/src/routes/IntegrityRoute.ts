import { Router } from 'express';
import { IntegrityController } from '../controller/IntegrityController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   GET /api/integrity/dashboard
 * @desc    Obtener estado de integridad para el dashboard
 * @access  Private (Admin/Analyst/Payroll Manager)
 */
router.get(
  '/dashboard',
  AuthMiddleware.requireRole(['admin', 'analyst', 'payroll_manager']),
  asyncHandler(IntegrityController.getDashboardStatus)
);

/**
 * @route   POST /api/integrity/audit
 * @desc    Ejecutar auditoría manual de integridad
 * @access  Private (Admin/Analyst/Payroll Manager)
 */
router.post(
  '/audit',
  AuthMiddleware.requireRole(['admin', 'analyst', 'payroll_manager']),
  asyncHandler(IntegrityController.runAudit)
);

export default router;
