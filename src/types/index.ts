import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User Types
export interface IUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  profilePicture?: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    dietaryRestrictions: string[];
    favoriteCuisines: string[];
    notificationSettings: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  refreshToken?: string;
  loginAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user',
}

// Order Types
export interface IOrder {
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

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  customization?: {
    [key: string]: string | number | boolean;
  };
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
}

// Payment Types
export interface IPayment {
  id?: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  refundAmount?: number;
  refundReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Coupon Types
export interface ICoupon {
  id?: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxUsage: number;
  currentUsage: number;
  minOrderAmount: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableCategories?: string[];
  applicableItems?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

// Delivery Types
export interface IDelivery {
  id?: string;
  orderId: string;
  deliveryPersonId?: string;
  status: DeliveryStatus;
  pickupTime?: Date;
  deliveryTime?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  deliveryFee: number;
  trackingNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Authentication Types
export interface IAuthRequest extends Request {
  user?: any;
}

export interface IJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp?: number; 
  iat?: number;
  iss?: string;
  aud?: string;
}

export interface IRefreshTokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search Types
export interface SearchQuery extends PaginationQuery {
  search?: string;
  filters?: Record<string, any>;
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Notification Types
export interface INotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
}

// Database Types
export interface DatabaseStats {
  users: number;
  orders: number;
  database: string;
  type: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  uptime?: number;
  environment?: string;
  database?: {
    connected: boolean;
    name: string;
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
  };
} 