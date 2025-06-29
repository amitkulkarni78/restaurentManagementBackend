import express from 'express';
import { authenticateJWT, adminOnly, userAndAbove } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import couponController from '../controllers/couponController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: Get all coupons (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
router.get('/', authenticateJWT, adminOnly, asyncHandler(couponController.getAllCoupons));

/**
 * @swagger
 * /api/v1/coupons/available:
 *   get:
 *     summary: Get available coupons for users
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available coupons retrieved successfully
 */
router.get('/available', authenticateJWT, userAndAbove, asyncHandler(couponController.getAvailableCoupons));

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupons]
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
 *         description: Coupon retrieved successfully
 */
router.get('/:id', authenticateJWT, userAndAbove, asyncHandler(couponController.getCouponById));

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Create new coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - discountType
 *               - discountValue
 *               - validFrom
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount]
 *               discountValue:
 *                 type: number
 *               maxUsage:
 *                 type: integer
 *               minOrderAmount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', authenticateJWT, adminOnly, asyncHandler(couponController.createCoupon));

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   put:
 *     summary: Update coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon updated successfully
 */
router.put('/:id', authenticateJWT, adminOnly, asyncHandler(couponController.updateCoupon));

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
router.delete('/:id', authenticateJWT, adminOnly, asyncHandler(couponController.deleteCoupon));

/**
 * @swagger
 * /api/v1/coupons/validate:
 *   post:
 *     summary: Validate coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 */
router.post('/validate', authenticateJWT, userAndAbove, asyncHandler(couponController.validateCoupon));

export default router; 