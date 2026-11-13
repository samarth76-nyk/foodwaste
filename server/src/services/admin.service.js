/**
 * ==============================================================================
 * SHAREBITE - ADMIN SERVICE (DATABASE INTEGRATED)
 * ==============================================================================
 * Handles user management and audit trails in Firestore.
 * ==============================================================================
 */

import { db } from '../config/firebase.js';
import { USER_ROLE } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const adminService = {
  /**
   * List all registered users from Firestore 'users' collection
   * @param {Object} queryParams
   * @returns {Promise<Array>}
   */
  async getAllUsers(queryParams = {}) {
    const snapshot = await db.collection('users').get();
    let users = snapshot.docs.map((d) => d.data());

    if (queryParams.role) {
      users = users.filter((u) => u.role.toUpperCase() === queryParams.role.toUpperCase());
    }

    return users;
  },

  /**
   * Update a user's role in the database
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<Object>}
   */
  async updateUserRole(userId, role) {
    if (!Object.values(USER_ROLE).includes(role)) {
      throw ApiError.badRequest(`Invalid role '${role}'. Must be one of: ${Object.values(USER_ROLE).join(', ')}`);
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw ApiError.notFound(`User with ID '${userId}' not found`);
    }

    const updatedAt = new Date().toISOString();
    await db.collection('users').doc(userId).update({
      role,
      updatedAt
    });

    return {
      ...userDoc.data(),
      role,
      updatedAt
    };
  },

  /**
   * Fetch system audit logs from Firestore 'audit_logs' collection
   * @returns {Promise<Array>}
   */
  async getAuditLogs() {
    const snapshot = await db.collection('audit_logs').get();
    const logs = snapshot.docs.map((d) => d.data());

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return logs.slice(0, 50);
  }
};

export default adminService;
