import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { requestService } from '../services/request.service.js';

/**
 * ==============================================================================
 * FOOD REQUESTS CONTROLLER
 * ==============================================================================
 * Responsible Teammate: Teammate 3 / Shreya (Food Donation, Requests & Admin)
 * ==============================================================================
 */

export const getAllRequests = asyncHandler(async (req, res) => {
  const { status, foodId, receiverId, donorId } = req.query;
  const requests = await requestService.getAllRequests({ status, foodId, receiverId, donorId });
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
  // Validate food availability and create request
  const created = await requestService.createRequest(req.body, req.user);
  return ApiResponse.created(res, created, 'Food request submitted successfully');
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { requestStatus, rejectionReason } = req.body;
  const updated = await requestService.updateRequestStatus(
    requestId,
    requestStatus,
    { rejectionReason },
    req.user
  );
  return ApiResponse.success(res, updated, `Request status changed to ${updated.requestStatus}`);
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const updated = await requestService.acceptRequest(requestId, req.user);
  return ApiResponse.success(res, updated, 'Food request approved successfully');
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { rejectionReason } = req.body || {};
  const updated = await requestService.rejectRequest(requestId, rejectionReason, req.user);
  return ApiResponse.success(res, updated, 'Food request rejected successfully');
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
  acceptRequest,
  rejectRequest,
  getRequestsByUser
};

export default requestController;
