import express from 'express';
import { authenticateJWT, staffAndAdmin, userAndAbove } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import orderController from '../controllers/orderController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, out_for_delivery, delivered, completed, cancelled]
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum: [dine_in, takeaway, delivery]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/', authenticateJWT, staffAndAdmin, asyncHandler(orderController.getAllOrders));

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 */
router.get('/my-orders', authenticateJWT, userAndAbove, asyncHandler(orderController.getMyOrders));

/**
 * @swagger
 * /api/v1/orders/statistics:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 */
router.get('/statistics', authenticateJWT, staffAndAdmin, asyncHandler(orderController.getOrderStatistics));

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 */
router.get('/:id', authenticateJWT, userAndAbove, asyncHandler(orderController.getOrderById));

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - orderType
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     specialInstructions:
 *                       type: string
 *               orderType:
 *                 type: string
 *                 enum: [dine_in, takeaway, delivery]
 *               deliveryAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                   instructions:
 *                     type: string
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authenticateJWT, userAndAbove, asyncHandler(orderController.createOrder));

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, out_for_delivery, delivered, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch('/:id/status', authenticateJWT, staffAndAdmin, asyncHandler(orderController.updateOrderStatus));

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch('/:id/cancel', authenticateJWT, userAndAbove, asyncHandler(orderController.cancelOrder));

export default router; 