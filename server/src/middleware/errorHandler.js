import { HTTP_STATUS } from '../config/constants.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * Central Error Handling Middleware
 * Catches all operational and unexpected errors, returning a uniform JSON structure.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Log error details
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - Internal Error:`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - Client Error (${statusCode}):`, message);
  }

  // Handle JSON parse syntax error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Malformed JSON syntax in request body';
  }

  const responsePayload = {
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  };

  // Include stack trace only in development
  if (env.isDevelopment && statusCode >= 500) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

export default errorHandler;
