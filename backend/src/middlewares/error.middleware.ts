import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`[${err.name}] ${err.message}`, { statusCode: err.statusCode, stack: err.stack, path: req.path });
    
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle errors that come from express-openapi-validator if it's set up
  if ('status' in err && typeof err.status === 'number') {
    logger.error(`[OpenAPI Validator Error] ${err.message}`, { statusCode: err.status, stack: err.stack, path: req.path });
    
    res.status(err.status).json({
      error: 'ValidationError',
      message: err.message,
      statusCode: err.status,
      details: (err as any).errors || undefined,
    });
    return;
  }

  // Unhandled generic errors
  logger.error(`[UnhandledError] ${err.message}`, { stack: err.stack, path: req.path });
  
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Internal server error',
    statusCode: 500,
  });
};