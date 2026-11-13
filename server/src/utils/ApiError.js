import { HTTP_STATUS } from '../config/constants.js';

/**
 * Custom Operational Error Class
 * Formats predictable errors captured by the global error handler.
 */
export class ApiError extends Error {
  constructor(statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden resource') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict with existing resource') {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static unprocessable(message = 'Unprocessable Entity', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}

export default ApiError;
