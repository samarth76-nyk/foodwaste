import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: [${req.method}] ${req.originalUrl}`));
};

export default notFoundHandler;
