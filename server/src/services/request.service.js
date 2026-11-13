/**
 * ==============================================================================
 * SHAREBITE - FOOD REQUEST SERVICE STUB
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 3 (Food Donation, Requests & Admin Functionality)
 * 
 * INSTRUCTIONS FOR TEAMMATE 3:
 * 1. Implement Firestore queries using the `db` client exported from config/firebase.js.
 * 2. Collection name: 'food_requests'
 * 3. Enforce request business rules:
 *    - Receiver cannot request more than available food quantity.
 *    - Prevent duplicate active requests for the same food by the same receiver.
 *    - When request status is updated to 'APPROVED', adjust available quantity on donation.
 *    - When status transitions to 'COLLECTED', mark request lifecycle complete.
 * ==============================================================================
 */

import { REQUEST_STATUS } from '../config/constants.js';

// Sample mock requests conforming strictly to the Food Request Data Contract
const mockRequests = [
  {
    requestId: 'req_001',
    foodId: 'food_001',
    receiverId: 'shelter_hope_haven',
    requestedQuantity: 10,
    requestStatus: REQUEST_STATUS.PENDING,
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString()
  },
  {
    requestId: 'req_002',
    foodId: 'food_002',
    receiverId: 'community_pantry_north',
    requestedQuantity: 5,
    requestStatus: REQUEST_STATUS.APPROVED,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

export const requestService = {
  /**
   * Retrieve all food requests with optional status filtering
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.foodId]
   * @param {string} [filters.receiverId]
   * @returns {Promise<Array>} List of requests
   */
  async getAllRequests(filters = {}) {
    // TODO: Teammate 3 - Firestore query on 'food_requests'
    return mockRequests.filter((r) => {
      if (filters.status && r.requestStatus !== filters.status) return false;
      if (filters.foodId && r.foodId !== filters.foodId) return false;
      if (filters.receiverId && r.receiverId !== filters.receiverId) return false;
      return true;
    });
  },

  /**
   * Retrieve request by ID
   * @param {string} requestId
   * @returns {Promise<Object|null>}
   */
  async getRequestById(requestId) {
    // TODO: Teammate 3 - Query db.collection('food_requests').doc(requestId).get()
    const found = mockRequests.find((r) => r.requestId === requestId);
    return found || null;
  },

  /**
   * Create a new food request
   * @param {Object} requestData
   * @returns {Promise<Object>} Created request document
   */
  async createRequest(requestData) {
    // TODO: Teammate 3 - Validate food availability and save to Firestore
    const newRequest = {
      requestId: `req_${Date.now()}`,
      foodId: requestData.foodId,
      receiverId: requestData.receiverId,
      requestedQuantity: requestData.requestedQuantity,
      requestStatus: requestData.requestStatus || REQUEST_STATUS.PENDING,
      createdAt: new Date().toISOString()
    };
    return newRequest;
  },

  /**
   * Update request status (PENDING -> APPROVED / REJECTED -> COLLECTED)
   * @param {string} requestId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateRequestStatus(requestId, status) {
    // TODO: Teammate 3 - Atomic Firestore transaction updating request and donation quantity
    return {
      requestId,
      requestStatus: status,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Get all requests made by a specific receiver
   * @param {string} receiverId
   * @returns {Promise<Array>}
   */
  async getRequestsByReceiver(receiverId) {
    // TODO: Teammate 3 - Query db.collection('food_requests').where('receiverId', '==', receiverId)
    return mockRequests.filter((r) => r.receiverId === receiverId);
  }
};

export default requestService;
