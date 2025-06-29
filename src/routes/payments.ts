import express from 'express';
import { authenticateJWT, staffAndAdmin, userAndAbove } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import paymentController from '../controllers/paymentController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments (Admin/Staff only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/', authenticateJWT, staffAndAdmin, asyncHandler(paymentController.getAllPayments));

/**
 * @swagger
 * /api/v1/payments/my-payments:
 *   get:
 *     summary: Get user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User payments retrieved successfully
 */
router.get('/my-payments', authenticateJWT, userAndAbove, asyncHandler(paymentController.getMyPayments));

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment retrieved successfully
 */
router.get('/:id', authenticateJWT, userAndAbove, asyncHandler(paymentController.getPaymentById));

/**
 * @swagger
 * /api/v1/payments/process:
 *   post:
 *     summary: Process payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, digital_wallet, bank_transfer]
 *               tip:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/process', authenticateJWT, userAndAbove, asyncHandler(paymentController.processPayment));

/**
 * @swagger
 * /api/v1/payments/{id}/refund:
 *   post:
 *     summary: Process refund
 *     tags: [Payments]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/:id/refund', authenticateJWT, staffAndAdmin, asyncHandler(paymentController.processRefund));

export default router; 