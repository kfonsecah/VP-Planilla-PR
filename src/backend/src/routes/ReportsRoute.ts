import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ReportsController } from "../controller/ReportsController";

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.get(
  "/reports/dashboard",
  asyncHandler(ReportsController.getDashboard)
);
router.get(
  "/reports/payroll/:id/employees",
  asyncHandler(ReportsController.getPayrollDataset)
);
router.get(
  "/reports/payroll/:id/logs",
  asyncHandler(ReportsController.getPayrollLogs)
);
router.post(
  "/reports/payroll/:id/send",
  asyncHandler(ReportsController.sendReports)
);
router.post(
  "/reports/payroll/:id/payment-receipts/pdf",
  asyncHandler(ReportsController.downloadPaymentReceiptsPdf)
);

router.get(
  "/reports/institutional/ccss/:id",
  asyncHandler(ReportsController.downloadCCSSReport)
);
router.get(
  "/reports/institutional/ins/:id",
  asyncHandler(ReportsController.downloadINSReport)
);

router.get(
  "/reports/hacienda/d151/:year",
  asyncHandler(ReportsController.downloadD151Report)
);

router.get(
  "/reports/hacienda/annual-salary/:year",
  asyncHandler(ReportsController.downloadAnnualSalarySummary)
);

export default router;
