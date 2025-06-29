import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwtConfig from '../config/jwt';
import { AppError } from './errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '../utils/constants';
import logger from '../utils/logger';
import { IAuthRequest, UserRole } from '../types';

// JWT Authentication middleware
export const authenticateJWT = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      logger.error('JWT Authentication error:', err);
      return next(new AppError(ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR));
    }

    if (!user) {
      return next(new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN));
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt: User ${req.user.id} with role ${req.user.role} tried to access ${req.originalUrl}`);
      return next(new AppError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize(USER_ROLES.ADMIN);

// Staff and Admin middleware
export const staffAndAdmin = authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN);

// User and above middleware
export const userAndAbove = authorize(USER_ROLES.USER, USER_ROLES.STAFF, USER_ROLES.ADMIN);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err || !user) {
      return next(); // Continue without authentication
    }

    if (!user.isActive) {
      return next(); // Continue without authentication
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Verify token without authentication (for refresh tokens)
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new AppError('Authorization header missing', HTTP_STATUS.UNAUTHORIZED));
    }

    const token = jwtConfig.getTokenFromHeader(authHeader);
    const decoded = jwtConfig.verifyToken(token);

    (req as any).tokenPayload = decoded;
    next();
  } catch (error) {
    return next(new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED));
  }
};

// Verify refresh token
export const verifyRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST));
    }

    const decoded = jwtConfig.verifyRefreshToken(refreshToken);
    (req as any).refreshTokenPayload = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED));
  }
};

// Check if user owns the resource or is admin
export const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    // Admin can access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    if (resourceUserId && resourceUserId.toString() === req.user.id?.toString()) {
      return next();
    }

    return next(new AppError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, HTTP_STATUS.FORBIDDEN));
  };
};

// Rate limiting for authentication endpoints
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// OTP rate limiting
export const otpRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 OTP request per minute
  message: {
    error: 'Please wait before requesting another OTP.',
  },
  standardHeaders: true,
  legacyHeaders: false,
}; 