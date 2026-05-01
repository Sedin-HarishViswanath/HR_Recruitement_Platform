import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { sendResponse } from '../utils/response';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return sendResponse(res, err.statusCode, false, err.message);
  }

  console.error('ERROR 💥', err);
  return sendResponse(res, 500, false, 'Something went very wrong!');
};
