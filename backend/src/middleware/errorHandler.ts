import { Request, Response, NextFunction } from 'express';
import { errorReportingService } from '../utils/errorReporting';
import { logger } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error logger
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });
  
  // Report to Sentry (only for non-operational errors or 5xx errors)
  if (!(error instanceof AppError) || error.statusCode >= 500) {
    errorReportingService.reportError(error, {
      endpoint: req.path,
      method: req.method,
      userId: (req as any).userId,
      body: req.body,
      query: req.query,
    });
  }
  
  next(error);
};

// Error handler
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.message) {
    message = error.message;
  }

  // Don't send stack trace in production
  const response: any = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

