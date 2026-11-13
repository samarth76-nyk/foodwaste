/**
 * ==============================================================================
 * SHAREBITE - AUTHENTICATION & USER PROFILE SERVICE
 * ==============================================================================
 * Responsible Teammate: Samarth (Member 2 – Backend & Database)
 *
 * Implements:
 * 1. User registration with persistent storage in Firestore 'users' collection
 * 2. User profile retrieval and role verification
 * 3. Token verification via Firebase Auth / Local Auth adapter
 * ==============================================================================
 */

import { db, auth, isFirebaseConfigured } from '../config/firebase.js';
import { USER_ROLE } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const authService = {
  /**
   * Register a new user in Firebase Auth and persist profile in Firestore 'users' collection
   * @param {Object} userData
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} [userData.role]
   * @param {string} [userData.phone]
   * @param {string} [userData.address]
   * @returns {Promise<Object>} Created user profile
   */
  async registerUser(userData) {
    if (!userData.email || !userData.name) {
      throw ApiError.badRequest('Name and email are required for registration');
    }

    // Check if user with this email already exists
    const existingSnap = await db.collection('users').where('email', '==', userData.email.trim().toLowerCase()).get();
    if (!existingSnap.empty) {
      throw ApiError.conflict(`User with email '${userData.email}' already exists`);
    }

    const userId = userData.userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const role = Object.values(USER_ROLE).includes(userData.role) ? userData.role : USER_ROLE.RECEIVER;

    const userProfile = {
      userId,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      role,
      phone: userData.phone || '',
      address: userData.address || '',
      isVerified: Boolean(userData.isVerified),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in Firestore 'users' collection
    await db.collection('users').doc(userId).set(userProfile);

    // If real Firebase Auth is configured, also register user record
    if (isFirebaseConfigured && auth.createUser) {
      try {
        await auth.createUser({
          uid: userId,
          email: userProfile.email,
          displayName: userProfile.name
        });
        if (auth.setCustomUserClaims) {
          await auth.setCustomUserClaims(userId, { role });
        }
      } catch (err) {
        console.warn('[Firebase Auth] Failed to create auth record in cloud:', err.message);
      }
    }

    return userProfile;
  },

  /**
   * Fetch user profile from Firestore by userId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId) {
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      throw ApiError.notFound(`User profile with ID '${userId}' not found`);
    }

    return doc.data();
  },

  /**
   * Verify an authentication token
   * @param {string} token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyAuthToken(token) {
    if (!token) {
      throw ApiError.badRequest('Token is required');
    }

    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || USER_ROLE.DONOR,
      verified: true
    };
  },

  /**
   * Retrieve all registered users
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map((d) => d.data());
  }
};

export default authService;
