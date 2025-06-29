import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import logger from '../utils/logger';
import db from '../config/db';
import { IAuthRequest, PaymentStatus, PaymentMethod } from '../types';

class PaymentController {
  // Get all payments (Staff/Admin)
  async getAllPayments(req: Request, res: Response): Promise<void> {
    const { status, paymentMethod, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const whereClause: any = {};
    if (status) whereClause.paymentStatus = status;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;

    const orders = await orderRepository.find({
      where: whereClause,
      relations: ['user'],
      skip,
      take: Number(limit),
      order: { createdAt: 'DESC' }
    });

    const total = await orderRepository.count({ where: whereClause });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        payments: orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get user's payments
  async getMyPayments(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const whereClause: any = { userId: req.user.id };
    if (status) whereClause.paymentStatus = status;

    const orders = await orderRepository.find({
      where: whereClause,
      skip,
      take: Number(limit),
      order: { createdAt: 'DESC' }
    });

    const total = await orderRepository.count({ where: whereClause });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        payments: orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get payment by ID
  async getPaymentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!order) {
      throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order,
    });
  }

  // Process payment
  async processPayment(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { orderId, amount, paymentMethod, tip = 0 } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError(ERROR_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Validate payment amount
    if (amount < order.finalAmount) {
      throw new AppError('Payment amount is insufficient', HTTP_STATUS.BAD_REQUEST);
    }

    // Update order with payment details
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    (order as any).tip = tip;
    (order as any).finalAmount = order.finalAmount + tip;
    await orderRepository.save(order);

    logger.info(`Payment processed for order: ${order.orderNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PAYMENT_SUCCESS,
      data: {
        orderNumber: order.orderNumber,
        amount: (order as any).finalAmount,
        paymentMethod,
        tip,
      },
    });
  }

  // Process refund
  async processRefund(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason, amount } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new AppError(ERROR_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (order.paymentStatus !== 'paid') {
      throw new AppError('Order payment is not completed', HTTP_STATUS.BAD_REQUEST);
    }

    // Update order payment status
    order.paymentStatus = 'refunded';
    await orderRepository.save(order);

    logger.info(`Refund processed for order: ${order.orderNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderNumber: order.orderNumber,
        refundAmount: amount || order.finalAmount,
        reason,
      },
    });
  }

  // Get payment statistics
  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const [total, paid, pending, failed, refunded] = await Promise.all([
      orderRepository.count(),
      orderRepository.count({ where: { paymentStatus: 'paid' } }),
      orderRepository.count({ where: { paymentStatus: 'pending' } }),
      orderRepository.count({ where: { paymentStatus: 'failed' } }),
      orderRepository.count({ where: { paymentStatus: 'refunded' } })
    ]);

    const statistics = {
      total,
      paid,
      pending,
      failed,
      refunded,
      successRate: total > 0 ? ((paid / total) * 100).toFixed(2) : '0'
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statistics,
    });
  }
}

export default new PaymentController(); 