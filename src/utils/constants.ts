import { UserRole } from '../types';

// User Roles
export const USER_ROLES = {
  ADMIN: UserRole.ADMIN,
  STAFF: UserRole.STAFF,
  USER: UserRole.USER,
} as const;

// Order Types
export const ORDER_TYPES = {
  DINE_IN: 'dine-in',
  DELIVERY: 'delivery',
  TAKE_AWAY: 'take-away',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Auth Providers
export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  UPLOAD_PATH: './uploads',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email/mobile or password',
  EMAIL_EXISTS: 'Email already exists',
  MOBILE_EXISTS: 'Mobile number already exists',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_OTP: 'Invalid OTP',
  USER_NOT_ACTIVE: 'User is not active',
  INVALID_USER_ROLE: 'Invalid user role',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_INPUT: 'Invalid input data',
  INVALID_STATUS: 'Invalid status',
  INVALID_ORDER_TYPE: 'Invalid order type',
  INVALID_PAYMENT_STATUS: 'Invalid payment status',
  INVALID_COUPON_CODE: 'Invalid coupon code',
  INVALID_COUPON_TYPE: 'Invalid coupon type',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INVALID_DELIVERY_STATUS: 'Invalid delivery status',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  INVALID_PAYMENT_CURRENCY: 'Invalid payment currency',

  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_ALREADY_CANCELLED: 'Order is already cancelled',
  
  // Payments
  PAYMENT_FAILED: 'Payment failed',
  INSUFFICIENT_AMOUNT: 'Insufficient payment amount',
  
  // Coupons
  COUPON_NOT_FOUND: 'Coupon not found',
  COUPON_EXPIRED: 'Coupon has expired',
  COUPON_INVALID: 'Invalid coupon code',
  
  // General
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Duplicate entry',

  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_ALREADY_EXISTS: 'Category already exists',
  CATEGORY_NAME_REQUIRED: 'Category name is required',
  CATEGORY_NAME_MIN_LENGTH: 'Category name must be at least 3 characters long',
  CATEGORY_NAME_MAX_LENGTH: 'Category name must be less than 100 characters',
  CATEGORY_DESCRIPTION_REQUIRED: 'Category description is required',
  CATEGORY_INACTIVE: 'Category is inactive',
  CATEGORY_NOT_BELONG_TO_CATEGORY: 'Category does not belong to the specified category',
  CATEGORY_NOT_ACTIVE: 'Category is not active',

  //SubCategories
  SUBCATEGORY_NOT_FOUND: 'Subcategory not found',
  SUBCATEGORY_ALREADY_EXISTS: 'Subcategory already exists',
  SUBCATEGORY_NAME_REQUIRED: 'Subcategory name is required',
  SUBCATEGORY_NAME_MIN_LENGTH: 'Subcategory name must be at least 3 characters long',
  SUBCATEGORY_NAME_MAX_LENGTH: 'Subcategory name must be less than 100 characters',
  SUBCATEGORY_DESCRIPTION_REQUIRED: 'Subcategory description is required',
  SUBCATEGORY_INACTIVE: 'Subcategory is inactive',
  SUBCATEGORY_NOT_BELONG_TO_CATEGORY: 'Subcategory does not belong to the specified category',
  SUBCATEGORY_NOT_ACTIVE: 'Subcategory is inactive',

  //MenuItems
  MENU_ITEM_NOT_FOUND: 'Menu item not found',
  MENU_ITEM_ALREADY_EXISTS: 'Menu item already exists',
  MENU_ITEM_NAME_REQUIRED: 'Menu item name is required',
  MENU_ITEM_NAME_MIN_LENGTH: 'Menu item name must be at least 3 characters long',
  MENU_ITEM_NAME_MAX_LENGTH: 'Menu item name must be less than 100 characters',
  MENU_ITEM_DESCRIPTION_REQUIRED: 'Menu item description is required',
  MENU_ITEM_NOT_UPDATED: 'Menu item not updated',
  MENU_ITEM_NOT_DELETED: 'Menu item not deleted',
  NO_IMAGES_PROVIDED: 'No images provided',
  DATABASE_NOT_CONNECTED: 'Database not connected',
  
};

// Success Messages
export const SUCCESS_MESSAGES = {
  // Authentication
  USER_CREATED: 'User created successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  
  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  
  // Payments
  PAYMENT_SUCCESS: 'Payment processed successfully',
  REFUND_SUCCESS: 'Refund processed successfully',
  
  // Coupons
  COUPON_APPLIED: 'Coupon applied successfully',
  COUPON_VALID: 'Coupon is valid',
  
  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
  RESOURCE_CREATED: 'Resource created successfully',
  RESOURCE_UPDATED: 'Resource updated successfully',
  RESOURCE_DELETED: 'Resource deleted successfully',

  // Categories
  CATEGORIES_RETRIEVED: 'Categories retrieved successfully',
  CATEGORY_RETRIEVED: 'Category retrieved successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  CATEGORY_STATISTICS_RETRIEVED: 'Category statistics retrieved successfully',

  //SubCategories
  SUBCATEGORIES_RETRIEVED: 'Subcategories retrieved successfully',
  SUBCATEGORY_RETRIEVED: 'Subcategory retrieved successfully',
  SUBCATEGORY_CREATED: 'Subcategory created successfully',
  SUBCATEGORY_UPDATED: 'Subcategory updated successfully',
  SUBCATEGORY_DELETED: 'Subcategory deleted successfully',
  SUBCATEGORY_STATISTICS_RETRIEVED: 'Subcategory statistics retrieved successfully',
  
  //MenuItems
  MENU_ITEMS_RETRIEVED: 'Menu items retrieved successfully',
  MENU_ITEM_RETRIEVED: 'Menu item retrieved successfully',
  MENU_ITEM_CREATED: 'Menu item created successfully',
  MENU_ITEM_UPDATED: 'Menu item updated successfully',
  MENU_ITEM_DELETED: 'Menu item deleted successfully',  
  IMAGES_UPLOADED_SUCCESSFULLY: 'Images uploaded successfully',
  IMAGE_REMOVED_SUCCESSFULLY: 'Image removed successfully',
  MENU_ITEM_STATISTICS_RETRIEVED: 'Menu item statistics retrieved successfully',
  
}; 