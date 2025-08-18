import { Router } from "express";
import { DeductionsController } from "../controller/DeductionsController";

const router = Router();

router.post("/deduction/create", DeductionsController.createDeduction);
router.get("/deductions", DeductionsController.getAllDeductions);
router.put("/deductions/:id", DeductionsController.updateDeduction);
router.delete("/deductions/:id", DeductionsController.deleteDeduction);

export default router;
