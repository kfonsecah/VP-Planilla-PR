import { Router } from "express";
import { CompanyHolidayController } from "../controller/companyHolidayController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router();

// Apply auth middleware to all routes
router.use(AuthMiddleware.verifyToken);

router.post("/batch", CompanyHolidayController.createMany);
router.get("/", CompanyHolidayController.getAll);
router.get("/:id", CompanyHolidayController.getById);
router.post("/", CompanyHolidayController.create);
router.put("/:id", CompanyHolidayController.update);
router.delete("/:id", CompanyHolidayController.delete);

export default router;
