import { ApiError } from '../utils/ApiError.js';

/**
 * Reusable Zod Validation Middleware
 * Validates request payload against a Zod schema.
 * 
 * @param {import('zod').ZodSchema} schema Zod schema to validate against
 * @param {'body' | 'params' | 'query'} [source='body'] Request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // assign back parsed and sanitized data
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(ApiError.badRequest('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};

export default validate;
