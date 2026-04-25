import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { TimeWindowController } from '../controller/TimeWindowController';

const router = Router();
router.post('/', AuthMiddleware.verifyToken, asyncHandler(TimeWindowController.create));
router.get('/', AuthMiddleware.verifyToken, asyncHandler(TimeWindowController.getAll));
router.put('/:id', AuthMiddleware.verifyToken, asyncHandler(TimeWindowController.update));
router.delete('/:id', AuthMiddleware.verifyToken, asyncHandler(TimeWindowController.delete));

export default router;
