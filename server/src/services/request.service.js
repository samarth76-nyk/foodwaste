/**
 * ==============================================================================
 * SHAREBITE - RECEIVER REQUEST & DONATION WORKFLOW SERVICE
 * ==============================================================================
 * Features:
 * - Database persistence, audit logging in Firestore
 * - Complete donation workflow, request food, accept/reject, status transitions
 * ==============================================================================
 */

import { db } from '../config/firebase.js';
import { REQUEST_STATUS, FOOD_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { donationService, parseNumericQuantity } from './donation.service.js';

const COLLECTION_NAME = 'food_requests';

export const requestService = {
  /**
   * Retrieve all food requests from database with optional filters
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.foodId]
   * @param {string} [filters.receiverId]
   * @param {string} [filters.donorId]
   * @returns {Promise<Array>}
   */
  async getAllRequests(filters = {}) {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    let requests = snapshot.docs.map((d) => d.data());

    if (filters.status) {
      const matchStatus = filters.status.toUpperCase();
      requests = requests.filter((r) => (r.requestStatus || '').toUpperCase() === matchStatus);
    }
    if (filters.foodId) {
      requests = requests.filter((r) => r.foodId === filters.foodId);
    }
    if (filters.receiverId) {
      requests = requests.filter((r) => r.receiverId === filters.receiverId);
    }
    if (filters.donorId) {
      requests = requests.filter((r) => r.donorId === filters.donorId);
    }

    // Sort descending by creation timestamp
    requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return requests;
  },

  /**
   * Retrieve single request by requestId
   * @param {string} requestId
   * @returns {Promise<Object|null>}
   */
  async getRequestById(requestId) {
    if (!requestId) return null;
    const doc = await db.collection(COLLECTION_NAME).doc(requestId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data();
  },

  /**
   * Get all requests made by a specific receiver
   * @param {string} receiverId
   * @returns {Promise<Array>}
   */
  async getRequestsByReceiver(receiverId) {
    return this.getAllRequests({ receiverId });
  },

  /**
   * Get all requests for food listings belonging to a specific donor
   * @param {string} donorId
   * @returns {Promise<Array>}
   */
  async getRequestsByDonor(donorId) {
    return this.getAllRequests({ donorId });
  },

  /**
   * Create and store a receiver request in the database
   * @param {Object} requestData
   * @param {Object} [userContext]
   * @returns {Promise<Object>} Created request document
   */
  async createRequest(requestData, userContext = null) {
    const { foodId, receiverId, requestedQuantity, notes } = requestData;

    // 1. Validate that food donation exists in database
    const food = await donationService.getDonationById(foodId);
    if (!food) {
      throw ApiError.notFound(`Food listing with ID '${foodId}' was not found`);
    }

    // 2. Check food status
    const nonRequestableStatuses = [
      FOOD_STATUS.EXPIRED,
      FOOD_STATUS.CANCELLED,
      FOOD_STATUS.COLLECTED,
      FOOD_STATUS.COMPLETED
    ];
    if (nonRequestableStatuses.includes(food.status)) {
      throw ApiError.badRequest(`This food donation is currently marked '${food.status}' and cannot be requested`);
    }

    // 3. Extract numeric portion of food availability
    const availableQty = food.availableQuantity !== undefined
      ? food.availableQuantity
      : parseNumericQuantity(food.quantity);

    const requestedQty = Number(requestedQuantity);
    if (requestedQty <= 0) {
      throw ApiError.badRequest('Requested quantity must be greater than 0');
    }

    if (availableQty <= 0 || food.status === FOOD_STATUS.CLAIMED) {
      throw ApiError.badRequest('This food donation has already been fully claimed');
    }

    if (requestedQty > availableQty) {
      throw ApiError.badRequest(
        `Requested quantity (${requestedQty}) exceeds available portions (${availableQty})`
      );
    }

    // 4. Prevent duplicate pending requests from the same receiver for this food
    const existingPending = (await this.getAllRequests({ foodId, receiverId })).filter(
      (r) => r.requestStatus === REQUEST_STATUS.PENDING
    );
    if (existingPending.length > 0) {
      throw ApiError.conflict('You already have a pending request for this food listing');
    }

    // Resolve receiver name if not provided
    let receiverName = requestData.receiverName || userContext?.name;
    if (!receiverName && receiverId) {
      try {
        const userDoc = await db.collection('users').doc(receiverId).get();
        if (userDoc.exists) {
          receiverName = userDoc.data().name;
        }
      } catch (e) {
        // Fallback default
      }
    }

    const requestId = requestData.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newRequest = {
      requestId,
      foodId,
      foodName: food.foodName,
      donorId: food.donorId,
      receiverId,
      receiverName: receiverName || 'Registered Community Receiver',
      requestedQuantity: requestedQty,
      requestStatus: requestData.requestStatus || REQUEST_STATUS.PENDING,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 5. Update food status to REQUESTED if currently AVAILABLE
    if (food.status === FOOD_STATUS.AVAILABLE) {
      await donationService.updateDonationStatus(food.foodId, FOOD_STATUS.REQUESTED);
    }

    // Store in Firestore
    await db.collection(COLLECTION_NAME).doc(requestId).set(newRequest);

    // Write audit trail
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      await db.collection('audit_logs').doc(logId).set({
        logId,
        action: 'REQUEST_SUBMITTED',
        performedBy: receiverId,
        targetEntityId: requestId,
        metadata: { foodId, requestedQuantity: requestedQty },
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Non-blocking
    }

    return newRequest;
  },

  /**
   * Update request status (e.g. PENDING -> APPROVED / REJECTED -> COLLECTED)
   * Enforces complete donation workflow state machine
   * @param {string} requestId
   * @param {string} newStatus
   * @param {Object} [metadata]
   * @param {Object} [userContext]
   * @returns {Promise<Object>}
   */
  async updateRequestStatus(requestId, newStatus, metadata = {}, userContext = null) {
    const existing = await this.getRequestById(requestId);
    if (!existing) {
      throw ApiError.notFound(`Food request with ID '${requestId}' was not found`);
    }

    let normalizedStatus = newStatus.toUpperCase();
    if (normalizedStatus === 'ACCEPTED') normalizedStatus = REQUEST_STATUS.APPROVED;

    if (!Object.values(REQUEST_STATUS).includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid request status '${newStatus}'. Must be one of: ${Object.values(REQUEST_STATUS).join(', ')}`
      );
    }

    const previousStatus = existing.requestStatus;
    if (previousStatus === normalizedStatus) {
      return existing; // idempotent no-op
    }

    const updatedAt = new Date().toISOString();
    const updatedRequest = {
      ...existing,
      requestStatus: normalizedStatus,
      updatedAt
    };

    // 1. APPROVED / ACCEPTED
    if (normalizedStatus === REQUEST_STATUS.APPROVED) {
      if (previousStatus !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(`Cannot approve request in '${previousStatus}' status. Must be PENDING.`);
      }

      await donationService.deductQuantity(existing.foodId, existing.requestedQuantity);
      updatedRequest.approvedAt = updatedAt;
    } 
    // 2. REJECTED
    else if (normalizedStatus === REQUEST_STATUS.REJECTED) {
      if (previousStatus !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(`Cannot reject request in '${previousStatus}' status. Must be PENDING.`);
      }

      updatedRequest.rejectedAt = updatedAt;
      if (metadata.rejectionReason) {
        updatedRequest.rejectionReason = metadata.rejectionReason;
      }

      // Check if food status should revert to AVAILABLE
      const food = await donationService.getDonationById(existing.foodId);
      if (food && (food.availableQuantity || 0) > 0) {
        const remainingPending = (await this.getAllRequests({
          foodId: existing.foodId,
          status: REQUEST_STATUS.PENDING
        })).filter((r) => r.requestId !== requestId);

        if (remainingPending.length === 0) {
          await donationService.updateDonationStatus(food.foodId, FOOD_STATUS.AVAILABLE);
        }
      }
    } 
    // 3. COLLECTED
    else if (normalizedStatus === REQUEST_STATUS.COLLECTED) {
      if (previousStatus !== REQUEST_STATUS.APPROVED) {
        throw ApiError.badRequest(`Cannot mark request COLLECTED unless it has been APPROVED first.`);
      }

      updatedRequest.collectedAt = updatedAt;
      // Mark food status as COLLECTED
      await donationService.updateDonationStatus(existing.foodId, FOOD_STATUS.COLLECTED);
    } 
    // 4. CANCELLED
    else if (normalizedStatus === REQUEST_STATUS.CANCELLED) {
      if (previousStatus === REQUEST_STATUS.APPROVED) {
        await donationService.restoreQuantity(existing.foodId, existing.requestedQuantity);
      }
      updatedRequest.cancelledAt = updatedAt;
    }

    await db.collection(COLLECTION_NAME).doc(requestId).update(updatedRequest);

    // Write audit trail
    try {
      const logId = `log_${Date.now()}`;
      await db.collection('audit_logs').doc(logId).set({
        logId,
        action: 'REQUEST_STATUS_CHANGED',
        performedBy: existing.receiverId,
        targetEntityId: requestId,
        metadata: { from: previousStatus, to: normalizedStatus },
        timestamp: updatedAt
      });
    } catch (e) {
      // Non-blocking
    }

    return updatedRequest;
  },

  /**
   * Convenience method: Accept / Approve a food request
   * @param {string} requestId
   * @param {Object} [userContext]
   * @returns {Promise<Object>}
   */
  async acceptRequest(requestId, userContext = null) {
    return this.updateRequestStatus(requestId, REQUEST_STATUS.APPROVED, {}, userContext);
  },

  /**
   * Convenience method: Reject a food request
   * @param {string} requestId
   * @param {string} [rejectionReason]
   * @param {Object} [userContext]
   * @returns {Promise<Object>}
   */
  async rejectRequest(requestId, rejectionReason = '', userContext = null) {
    return this.updateRequestStatus(
      requestId,
      REQUEST_STATUS.REJECTED,
      { rejectionReason },
      userContext
    );
  },

  /**
   * Convenience method: Mark an approved request as collected
   * @param {string} requestId
   * @param {Object} [userContext]
   * @returns {Promise<Object>}
   */
  async collectRequest(requestId, userContext = null) {
    return this.updateRequestStatus(requestId, REQUEST_STATUS.COLLECTED, {}, userContext);
  }
};

export default requestService;
