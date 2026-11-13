import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { requestService } from '../services/request.service.js';

/**
 * ==============================================================================
 * FOOD REQUESTS CONTROLLER (INTEGRATION PLACEHOLDERS)
 * ==============================================================================
 * Responsible Teammate: Teammate 3 (Food Donation, Requests & Admin Functionality)
 */

export const getAllRequests = asyncHandler(async (req, res) => {
  const { status, foodId, receiverId } = req.query;
  const requests = await requestService.getAllRequests({ status, foodId, receiverId });
  return ApiResponse.success(res, requests, 'Food requests retrieved successfully', 200, {
    count: requests.length
  });
});

export const getRequestById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await requestService.getRequestById(requestId);
  if (!request) {
    throw ApiError.notFound(`Food request with ID '${requestId}' was not found`);
  }
  return ApiResponse.success(res, request, 'Request details retrieved');
});

export const createRequest = asyncHandler(async (req, res) => {
  // Teammate 3 Integration Point: Validate food availability and create request
  const created = await requestService.createRequest(req.body);
  return ApiResponse.created(res, created, 'Food request submitted successfully');
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { requestStatus } = req.body;
  const updated = await requestService.updateRequestStatus(requestId, requestStatus);
  return ApiResponse.success(res, updated, `Request status changed to ${requestStatus}`);
});

export const getRequestsByUser = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const requests = await requestService.getRequestsByReceiver(receiverId);
  return ApiResponse.success(res, requests, `Requests for receiver ${receiverId} retrieved`);
});

export const requestController = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  getRequestsByUser
};

export default requestController;
