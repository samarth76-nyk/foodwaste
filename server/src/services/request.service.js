/**
 * ==============================================================================
 * SHAREBITE - FOOD REQUEST SERVICE
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 3 / Shreya (Food Donation, Requests & Admin)
 * 
 * CORE FUNCTIONALITY DELIVERABLE:
 * - Food request creation with portion checks
 * - Accept / Reject request workflow
 * - Status lifecycle updates (Pending -> Approved / Rejected -> Collected)
 * - Food status synchronization (Available / Requested / Collected)
 * - Dual-mode persistence (Firestore & local development store)
 * ==============================================================================
 */

import { REQUEST_STATUS, FOOD_STATUS } from '../config/constants.js';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';
import { donationService } from './donation.service.js';

const COLLECTION_NAME = 'food_requests';

// Stateful in-memory repository for local development and unit tests
const inMemoryRequests = new Map();

// Seed initial mock requests
const seedRequests = [
  {
    requestId: 'req_001',
    foodId: 'food_001',
    foodName: 'Fresh Vegetable Curry & Rice',
    receiverId: 'shelter_hope_haven',
    receiverName: 'Hope Haven Shelter',
    donorId: 'donor_cafe_central',
    requestedQuantity: 10,
    requestStatus: REQUEST_STATUS.PENDING,
    notes: 'Can collect by 2 PM using insulated containers.',
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1800 * 1000).toISOString()
  },
  {
    requestId: 'req_002',
    foodId: 'food_002',
    foodName: 'Artisan Sourdough Loaves & Croissants',
    receiverId: 'community_pantry_north',
    receiverName: 'North Community Pantry',
    donorId: 'donor_bakery_bliss',
    requestedQuantity: 5,
    requestStatus: REQUEST_STATUS.APPROVED,
    notes: 'Volunteer van en route.',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 1800 * 1000).toISOString()
  }
];

seedRequests.forEach((r) => inMemoryRequests.set(r.requestId, { ...r }));

export const requestService = {
  /**
   * Retrieve all food requests with optional status & foreign key filters
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.foodId]
   * @param {string} [filters.receiverId]
   * @param {string} [filters.donorId]
   * @returns {Promise<Array>} List of requests
   */
  async getAllRequests(filters = {}) {
    if (isFirebaseConfigured && db.collection) {
      try {
        let query = db.collection(COLLECTION_NAME);
        if (filters.status) query = query.where('requestStatus', '==', filters.status.toUpperCase());
        if (filters.foodId) query = query.where('foodId', '==', filters.foodId);
        if (filters.receiverId) query = query.where('receiverId', '==', filters.receiverId);
        if (filters.donorId) query = query.where('donorId', '==', filters.donorId);

        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({ requestId: doc.id, ...doc.data() }));
      } catch (err) {
        console.warn('[RequestService] Firestore query error, falling back to in-memory store:', err.message);
      }
    }

    const results = Array.from(inMemoryRequests.values()).filter((r) => {
      if (filters.status && r.requestStatus.toUpperCase() !== filters.status.toUpperCase()) return false;
      if (filters.foodId && r.foodId !== filters.foodId) return false;
      if (filters.receiverId && r.receiverId !== filters.receiverId) return false;
      if (filters.donorId && r.donorId !== filters.donorId) return false;
      return true;
    });

    return results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  /**
   * Retrieve request by ID
   * @param {string} requestId
   * @returns {Promise<Object|null>}
   */
  async getRequestById(requestId) {
    if (isFirebaseConfigured && db.collection) {
      try {
        const docRef = db.collection(COLLECTION_NAME).doc(requestId);
        const doc = await docRef.get();
        if (doc.exists) {
          return { requestId: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[RequestService] Firestore fetch error, checking in-memory store:', err.message);
      }
    }

    return inMemoryRequests.get(requestId) || null;
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
   * Create / Submit a new food request
   * @param {Object} requestData
   * @param {Object} [userContext]
   * @returns {Promise<Object>} Created request document
   */
  async createRequest(requestData, userContext = null) {
    // 1. Verify target food donation exists
    const food = await donationService.getDonationById(requestData.foodId);
    if (!food) {
      throw ApiError.notFound(`Food listing with ID '${requestData.foodId}' was not found`);
    }

    // 2. Verify food status is eligible
    const nonRequestableStatuses = [
      FOOD_STATUS.EXPIRED,
      FOOD_STATUS.CANCELLED,
      FOOD_STATUS.COLLECTED,
      FOOD_STATUS.COMPLETED
    ];
    if (nonRequestableStatuses.includes(food.status)) {
      throw ApiError.badRequest(`This food donation is currently marked '${food.status}' and cannot be requested`);
    }

    // 3. Verify available portion quantity
    const availableQty = food.availableQuantity !== undefined
      ? food.availableQuantity
      : (typeof food.quantity === 'number' ? food.quantity : 1);

    if (availableQty <= 0 || food.status === FOOD_STATUS.CLAIMED) {
      throw ApiError.badRequest('This food donation has already been fully claimed');
    }

    if (requestData.requestedQuantity > availableQty) {
      throw ApiError.badRequest(
        `Requested quantity (${requestData.requestedQuantity}) exceeds available portions (${availableQty})`
      );
    }

    // 4. Prevent duplicate pending requests from the same receiver for this food
    const existingRequests = await this.getAllRequests({
      foodId: requestData.foodId,
      receiverId: requestData.receiverId,
      status: REQUEST_STATUS.PENDING
    });
    if (existingRequests.length > 0) {
      throw ApiError.conflict('You already have a pending request for this food listing');
    }

    const requestId = requestData.requestId || `req_${Date.now()}`;
    const newRequest = {
      requestId,
      foodId: requestData.foodId,
      foodName: food.foodName,
      receiverId: requestData.receiverId,
      receiverName: requestData.receiverName || userContext?.name || 'Community Recipient',
      donorId: food.donorId,
      requestedQuantity: Number(requestData.requestedQuantity),
      requestStatus: requestData.requestStatus || REQUEST_STATUS.PENDING,
      notes: requestData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 5. Update food status to REQUESTED if currently AVAILABLE
    if (food.status === FOOD_STATUS.AVAILABLE) {
      await donationService.updateDonationStatus(food.foodId, FOOD_STATUS.REQUESTED);
    }

    // 6. Save request to Firestore / in-memory store
    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(requestId).set(newRequest);
      } catch (err) {
        console.warn('[RequestService] Firestore create failed, saving in memory:', err.message);
      }
    }

    inMemoryRequests.set(requestId, { ...newRequest });
    return newRequest;
  },

  /**
   * Update request status (e.g. PENDING -> APPROVED / REJECTED -> COLLECTED)
   * Enforces complete donation workflow state machine:
   * - APPROVED: Deducts portions from food, transitions food status
   * - REJECTED: Checks remaining requests, may revert food status to AVAILABLE
   * - COLLECTED: Marks both request and food as COLLECTED
   *
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
        `Invalid status '${newStatus}'. Must be one of: ${Object.values(REQUEST_STATUS).join(', ')}`
      );
    }

    const currentStatus = existing.requestStatus;
    if (currentStatus === normalizedStatus) {
      return existing; // idempotent no-op
    }

    const updated = {
      ...existing,
      requestStatus: normalizedStatus,
      updatedAt: new Date().toISOString()
    };

    // Workflow transition rules
    if (normalizedStatus === REQUEST_STATUS.APPROVED) {
      if (currentStatus !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(`Cannot approve request in '${currentStatus}' status. Must be PENDING.`);
      }

      // Deduct portion quantity from food donation
      await donationService.deductQuantity(existing.foodId, existing.requestedQuantity);
      updated.approvedAt = new Date().toISOString();
    } else if (normalizedStatus === REQUEST_STATUS.REJECTED) {
      if (currentStatus !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(`Cannot reject request in '${currentStatus}' status. Must be PENDING.`);
      }

      updated.rejectedAt = new Date().toISOString();
      if (metadata.rejectionReason) {
        updated.rejectionReason = metadata.rejectionReason;
      }

      // Check if food listing should revert to AVAILABLE
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
    } else if (normalizedStatus === REQUEST_STATUS.COLLECTED) {
      // Transitioning to COLLECTED
      if (currentStatus !== REQUEST_STATUS.APPROVED) {
        throw ApiError.badRequest(`Cannot mark request COLLECTED unless it has been APPROVED first.`);
      }

      updated.collectedAt = new Date().toISOString();
      // Update food status to COLLECTED
      await donationService.updateDonationStatus(existing.foodId, FOOD_STATUS.COLLECTED);
    } else if (normalizedStatus === REQUEST_STATUS.CANCELLED) {
      // If was previously approved, restore portions
      if (currentStatus === REQUEST_STATUS.APPROVED) {
        await donationService.restoreQuantity(existing.foodId, existing.requestedQuantity);
      }
      updated.cancelledAt = new Date().toISOString();
    }

    if (isFirebaseConfigured && db.collection) {
      try {
        await db.collection(COLLECTION_NAME).doc(requestId).update(updated);
      } catch (err) {
        console.warn('[RequestService] Firestore update status error:', err.message);
      }
    }

    inMemoryRequests.set(requestId, updated);
    return updated;
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
  },

  /**
   * Reset in-memory store (useful for clean test environments)
   */
  _resetStore() {
    inMemoryRequests.clear();
    seedRequests.forEach((r) => inMemoryRequests.set(r.requestId, { ...r }));
  }
};

export default requestService;
