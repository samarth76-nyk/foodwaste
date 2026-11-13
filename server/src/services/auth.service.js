/**
 * ==============================================================================
 * SHAREBITE - AUTHENTICATION SERVICE STUB
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 2 (Firebase & Database)
 * 
 * INSTRUCTIONS FOR TEAMMATE 2:
 * 1. Implement Firebase Auth token verification and user record creation.
 * 2. Store additional user profile data in Firestore `users` collection:
 *      await db.collection('users').doc(userId).set({ userId, name, email, role, createdAt });
 * 3. Add custom claims for RBAC (Role-Based Access Control) if needed:
 *      await auth.setCustomUserClaims(userId, { role });
 * ==============================================================================
 */

import { USER_ROLE } from '../config/constants.js';

export const authService = {
  /**
   * Register a new user in Firebase Auth and create profile in Firestore
   * @param {Object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.role
   * @returns {Promise<Object>} Created user profile
   */
  async registerUser(userData) {
    // TODO: Teammate 2 - Replace mock implementation with Firebase Admin Auth & Firestore call
    const userId = userData.userId || `usr_${Date.now()}`;
    return {
      userId,
      name: userData.name,
      email: userData.email,
      role: userData.role || USER_ROLE.RECEIVER,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Fetch user profile from Firestore by userId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId) {
    // TODO: Teammate 2 - Query Firestore collection('users').doc(userId).get()
    return {
      userId,
      name: 'Demo ShareBite User',
      email: 'demo@sharebite.org',
      role: USER_ROLE.DONOR,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Verify an authentication token
   * @param {string} token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyAuthToken(token) {
    // TODO: Teammate 2 - Call auth.verifyIdToken(token)
    return {
      uid: 'user_mock_token_uid',
      email: 'verified@sharebite.org',
      role: USER_ROLE.DONOR,
      verified: true
    };
  }
};

export default authService;
