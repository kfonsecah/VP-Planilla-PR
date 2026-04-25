import { Router } from "express";
import { ClockLogsController } from "../controller/ClockLogsController";
import { ClockLogAdjustmentController } from "../controller/ClockLogAdjustmentController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { validateBody } from '../middleware/validateBody';
import { 
  bulkCreateClockLogSchema, 
  resolveOrphanSchema, 
  createManualLogSchema, 
  updateClockLogStatusSchema 
} from '../schemas/ClockLogSchema';
import { createAdjustmentSchema } from '../schemas/AdjustmentSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);

const controller = new ClockLogsController();
const adjustmentController = new ClockLogAdjustmentController();

// Routes
router.get("/clock-logs/import-sessions", asyncHandler((req, res) => controller.getImportSessions(req, res)));
router.get("/clock-logs/paginated", asyncHandler((req, res) => controller.getClockLogsPaginated(req, res)));
router.get("/clock-logs", asyncHandler((req, res) => controller.getClockLogs(req, res)));
router.get("/clock-logs/stats", asyncHandler((req, res) => controller.getStats(req, res)));
router.get("/clock-logs/orphans", asyncHandler((req, res) => controller.getOrphans(req, res)));
router.get("/clock-logs/anomalies", asyncHandler((req, res) => controller.getAnomalies(req, res)));
router.post("/clock-logs/bulk", validateBody(bulkCreateClockLogSchema), asyncHandler((req, res) => controller.bulkCreate(req, res)));
router.post("/clock-logs/import", asyncHandler((req, res) => controller.import(req, res)));
router.post("/clock-logs/orphans/:id/resolve", validateBody(resolveOrphanSchema), asyncHandler((req, res) => controller.resolveOrphan(req, res)));

router.post("/clock-logs/correct", 
  AuthMiddleware.requireRole(['admin']), 
  validateBody(createManualLogSchema), 
  asyncHandler((req, res) => controller.createManualLog(req, res))
);

router.patch("/clock-logs/:id/status", 
  AuthMiddleware.requireRole(['admin']), 
  validateBody(updateClockLogStatusSchema), 
  asyncHandler((req, res) => controller.updateClockLogStatus(req, res))
);

router.post("/clock-logs/adjust", 
  validateBody(createAdjustmentSchema), 
  asyncHandler((req, res) => adjustmentController.createAdjustment(req, res))
);

router.get("/clock-logs/effective", 
  asyncHandler((req, res) => adjustmentController.getEffectiveMarks(req, res))
);

export default router;
