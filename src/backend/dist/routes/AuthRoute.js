"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controller/AuthController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler"); // Import the new utility
const router = (0, express_1.Router)();
/**
 * @route   POST /auth/login
 * @desc    Autenticar usuario con username y password
 * @access  Public
 */
router.post('/login', (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.login));
/**
 * @route   GET /auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', (0, asyncHandler_1.asyncHandler)(AuthMiddleware_1.AuthMiddleware.verifyToken), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.getCurrentUser));
/**
 * @route   POST /auth/logout
 * @desc    Cerrar sesión del usuario
 * @access  Private
 */
router.post('/logout', (0, asyncHandler_1.asyncHandler)(AuthMiddleware_1.AuthMiddleware.verifyToken), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.logout));
/**
 * @route   POST /auth/validate
 * @desc    Validar si un token JWT es válido
 * @access  Public
 */
router.post('/validate', (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.validateToken));
/**
 * @route   POST /auth/refresh
 * @desc    Renovar token JWT
 * @access  Public
 */
router.post('/refresh', (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.refreshToken));
/**
 * @route   POST /auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post('/change-password', (0, asyncHandler_1.asyncHandler)(AuthMiddleware_1.AuthMiddleware.verifyToken), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.changePassword));
exports.default = router;
