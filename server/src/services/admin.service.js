/**
 * ==============================================================================
 * SHAREBITE - ADMIN SERVICE STUB
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 3 (Food Donation, Requests & Admin Functionality)
 * 
 * INSTRUCTIONS FOR TEAMMATE 3:
 * 1. Admin operations require USER_ROLE.ADMIN authorization.
 * 2. Implement administrative user management and moderation logs.
 * 3. Audit trail collection name: 'audit_logs'
 * ==============================================================================
 */

import { USER_ROLE } from '../config/constants.js';

export const adminService = {
  /**
   * List all registered users across the platform
   * @param {Object} queryParams
   * @returns {Promise<Array>}
   */
  async getAllUsers(queryParams = {}) {
    // TODO: Teammate 3 - Query Firestore 'users' collection
    return [
      {
        userId: 'usr_001',
        name: 'Metro City Food Bank',
        email: 'contact@metrofoodbank.org',
        role: USER_ROLE.DONOR,
        createdAt: '2026-11-01T08:00:00Z'
      },
      {
        userId: 'usr_002',
        name: 'Hope Community Shelter',
        email: 'info@hopeshelter.org',
        role: USER_ROLE.RECEIVER,
        createdAt: '2026-11-02T10:30:00Z'
      },
      {
        userId: 'usr_admin',
        name: 'System Administrator',
        email: 'admin@sharebite.org',
        role: USER_ROLE.ADMIN,
        createdAt: '2026-10-15T00:00:00Z'
      }
    ];
  },

  /**
   * Update a user's role (e.g. promote to VOLUNTEER or ADMIN)
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<Object>}
   */
  async updateUserRole(userId, role) {
    // TODO: Teammate 3 - Call db.collection('users').doc(userId).update({ role })
    return {
      userId,
      role,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Fetch system audit logs
   * @returns {Promise<Array>}
   */
  async getAuditLogs() {
    // TODO: Teammate 3 - Query db.collection('audit_logs').orderBy('timestamp', 'desc').limit(50)
    return [
      {
        logId: 'log_01',
        action: 'DONATION_CREATED',
        performedBy: 'usr_001',
        targetId: 'food_001',
        timestamp: new Date().toISOString()
      },
      {
        logId: 'log_02',
        action: 'REQUEST_APPROVED',
        performedBy: 'usr_001',
        targetId: 'req_002',
        timestamp: new Date().toISOString()
      }
    ];
  }
};

export default adminService;
