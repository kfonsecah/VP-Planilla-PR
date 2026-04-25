import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { DayConfirmationController } from '../controller/DayConfirmationController';

const router = Router();
router.post('/', AuthMiddleware.verifyToken, asyncHandler(DayConfirmationController.upsert));
router.get('/', AuthMiddleware.verifyToken, asyncHandler(DayConfirmationController.get));

export default router;
