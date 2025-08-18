"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const AuthService_1 = require("../service/AuthService");
class AuthMiddleware {
    /**
     * Middleware para verificar JWT token
     */
    static async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }
            const token = authHeader.split(' ')[1]; // Bearer TOKEN
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }
            // Verificar token
            const decoded = AuthService_1.AuthService.verifyToken(token);
            // Obtener información completa del usuario
            const user = await AuthService_1.AuthService.getUserById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            // Agregar usuario al request
            req.user = user;
            next();
        }
        catch (error) {
            console.error('Error en middleware de autenticación:', error);
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }
    /**
     * Middleware para verificar roles específicos
     */
    static requireRole(allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a este recurso'
                });
            }
            next();
        };
    }
    /**
     * Middleware opcional para verificar token (no falla si no hay token)
     */
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    try {
                        const decoded = AuthService_1.AuthService.verifyToken(token);
                        const user = await AuthService_1.AuthService.getUserById(decoded.id);
                        if (user) {
                            req.user = user;
                        }
                    }
                    catch (error) {
                        // Token inválido, pero no fallar
                        console.log('Token opcional inválido:', error);
                    }
                }
            }
            next();
        }
        catch (error) {
            next();
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
