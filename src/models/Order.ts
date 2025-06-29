import { EntitySchema } from 'typeorm';
import { IOrder, OrderItem, OrderStatus, OrderType, PaymentStatus, PaymentMethod } from '../types';

export class Order implements IOrder {
  id?: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = {
  name: 'Order',
  target: Order,
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    orderNumber: {
      type: 'varchar',
      length: 50,
      unique: true,
      nullable: false
    },
    userId: {
      type: 'uuid',
      nullable: true
    },
    customerName: {
      type: 'varchar',
      length: 100,
      nullable: true
    },
    customerPhone: {
      type: 'varchar',
      length: 15,
      nullable: true
    },
    customerEmail: {
      type: 'varchar',
      length: 100,
      nullable: true
    },
    orderType: {
      type: 'enum',
      enum: ['dine_in', 'takeaway', 'delivery'],
      default: 'dine_in'
    },
    items: {
      type: 'json',
      nullable: false
    },
    subtotal: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    },
    tax: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    discount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    total: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false
    },
    status: {
      type: 'enum',
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: 'enum',
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: 'enum',
      enum: ['cash', 'card', 'online', 'wallet'],
      nullable: true
    },
    specialInstructions: {
      type: 'text',
      nullable: true
    },
    estimatedTime: {
      type: 'int',
      nullable: true
    },
    actualTime: {
      type: 'int',
      nullable: true
    },
    deliveryAddress: {
      type: 'text',
      nullable: true
    },
    deliveryFee: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    couponCode: {
      type: 'varchar',
      length: 50,
      nullable: true
    },
    couponDiscount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0
    },
    createdAt: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP'
    },
    updatedAt: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP'
    },
    confirmedAt: {
      type: 'timestamp',
      nullable: true
    },
    preparedAt: {
      type: 'timestamp',
      nullable: true
    },
    servedAt: {
      type: 'timestamp',
      nullable: true
    },
    completedAt: {
      type: 'timestamp',
      nullable: true
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' }
    }
  }
};

export default new EntitySchema(orderSchema as any); 