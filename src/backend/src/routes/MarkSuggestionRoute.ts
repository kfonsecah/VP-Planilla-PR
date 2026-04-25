import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { MarkSuggestionController } from '../controller/MarkSuggestionController';

const router = Router();
router.post('/missing-mark', AuthMiddleware.verifyToken, asyncHandler(MarkSuggestionController.suggest));
export default router;
