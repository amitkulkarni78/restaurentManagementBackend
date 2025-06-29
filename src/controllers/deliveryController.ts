import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import logger from '../utils/logger';
import db from '../config/db';
import { IAuthRequest, DeliveryStatus } from '../types';

class DeliveryController {
  // Get all deliveries (Staff/Admin)
  async getAllDeliveries(req: Request, res: Response): Promise<void> {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const whereClause: any = { orderType: 'delivery' };
    if (status) whereClause.deliveryStatus = status;

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
        deliveries: orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }

  // Get delivery by ID
  async getDeliveryById(req: Request, res: Response): Promise<void> {
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

    if (!order || order.orderType !== 'delivery') {
      throw new AppError('Delivery not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order,
    });
  }

  // Assign delivery person
  async assignDeliveryPerson(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { deliveryPersonId } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');
    const userRepository = dataSource.getRepository('User');

    const order = await orderRepository.findOne({ where: { id } });
    if (!order || order.orderType !== 'delivery') {
      throw new AppError('Delivery order not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify delivery person exists and is available
    const deliveryPerson = await userRepository.findOne({ where: { id: deliveryPersonId } });
    if (!deliveryPerson || deliveryPerson.role !== 'staff') {
      throw new AppError('Invalid delivery person', HTTP_STATUS.BAD_REQUEST);
    }

    (order as any).deliveryPersonId = deliveryPersonId;
    (order as any).deliveryStatus = DeliveryStatus.ASSIGNED;
    await orderRepository.save(order);

    logger.info(`Delivery person assigned to order: ${order.orderNumber}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Delivery person assigned successfully',
      data: order,
    });
  }

  // Update delivery status
  async updateDeliveryStatus(req: IAuthRequest, res: Response): Promise<void> {
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
    if (!order || order.orderType !== 'delivery') {
      throw new AppError('Delivery order not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate status transition
    const validStatuses: DeliveryStatus[] = [
      DeliveryStatus.PENDING,
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
      DeliveryStatus.CANCELLED,
      DeliveryStatus.COMPLETED,
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid delivery status', HTTP_STATUS.BAD_REQUEST);
    }

    (order as any).deliveryStatus = status;
    if (notes) {
      (order as any).deliveryNotes = notes;
    }
    await orderRepository.save(order);

    logger.info(`Delivery status updated: ${order.orderNumber} -> ${status}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: order,
    });
  }

  // Get available delivery persons
  async getAvailableDeliveryPersons(req: Request, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const userRepository = dataSource.getRepository('User');

    const deliveryPersons = await userRepository.find({
      where: {
        role: 'staff',
        isActive: true
      },
      select: ['id', 'firstName', 'lastName', 'mobileNumber'],
      order: { firstName: 'ASC', lastName: 'ASC' }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deliveryPersons,
    });
  }

  // Get delivery statistics
  async getDeliveryStatistics(req: Request, res: Response): Promise<void> {
    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [assigned, pickedUp, inTransit, delivered, failed] = await Promise.all([
      orderRepository.count({ where: { orderType: 'delivery', deliveryStatus: DeliveryStatus.ASSIGNED, createdAt: { gte: today } } }),
      orderRepository.count({ where: { orderType: 'delivery', deliveryStatus: DeliveryStatus.PICKED_UP, createdAt: { gte: today } } }),
      orderRepository.count({ where: { orderType: 'delivery', deliveryStatus: DeliveryStatus.IN_TRANSIT, createdAt: { gte: today } } }),
      orderRepository.count({ where: { orderType: 'delivery', deliveryStatus: DeliveryStatus.DELIVERED, createdAt: { gte: today } } }),
      orderRepository.count({ where: { orderType: 'delivery', deliveryStatus: DeliveryStatus.FAILED, createdAt: { gte: today } } })
    ]);

    const totalDeliveries = await orderRepository.count({
      where: { orderType: 'delivery', createdAt: { gte: today } }
    });

    const stats = [
      { status: 'assigned', count: assigned },
      { status: 'picked_up', count: pickedUp },
      { status: 'in_transit', count: inTransit },
      { status: 'delivered', count: delivered },
      { status: 'failed', count: failed }
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        todayStats: stats,
        totalToday: totalDeliveries,
      },
    });
  }

  // Track delivery location (mock implementation)
  async updateDeliveryLocation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const dataSource = db.getDataSource();
    if (!dataSource) {
      throw new AppError('Database not connected', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const orderRepository = dataSource.getRepository('Order');

    const order = await orderRepository.findOne({ where: { id } });
    if (!order || order.orderType !== 'delivery') {
      throw new AppError('Delivery order not found', HTTP_STATUS.NOT_FOUND);
    }

    // In real implementation, you'd store location updates
    logger.info(`Location update for delivery ${order.orderNumber}: ${latitude}, ${longitude}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Location updated successfully',
    });
  }

  // Calculate delivery fee
  async calculateDeliveryFee(req: Request, res: Response): Promise<void> {
    const { distance, orderAmount } = req.body;

    // Mock delivery fee calculation
    let deliveryFee = 5; // Base fee
    if (distance > 5) {
      deliveryFee += (distance - 5) * 2; // $2 per km after 5km
    }

    // Free delivery for orders over $50
    if (orderAmount >= 50) {
      deliveryFee = 0;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        deliveryFee,
        distance,
        orderAmount,
        isFreeDelivery: deliveryFee === 0
      },
    });
  }
}

export default new DeliveryController(); 