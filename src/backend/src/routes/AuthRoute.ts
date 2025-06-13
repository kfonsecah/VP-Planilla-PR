import { Router } from 'express';
import { AuthController } from '../controller/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { asyncHandler } from '../utils/asyncHandler'; // Import the new utility

const router = Router();

/**
 * @route   POST /auth/login
 * @desc    Autenticar usuario con username y password
 * @access  Public
 */
router.post('/login', asyncHandler(AuthController.login));

/**
 * @route   GET /auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', asyncHandler(AuthMiddleware.verifyToken), asyncHandler(AuthController.getCurrentUser));

/**
 * @route   POST /auth/logout
 * @desc    Cerrar sesión del usuario
 * @access  Private
 */
router.post('/logout', asyncHandler(AuthMiddleware.verifyToken), asyncHandler(AuthController.logout));

/**
 * @route   POST /auth/validate
 * @desc    Validar si un token JWT es válido
 * @access  Public
 */
router.post('/validate', asyncHandler(AuthController.validateToken));

/**
 * @route   POST /auth/refresh
 * @desc    Renovar token JWT
 * @access  Public
 */
router.post('/refresh', asyncHandler(AuthController.refreshToken));

/**
 * @route   POST /auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post('/change-password', asyncHandler(AuthMiddleware.verifyToken), asyncHandler(AuthController.changePassword));

export default router;