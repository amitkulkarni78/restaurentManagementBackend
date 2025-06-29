import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, ORDER_STATUS } from '../utils/constants';
import logger from '../utils/logger';
import db from '../config/db';
import { IAuthRequest, IOrder, OrderStatus, OrderType } from '../types';

class OrderController {
  // Get all orders (Staff/Admin)
  async getAllOrders(req: Request, res: Response): Promise<void> {
    const { status, orderType, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (orderType) whereClause.orderType = orderType;

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
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get user's orders
  async getMyOrders(req: IAuthRequest, res: Response): Promise<void> {
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
    if (status) whereClause.status = status;

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
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get order by ID
  async getOrderById(req: Request, res: Response): Promise<void> {
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
      throw new AppError(ERROR_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order,
    });
  }

  // Create new order
  async createOrder(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const orderData = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');
   

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const order = orderRepository.create({
      ...orderData,
      orderNumber: orderNumber,
      userId: req.user.id,
      status: 'pending',
      paymentStatus: 'pending'
    } as IOrder);

    await orderRepository.save(order);


    logger.info(`New order created: ${order.orderNumber}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.ORDER_CREATED,
      data: order,
    });
  }

  // Update order status
  async updateOrderStatus(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new AppError(ERROR_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Update order status
    order.status = status;
    if (notes) {
      (order as any).notes = notes;
    }

    // Update timestamps based on status
    const now = new Date();
    switch (status) {
      case 'confirmed':
        (order as any).confirmedAt = now;
        break;
      case 'preparing':
        (order as any).preparedAt = now;
        break;
      case 'served':
        (order as any).servedAt = now;
        break;
      case 'completed':
        (order as any).completedAt = now;
        break;
    }

    await orderRepository.save(order);

    logger.info(`Order status updated: ${order.orderNumber} -> ${status}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  }

  // Cancel order
  async cancelOrder(req: IAuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new AppError(ERROR_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Only allow cancellation if order is not yet prepared
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new AppError('Order cannot be cancelled at this stage', HTTP_STATUS.BAD_REQUEST);
    }

    // Update order status
    order.status = 'cancelled';
    await orderRepository.save(order);

    logger.info(`Order cancelled: ${order.orderNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  }

  // Get order statistics
  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const [total, pending, confirmed, preparing, ready, served, completed, cancelled] = await Promise.all([
      orderRepository.count(),
      orderRepository.count({ where: { status: 'pending' } }),
      orderRepository.count({ where: { status: 'confirmed' } }),
      orderRepository.count({ where: { status: 'preparing' } }),
      orderRepository.count({ where: { status: 'ready' } }),
      orderRepository.count({ where: { status: 'served' } }),
      orderRepository.count({ where: { status: 'completed' } }),
      orderRepository.count({ where: { status: 'cancelled' } })
    ]);

    const statistics = {
      total,
      pending,
      confirmed,
      preparing,
      ready,
      served,
      completed,
      cancelled,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : '0'
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statistics,
    });
  }
}

export default new OrderController(); 