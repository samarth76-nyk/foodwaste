import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createRequestSchema,
  updateRequestStatusSchema
} from '../validators/request.validator.js';

const router = Router();

/**
 * ==============================================================================
 * FOOD REQUESTS ROUTES (TEAMMATE 3 INTEGRATION POINT)
 * ==============================================================================
 */

/**
 * @route   GET /api/requests
 * @desc    Get all food requests (filterable by status, foodId, receiverId)
 * @access  Private
 */
router.get('/', authenticate, requestController.getAllRequests);

/**
 * @route   GET /api/requests/:requestId
 * @desc    Get request details by requestId
 * @access  Private
 */
router.get('/:requestId', authenticate, requestController.getRequestById);

/**
 * @route   POST /api/requests
 * @desc    Submit a food request for an available listing
 * @access  Private (Receivers / Organizations)
 */
router.post(
  '/',
  authenticate,
  validate(createRequestSchema),
  requestController.createRequest
);

/**
 * @route   PATCH /api/requests/:requestId/status
 * @desc    Update request status (PENDING -> APPROVED / REJECTED -> COLLECTED)
 * @access  Private (Donor / Volunteer / Admin)
 */
router.patch(
  '/:requestId/status',
  authenticate,
  validate(updateRequestStatusSchema),
  requestController.updateRequestStatus
);

/**
 * @route   POST /api/requests/:requestId/accept
 * @desc    Accept / Approve food request (Member 3 Core Functionality)
 * @access  Private (Donor / Volunteer / Admin)
 */
router.post(
  '/:requestId/accept',
  authenticate,
  requestController.acceptRequest
);

/**
 * @route   POST /api/requests/:requestId/reject
 * @desc    Reject food request (Member 3 Core Functionality)
 * @access  Private (Donor / Volunteer / Admin)
 */
router.post(
  '/:requestId/reject',
  authenticate,
  requestController.rejectRequest
);

/**
 * @route   GET /api/requests/user/:receiverId
 * @desc    Get request history for a specific receiver
 * @access  Private
 */
router.get('/user/:receiverId', authenticate, requestController.getRequestsByUser);

export default router;
