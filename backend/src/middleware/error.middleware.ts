
import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import logger from '../config/logger'

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = err.status ?? 500
  let message = err.message ?? 'Internal Server Error'

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413
      message = 'File too large. Max size is 5MB.'
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      status = 400
      message = 'Too many files uploaded.'
    }
  }

  if (status >= 500) {
    logger.error({
      event_action: 'http_request_error',
      status,
      method: req.method,
      path: req.path,
      error_message: message,
      stack: err.stack,
      user_id: (req as any).user?.id,
    }, 'Internal server error')
  } else if (status >= 400) {
    logger.warn({
      event_action: 'http_request_error',
      status,
      method: req.method,
      path: req.path,
      error_message: message,
      user_id: (req as any).user?.id,
    }, 'Client error')
  }

  res.status(status).json({
    success: false,
    message
  })
}