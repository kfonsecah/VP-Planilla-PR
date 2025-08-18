import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/AuthRoute'
import employeeRoutes from './routes/EmployeeRoute';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middlewares básicos
app.use(cors());
app.use(express.json());

console.log("Servidor en ejecución...");

// Solo rutas básicas sin importar nada más
app.get('/', (_req, res) => {
  console.log("Ruta raíz accesada");
  res.json({
    success: true,
    message: 'API de VP Planillas funcionando 🚀'
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente'
  });
});

// Ruta de auth básica sin importaciones externas
app.use('/api', authRoutes);
app.use('/api', employeeRoutes)

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor escuchando en http://0.0.0.0:${PORT}`);
});

export default app;
