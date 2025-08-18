"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
class AuthService {
    /**
     * Autentica un usuario con username y password
     */
    static async authenticate(credentials) {
        try {
            const { username, password } = credentials;
            console.log('Authenticating user:', username);
            // Buscar usuario por username usando el modelo User
            const user = await prisma.vpg_users.findFirst({
                where: {
                    username: username
                }
            });
            console.log('User found:', user ? 'Yes' : 'No');
            // Verificar si el usuario existe
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }
            console.log('Verifying password for user:', user.username);
            // Verificar la contraseña
            const isPasswordValid = await this.verifyPassword(password, user.password);
            console.log('Password valid:', isPasswordValid);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Contraseña incorrecta'
                };
            }
            // Crear datos del usuario autenticado (sin password) usando el modelo
            const authenticatedUser = {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                middle_name: user.middle_name,
                role: user.role
            };
            console.log('Generating token for user:', authenticatedUser.username);
            // Generar JWT token
            const token = this.generateToken(authenticatedUser);
            return {
                success: true,
                user: authenticatedUser,
                token: token,
                message: 'Autenticación exitosa'
            };
        }
        catch (error) {
            console.error('Error en autenticación:', error);
            return {
                success: false,
                message: 'Error interno del servidor'
            };
        }
    }
    /**
     * Verifica la contraseña - soporta tanto bcrypt como texto plano
     */
    static async verifyPassword(inputPassword, storedPassword) {
        try {
            // Verificar si la contraseña almacenada es un hash de bcrypt
            // Los hashes de bcrypt siempre empiezan con $2a$, $2b$, $2x$, o $2y$
            const isBcryptHash = /^\$2[abxy]?\$/.test(storedPassword);
            if (isBcryptHash) {
                // Es un hash de bcrypt, usar bcrypt.compare
                console.log('Using bcrypt verification');
                return await bcrypt_1.default.compare(inputPassword, storedPassword);
            }
            else {
                // Es texto plano, comparar directamente
                console.log('Using plain text verification');
                return inputPassword === storedPassword;
            }
        }
        catch (error) {
            console.error('Error verificando contraseña:', error);
            return false;
        }
    }
    /**
     * Genera un JWT token para el usuario
     */
    static generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        const secret = process.env.JWT_SECRET || 'your-default-secret-key';
        const options = {
            expiresIn: process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 24 * 60 * 60 // 24 horas por defecto
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    /**
     * Verifica si un JWT token es válido
     */
    static verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-default-secret-key';
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            throw new Error('Token inválido');
        }
    }
    /**
     * Obtiene información del usuario por ID (para middleware de autenticación)
     */
    static async getUserById(id) {
        try {
            const user = await prisma.vpg_users.findUnique({
                where: { id }
            });
            if (!user) {
                return null;
            }
            // Convertir User a AuthenticatedUser (sin password)
            return {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                middle_name: user.middle_name,
                role: user.role
            };
        }
        catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }
    /**
     * Obtiene usuario por username
     */
    static async getUserByUsername(username) {
        try {
            const user = await prisma.vpg_users.findFirst({
                where: { username }
            });
            return user;
        }
        catch (error) {
            console.error('Error obteniendo usuario por username:', error);
            return null;
        }
    }
    /**
     * Hash de contraseña para crear usuarios
     */
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt_1.default.hash(password, saltRounds);
    }
    /**
     * Valida las credenciales sin generar token (útil para validaciones)
     */
    static async validateCredentials(credentials) {
        try {
            const { username, password } = credentials;
            const user = await this.getUserByUsername(username);
            if (!user) {
                return null;
            }
            const isPasswordValid = await this.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return null;
            }
            return user;
        }
        catch (error) {
            console.error('Error validando credenciales:', error);
            return null;
        }
    }
    /**
     * Actualiza la última fecha de login del usuario
     */
    static async updateLastLogin(userId) {
        try {
            console.log(`Usuario ${userId} hizo login en ${new Date().toISOString()}`);
        }
        catch (error) {
            console.error('Error actualizando último login:', error);
        }
    }
    /**
     * Cierra la conexión a la base de datos
     */
    static async disconnect() {
        await prisma.$disconnect();
    }
}
exports.AuthService = AuthService;
