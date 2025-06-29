import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import logger from '../utils/logger';
import { ICoupon, DiscountType } from '../types';

class CouponController {
  // Get all coupons (Admin only)
  async getAllCoupons(req: Request, res: Response): Promise<void> {
    // Mock data - in real implementation, you'd have a Coupon model
    const coupons: ICoupon[] = [{
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
      usedCount: 0,
      maxUsage: 100,
      currentUsage: 0,
      minOrderAmount: 50,
      isActive: true,
      description: 'Welcome discount for new customers',
      applicableCategories: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: coupons,
    });
  }

  // Get available coupons for users
  async getAvailableCoupons(req: Request, res: Response): Promise<void> {
    const now = new Date();

    // Mock data - filter active and valid coupons
    const coupons: ICoupon[] = [{
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
      usedCount: 0,
      maxUsage: 100,
      currentUsage: 0,
      minOrderAmount: 50,
      isActive: true,
      description: 'Welcome discount for new customers',
      applicableCategories: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    }].filter(coupon =>
      coupon.isActive &&
      coupon.validFrom <= now &&
      coupon.validUntil >= now &&
      coupon.usedCount < coupon.usageLimit
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: coupons,
    });
  }

  // Get coupon by ID
  async getCouponById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Mock data - in real implementation, you'd fetch from database
    const coupon: ICoupon = {
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
      usedCount: 0,
      maxUsage: 100,
      currentUsage: 0,
      minOrderAmount: 50,
      isActive: true,
      description: 'Welcome discount for new customers',
      applicableCategories: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!coupon) {
      throw new AppError('Coupon not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: coupon,
    });
  }

  // Create new coupon (Admin only)
  async createCoupon(req: Request, res: Response): Promise<void> {
    const couponData = req.body;

    // Mock implementation - in real app, save to database
    const coupon: ICoupon = {
      id: Date.now().toString(),
      ...couponData,
      isActive: true,
      usedCount: 0,
      currentUsage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.info(`New coupon created: ${coupon.code}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  }

  // Update coupon (Admin only)
  async updateCoupon(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updateData = req.body;

    // Mock implementation
    const coupon: ICoupon = {
      id,
      ...updateData,
      updatedAt: new Date()
    };

    logger.info(`Coupon updated: ${coupon.code}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  }

  // Delete coupon (Admin only)
  async deleteCoupon(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Mock implementation
    logger.info(`Coupon deleted: ${id}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  }

  // Validate coupon code
  async validateCoupon(req: Request, res: Response): Promise<void> {
    const { code, orderAmount } = req.body;

    // Mock validation logic
    const coupon: ICoupon = {
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
      usedCount: 0,
      maxUsage: 100,
      currentUsage: 0,
      minOrderAmount: 50,
      isActive: true,
      description: 'Welcome discount for new customers',
      applicableCategories: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!coupon || coupon.code !== code) {
      throw new AppError('Invalid coupon code', HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();
    if (!coupon.isActive || coupon.validFrom > now || coupon.validUntil < now) {
      throw new AppError('Coupon is not valid', HTTP_STATUS.BAD_REQUEST);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit exceeded', HTTP_STATUS.BAD_REQUEST);
    }

    if (orderAmount < coupon.minOrderAmount) {
      throw new AppError(`Minimum order amount required: $${coupon.minOrderAmount}`, HTTP_STATUS.BAD_REQUEST);
    }

    const discountAmount = coupon.discountType === DiscountType.PERCENTAGE ?
      (orderAmount * coupon.discountValue / 100) :
      coupon.discountValue;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon,
        discountAmount,
        finalAmount: orderAmount - discountAmount,
      },
    });
  }

  // Apply coupon to order
  async applyCoupon(req: Request, res: Response): Promise<void> {
    const { code, orderId } = req.body;

    // Mock implementation - in real app, update order with coupon details
    const coupon: ICoupon = {
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      usageLimit: 100,
      usedCount: 0,
      maxUsage: 100,
      currentUsage: 0,
      minOrderAmount: 50,
      isActive: true,
      description: 'Welcome discount for new customers',
      applicableCategories: ['all'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Increment usage
    coupon.usedCount += 1;
    coupon.currentUsage += 1;

    logger.info(`Coupon applied to order: ${orderId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon,
        orderId
      },
    });
  }
}

export default new CouponController(); 