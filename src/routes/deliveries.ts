import express from 'express';
import { authenticateJWT, staffAndAdmin } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import deliveryController from '../controllers/deliveryController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/deliveries:
 *   get:
 *     summary: Get all deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, picked_up, in_transit, delivered, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Deliveries retrieved successfully
 */
router.get('/', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.getAllDeliveries));

/**
 * @swagger
 * /api/v1/deliveries/available-persons:
 *   get:
 *     summary: Get available delivery persons
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available delivery persons retrieved successfully
 */
router.get('/available-persons', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.getAvailableDeliveryPersons));

/**
 * @swagger
 * /api/v1/deliveries/statistics:
 *   get:
 *     summary: Get delivery statistics
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery statistics retrieved successfully
 */
router.get('/statistics', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.getDeliveryStatistics));

/**
 * @swagger
 * /api/v1/deliveries/{id}:
 *   get:
 *     summary: Get delivery by ID
 *     tags: [Deliveries]
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
 *         description: Delivery retrieved successfully
 */
router.get('/:id', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.getDeliveryById));

/**
 * @swagger
 * /api/v1/deliveries/{id}/assign:
 *   patch:
 *     summary: Assign delivery person
 *     tags: [Deliveries]
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
 *               - deliveryPersonId
 *             properties:
 *               deliveryPersonId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery person assigned successfully
 */
router.patch('/:id/assign', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.assignDeliveryPerson));

/**
 * @swagger
 * /api/v1/deliveries/{id}/status:
 *   patch:
 *     summary: Update delivery status
 *     tags: [Deliveries]
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
 *                 enum: [assigned, picked_up, in_transit, delivered, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery status updated successfully
 */
router.patch('/:id/status', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.updateDeliveryStatus));

/**
 * @swagger
 * /api/v1/deliveries/{id}/location:
 *   patch:
 *     summary: Update delivery location
 *     tags: [Deliveries]
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
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.patch('/:id/location', authenticateJWT, staffAndAdmin, asyncHandler(deliveryController.updateDeliveryLocation));

export default router; 