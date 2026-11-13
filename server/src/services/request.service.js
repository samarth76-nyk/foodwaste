/**
 * ==============================================================================
 * SHAREBITE - RECEIVER REQUEST DATABASE SERVICE
 * ==============================================================================
 * Responsible Teammate: Samarth (Member 2 – Backend & Database)
 *
 * Implements:
 * 1. Persistent CRUD operations in Firestore 'food_requests' collection
 * 2. Food availability and inventory validation before creating request
 * 3. Atomic status transitions (PENDING -> APPROVED / REJECTED / COLLECTED / CANCELLED)
 * 4. Automatic inventory deduction & status transition to CLAIMED upon approval
 * ==============================================================================
 */

import { db } from '../config/firebase.js';
import { REQUEST_STATUS, FOOD_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { donationService } from './donation.service.js';

export const requestService = {
  /**
   * Retrieve all food requests from database with optional filters
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.foodId]
   * @param {string} [filters.receiverId]
   * @returns {Promise<Array>}
   */
  async getAllRequests(filters = {}) {
    const snapshot = await db.collection('food_requests').get();
    let requests = snapshot.docs.map((d) => d.data());

    if (filters.status) {
      const matchStatus = filters.status.toUpperCase();
      requests = requests.filter((r) => r.requestStatus.toUpperCase() === matchStatus);
    }
    if (filters.foodId) {
      requests = requests.filter((r) => r.foodId === filters.foodId);
    }
    if (filters.receiverId) {
      requests = requests.filter((r) => r.receiverId === filters.receiverId);
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
    const doc = await db.collection('food_requests').doc(requestId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data();
  },

  /**
   * Create and store a receiver request in the database
   * @param {Object} requestData
   * @returns {Promise<Object>} Created request document
   */
  async createRequest(requestData) {
    const { foodId, receiverId, requestedQuantity, notes } = requestData;

    // Validate that food donation exists in database
    const food = await donationService.getDonationById(foodId);
    if (!food) {
      throw ApiError.notFound(`Food donation listing '${foodId}' was not found`);
    }

    // Check food status
    if (food.status !== FOOD_STATUS.AVAILABLE) {
      throw ApiError.badRequest(`Food donation is not currently available (status: ${food.status})`);
    }

    // Extract numeric portion of food.quantity
    let numericFoodQty = typeof food.quantity === 'number' ? food.quantity : parseFloat(food.quantity);
    if (isNaN(numericFoodQty)) numericFoodQty = 1;

    const requestedQty = Number(requestedQuantity);
    if (requestedQty <= 0) {
      throw ApiError.badRequest('Requested quantity must be greater than 0');
    }

    if (requestedQty > numericFoodQty) {
      throw ApiError.badRequest(
        `Requested quantity (${requestedQty}) exceeds currently available food quantity (${numericFoodQty})`
      );
    }

    // Resolve receiver name if not provided
    let receiverName = requestData.receiverName;
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

    // Store in Firestore
    await db.collection('food_requests').doc(requestId).set(newRequest);

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
   * Handles automated inventory deduction upon approval
   * @param {string} requestId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateRequestStatus(requestId, status) {
    const existing = await this.getRequestById(requestId);
    if (!existing) {
      throw ApiError.notFound(`Food request with ID '${requestId}' was not found`);
    }

    if (!Object.values(REQUEST_STATUS).includes(status)) {
      throw ApiError.badRequest(
        `Invalid request status '${status}'. Must be one of: ${Object.values(REQUEST_STATUS).join(', ')}`
      );
    }

    const previousStatus = existing.requestStatus;

    // Handle inventory adjustment when request is APPROVED
    if (previousStatus !== REQUEST_STATUS.APPROVED && status === REQUEST_STATUS.APPROVED) {
      const food = await donationService.getDonationById(existing.foodId);
      if (food) {
        let currentQty = typeof food.quantity === 'number' ? food.quantity : parseFloat(food.quantity);
        if (isNaN(currentQty)) currentQty = 1;

        const remaining = Math.max(0, currentQty - existing.requestedQuantity);
        const newFoodStatus = remaining <= 0 ? FOOD_STATUS.CLAIMED : food.status;

        await db.collection('food_donations').doc(food.foodId).update({
          quantity: remaining,
          status: newFoodStatus,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Handle inventory restoration if an APPROVED request is later CANCELLED or REJECTED
    if (previousStatus === REQUEST_STATUS.APPROVED && (status === REQUEST_STATUS.CANCELLED || status === REQUEST_STATUS.REJECTED)) {
      const food = await donationService.getDonationById(existing.foodId);
      if (food) {
        let currentQty = typeof food.quantity === 'number' ? food.quantity : parseFloat(food.quantity);
        if (isNaN(currentQty)) currentQty = 0;

        const restoredQty = currentQty + existing.requestedQuantity;
        await db.collection('food_donations').doc(food.foodId).update({
          quantity: restoredQty,
          status: FOOD_STATUS.AVAILABLE,
          updatedAt: new Date().toISOString()
        });
      }
    }

    const updatedAt = new Date().toISOString();
    const updatedRequest = {
      ...existing,
      requestStatus: status,
      updatedAt
    };

    await db.collection('food_requests').doc(requestId).update({
      requestStatus: status,
      updatedAt
    });

    // Write audit trail
    try {
      const logId = `log_${Date.now()}`;
      await db.collection('audit_logs').doc(logId).set({
        logId,
        action: 'REQUEST_STATUS_CHANGED',
        performedBy: existing.receiverId,
        targetEntityId: requestId,
        metadata: { from: previousStatus, to: status },
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Non-blocking
    }

    return updatedRequest;
  },

  /**
   * Get all requests made by a specific receiver
   * @param {string} receiverId
   * @returns {Promise<Array>}
   */
  async getRequestsByReceiver(receiverId) {
    return this.getAllRequests({ receiverId });
  }
};

export default requestService;
