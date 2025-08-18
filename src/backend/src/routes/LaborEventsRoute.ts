import { Router } from "express";
import { LaborEventsController } from "../controller/LaborEventsController";

const router = Router();

router.post("/labor-events/create", LaborEventsController.createLaborEvent);
router.get("/labor-events", LaborEventsController.getAllLaborEvents);
router.put("/labor-events/:id", LaborEventsController.updateLaborEvent);
router.delete("/labor-events/:id", LaborEventsController.deleteLaborEvent);

export default router;
