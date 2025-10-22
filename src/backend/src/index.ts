import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/AuthRoute";
import employeeRoutes from "./routes/EmployeeRoute";
import laborEventsRoutes from "./routes/LaborEventsRoute";
import deductionsRoutes from "./routes/DeductionsRoute";
import payrollTypeRoutes from "./routes/PayrollTypeRoute";
import payrollRoutes from "./routes/PayrollRoutes";
import clockLogsRoutes from "./routes/ClockLogsRoute";
import bonusesRoutes from "./routes/BonusesRoute";
import nomineeRoutes from "./routes/NomineeRoute";
import positionRoutes from "./routes/PositionRoute";
import vacationRoutes from "./routes/VacationRoute";
import auditLogsRoutes from "./routes/AuditLogsRoute";
import { apiReference } from "@scalar/express-api-reference";
import { swaggerSpec } from "./utils/docs";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middlewares básicos
app.use(cors());
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
app.use("/api", payrollTypeRoutes);
app.use("/api", payrollRoutes);
app.use("/api", clockLogsRoutes);
app.use("/api", bonusesRoutes);
app.use("/api", nomineeRoutes);
app.use("/api", positionRoutes);
app.use("/api", vacationRoutes);
app.use("/api", auditLogsRoutes);

// Servir la especificación de Swagger en formato JSON
app.get("/api/docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(
  "/api/docs",
  apiReference({
    url: "/api/docs/swagger.json",
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor escuchando en http://0.0.0.0:${PORT}`);
});

export default app;
