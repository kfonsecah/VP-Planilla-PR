"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const AuthRoute_1 = __importDefault(require("./routes/AuthRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Middlewares básicos
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
app.use('/api', AuthRoute_1.default);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Servidor escuchando en http://0.0.0.0:${PORT}`);
});
exports.default = app;
