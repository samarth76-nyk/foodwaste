import { HTTP_STATUS } from '../config/constants.js';

/**
 * Standard Envelope for API Responses
 * Ensures every frontend request gets a consistent JSON structure:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "Success message",
 *   data: { ... },
 *   meta: { ... },
 *   timestamp: "2026-11-13T..."
 * }
 */
export class ApiResponse {
  constructor(statusCode = HTTP_STATUS.OK, data = null, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
    this.timestamp = new Date().toISOString();
  }

  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, meta));
  }

  static created(res, data = null, message = 'Resource created successfully', meta = null) {
    return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, data, message, meta));
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
}

export default ApiResponse;
