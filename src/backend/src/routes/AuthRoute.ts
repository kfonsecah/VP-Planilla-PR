import { Router } from "express";
import { AuthController } from "../controller/AuthController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { asyncHandler } from "../utils/asyncHandler"; // Import the new utility

const router = Router();

/**
 * @route   POST /login
 * @desc    Authenticate user with username and password
 * @access  Public
 */
/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate a user with their username and password, and return an access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username of the user.
 *                 example: "testuser"
 *               password:
 *                 type: string
 *                 description: Password of the user.
 *                 example: "password123"
 *     responses:
 *       '200':
 *         description: Successful authentication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *       '400':
 *         description: Invalid input data.
 *       '401':
 *         description: Incorrect credentials.
 */
router.post("/login", asyncHandler(AuthController.login));

/**
 * @route   GET /me
 * @desc    Get authenticated user information
 * @access  Private
 */
/**
 * @swagger
 * /api/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Get information about the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User information retrieved successfully
 *       '401':
 *         description: Unauthorized - Invalid or missing token
 *       '500':
 *         description: Internal server error
 */
router.get(
  "/me",
  asyncHandler(AuthMiddleware.verifyToken),
  asyncHandler(AuthController.getCurrentUser)
);

/**
 * @route   POST /logout
 * @desc    Log out user
 * @access  Private
 */
/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Log out the current user and invalidate their session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User logged out successfully
 *       '401':
 *         description: Unauthorized - Invalid or missing token
 *       '500':
 *         description: Internal server error
 */
router.post(
  "/logout",
  asyncHandler(AuthMiddleware.verifyToken),
  asyncHandler(AuthController.logout)
);

/**
 * @route   POST /validate
 * @desc    Validate if a JWT token is valid
 * @access  Public
 */
/**
 * @swagger
 * /api/validate:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Validate JWT token
 *     description: Validate if a JWT token is still valid and active
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to validate
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       '200':
 *         description: Token is valid
 *       '401':
 *         description: Token is invalid or expired
 *       '500':
 *         description: Internal server error
 */
router.post("/validate", asyncHandler(AuthController.validateToken));

/**
 * @route   POST /refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
/**
 * @swagger
 * /api/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       '200':
 *         description: New token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: New JWT token
 *       '401':
 *         description: Invalid or expired refresh token
 *       '500':
 *         description: Internal server error
 */
router.post("/refresh", asyncHandler(AuthController.refreshToken));

/**
 * @route   POST /change-password
 * @desc    Change authenticated user password
 * @access  Private
 */
/**
 * @swagger
 * /api/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change user password
 *     description: Change the password for the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current user password
 *                 example: "currentpass123"
 *               new_password:
 *                 type: string
 *                 description: New password
 *                 example: "newpass456"
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '400':
 *         description: Invalid current password or weak new password
 *       '401':
 *         description: Unauthorized - Invalid or missing token
 *       '500':
 *         description: Internal server error
 */
router.post(
  "/change-password",
  asyncHandler(AuthMiddleware.verifyToken),
  asyncHandler(AuthController.changePassword)
);

export default router;
