import { Router } from 'express';
import { NotificationController } from '../controller/NotificationController';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Create a notification
 *     description: Create a new notification for a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, message, type]
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID to create notification for
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               type:
 *                 type: string
 *                 enum: [payroll_generated, payment_processed, employee_action, system, report_generated]
 *     responses:
 *       '201':
 *         description: Notification created successfully
 *       '400':
 *         description: Missing required fields
 *       '401':
 *         description: Unauthorized
 */
router.post('/', asyncHandler(NotificationController.createNotification));

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for authenticated user
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get user notifications
 *     description: Retrieve paginated notifications for the authenticated user
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type (e.g., LEGAL_PARAM_CHANGE)
 *       - in: query
 *         name: unacknowledged
 *         schema:
 *           type: boolean
 *         description: If true with type=LEGAL_PARAM_CHANGE, returns only unacknowledged alerts
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *     responses:
 *       '200':
 *         description: Notifications retrieved successfully
 *       '401':
 *         description: Unauthorized
 *       '400':
 *         description: Invalid notification type filter
 */
router.get('/', asyncHandler(NotificationController.getNotifications));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for authenticated user
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread count
 *     description: Get the count of unread notifications for the authenticated user
 *     responses:
 *       '200':
 *         description: Unread count retrieved successfully
 *       '401':
 *         description: Unauthorized
 */
router.get('/unread-count', asyncHandler(NotificationController.getUnreadCount));

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark a single notification as read (must be owned by authenticated user)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       '200':
 *         description: Notification marked as read
 *       '404':
 *         description: Notification not found or access denied
 *       '401':
 *         description: Unauthorized
 */
router.put('/:id/read', asyncHandler(NotificationController.markAsRead));

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for authenticated user
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     description: Mark all notifications as read for the authenticated user
 *     responses:
 *       '200':
 *         description: All notifications marked as read
 *       '401':
 *         description: Unauthorized
 */
router.put('/read-all', asyncHandler(NotificationController.markAllAsRead));

/**
 * @route   PATCH /api/notifications/:id/acknowledge
 * @desc    Mark a legal param alert notification as acknowledged (admin only)
 * @access  Private — admin only
 */
/**
 * @swagger
 * /api/notifications/{id}/acknowledge:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Acknowledge a legal param alert
 *     description: Mark a LEGAL_PARAM_CHANGE notification as acknowledged. Admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       '200':
 *         description: Notification acknowledged
 *       '400':
 *         description: Invalid notification ID
 *       '403':
 *         description: Not an admin
 *       '404':
 *         description: Notification not found or already acknowledged
 *       '401':
 *         description: Unauthorized
 */
router.patch('/:id/acknowledge', asyncHandler(NotificationController.acknowledgeNotification));

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification
 *     description: Delete a notification (must be owned by authenticated user)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       '204':
 *         description: Notification deleted successfully
 *       '404':
 *         description: Notification not found or access denied
 *       '401':
 *         description: Unauthorized
 */
router.delete('/:id', asyncHandler(NotificationController.deleteNotification));

export { router as notificationRouter };
