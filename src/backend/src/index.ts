import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/AuthRoute";
import employeeRoutes from "./routes/EmployeeRoute";
import laborEventsRoutes from "./routes/LaborEventsRoute";
import deductionsRoutes from "./routes/DeductionsRoute";
import employeeDeductionsRoutes from "./routes/EmployeeDeductionsRoute";
import payrollTypeRoutes from "./routes/PayrollTypeRoute";
import payrollRoutes from "./routes/PayrollRoutes";
import reportsRoutes from "./routes/ReportsRoute";
import clockLogsRoutes from "./routes/ClockLogsRoute";
import bonusesRoutes from "./routes/BonusesRoute";
import nomineeRoutes from "./routes/NomineeRoute";
import positionRoutes from "./routes/PositionRoute";
import vacationRoutes from "./routes/VacationRoute";
import auditLogsRoutes from "./routes/AuditLogsRoute";
import userRoutes from "./routes/UserRoute";
import paymentReceiptRoutes from "./routes/PaymentReceiptRoute";
import { notificationRouter } from "./routes/NotificationRoute";
import emailRoutes from "./routes/EmailRoute";
import { swaggerSpec } from "./utils/docs";
import { env } from "./config/env";

const app = express();
const PORT = env.PORT;

// Middlewares básicos
const allowedOrigins = env.ALLOWED_ORIGINS;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isVercel = origin.endsWith('.vercel.app') || origin === 'https://vp-planilla.vercel.app';
    const isAllowed = allowedOrigins.includes(origin);
    if (isVercel || isAllowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

console.log("Servidor en ejecución...");

// Solo rutas básicas sin importar nada más
app.get("/", (_req, res) => {
  console.log("Ruta raíz accesada");
  res.json({
    success: true,
    message: "API de VP Planillas funcionando 🚀",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
  });
});

// Ruta de auth básica sin importaciones externas
app.use("/api", authRoutes);
app.use("/api", employeeRoutes);
app.use("/api", laborEventsRoutes);
app.use("/api", deductionsRoutes);
app.use("/api", employeeDeductionsRoutes);
app.use("/api", payrollTypeRoutes);
app.use("/api", payrollRoutes);
app.use("/api", clockLogsRoutes);
app.use("/api", bonusesRoutes);
app.use("/api", reportsRoutes);
app.use("/api", nomineeRoutes);
app.use("/api", positionRoutes);
app.use("/api", vacationRoutes);
app.use("/api", auditLogsRoutes);
app.use("/api", userRoutes);
app.use("/api/payment-receipts", paymentReceiptRoutes);
app.use("/api/notifications", notificationRouter);
app.use("/api/email", emailRoutes);

// Servir la especificación de Swagger en formato JSON
app.get("/api/docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ESM-only package: load dynamically to work under CommonJS runtime
app.use("/api/docs", async (req, res, next) => {
  try {
    const { apiReference } = await import("@scalar/express-api-reference");
    const mw = apiReference({ url: "/api/docs/swagger.json" });
    return (mw as unknown as (req: any, res: any, next: any) => void)(req, res, next);
  } catch (e) {
    console.error("Failed to load API reference UI:", e);
    res.status(500).json({ success: false, message: "Docs UI unavailable" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor escuchando en http://0.0.0.0:${PORT}`);
});

export default app;
