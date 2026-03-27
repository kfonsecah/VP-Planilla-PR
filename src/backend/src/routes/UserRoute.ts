import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UserController } from "../controller/UserController";
import { validateBody } from '../middleware/validateBody';
import { updatePermissionsSchema } from '../schemas/UserSchema';

const router = Router();

/**
 * @route GET /users
 * @desc List system users with current permissions
 * @access Private/Admin
 */
router.get(
  "/users",
  asyncHandler(AuthMiddleware.verifyToken),
  AuthMiddleware.requireRole(["admin"]),
  asyncHandler(UserController.listUsers)
);

/**
 * @route GET /users/roles
 * @desc Get catalog of available role definitions
 * @access Private/Admin
 */
router.get(
  "/users/roles",
  asyncHandler(AuthMiddleware.verifyToken),
  AuthMiddleware.requireRole(["admin"]),
  asyncHandler(UserController.getRoleCatalog)
);

/**
 * @route PUT /users/:userId/permissions
 * @desc Update the role / permissions for a user
 * @access Private/Admin
 */
router.put(
  "/users/:userId/permissions",
  asyncHandler(AuthMiddleware.verifyToken),
  AuthMiddleware.requireRole(["admin"]),
  validateBody(updatePermissionsSchema),
  asyncHandler(UserController.updatePermissions)
);

export default router;
