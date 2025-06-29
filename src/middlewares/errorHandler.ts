import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';
import { AppError as IAppError } from '../types';

// Custom error class
export class AppError extends Error implements IAppError {
  public statusCode: number;
  public isOperational: boolean;
  public status: string;
  public code?: string;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError = { ...err } as AppError;
  error.message = err.message;

  // Log error
  logger.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose bad ObjectId
  if ((err as any).name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, HTTP_STATUS.CONFLICT);
  }

  // Mongoose validation error
  if ((err as any).name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // JWT errors
  if ((err as any).name === 'JsonWebTokenError') {
    const message = ERROR_MESSAGES.INVALID_TOKEN;
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  if ((err as any).name === 'TokenExpiredError') {
    const message = ERROR_MESSAGES.INVALID_TOKEN;
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  // Multer errors
  if ((err as any).code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // Rate limit errors
  if ((err as any).type === 'entity.too.large') {
    const message = 'Request entity too large';
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // Default error
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        name: (err as any).name,
        code: (err as any).code,
        statusCode: error.statusCode,
      }
    }),
  });
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 