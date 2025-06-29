// User Roles
const USER_ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff',
    USER: 'User',
};

// Order Types
const ORDER_TYPES = {
    DINE_IN: 'dine-in',
    DELIVERY: 'delivery',
    TAKE_AWAY: 'take-away',
};

// Order Status
const ORDER_STATUS = {
    CREATED: 'created',
    ACCEPTED: 'accepted',
    PREPARED: 'prepared',
    SERVED: 'served',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

// Payment Status
const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};

// Auth Providers
const AUTH_PROVIDERS = {
    LOCAL: 'local',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
};

// OTP Configuration
const OTP_CONFIG = {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
};

// File Upload
const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    UPLOAD_PATH: './uploads',
};

// Pagination
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};

// Rate Limiting
const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
};

// JWT Configuration
const JWT_CONFIG = {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
};

// HTTP Status Codes
const HTTP_STATUS = {
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
};

// Error Messages
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    INTERNAL_ERROR: 'Internal server error',
    INVALID_TOKEN: 'Invalid or expired token',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already exists',
    MOBILE_EXISTS: 'Mobile number already exists',
    INVALID_OTP: 'Invalid OTP',
    OTP_EXPIRED: 'OTP expired',
    ORDER_NOT_FOUND: 'Order not found',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
};

// Success Messages
const SUCCESS_MESSAGES = {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    OTP_SENT: 'OTP sent successfully',
    OTP_VERIFIED: 'OTP verified successfully',
    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',
    PAYMENT_SUCCESS: 'Payment successful',
};

module.exports = {
    USER_ROLES,
    ORDER_TYPES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    AUTH_PROVIDERS,
    OTP_CONFIG,
    FILE_UPLOAD,
    PAGINATION,
    RATE_LIMIT,
    JWT_CONFIG,
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
};