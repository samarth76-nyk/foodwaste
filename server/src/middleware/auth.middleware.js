/**
 * ==============================================================================
 * SHAREBITE - AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ==============================================================================
 * Responsible Teammate: Samarth (Member 2 – Backend & Database)
 *
 * Implements:
 * 1. Bearer token extraction and validation
 * 2. Firebase Admin ID Token verification or Local Auth Token resolution
 * 3. User profile lookup and hydration onto req.user
 * 4. Role-based Access Control (RBAC) middleware
 * ==============================================================================
 */

import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/environment.js';
import { auth, db } from '../config/firebase.js';

/**
 * Verifies Bearer Token from HTTP Authorization Header
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development mode with mock auth enabled, attach default mock user
      if (env.MOCK_AUTH_ENABLED) {
        req.user = {
          userId: 'usr_admin',
          name: 'Samarth (System Admin)',
          email: 'samarth@sharebite.org',
          role: 'ADMIN'
        };
        return next();
      }
      return next(ApiError.unauthorized('Missing or malformed Authorization header. Expected Bearer token.'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(ApiError.unauthorized('Missing token in authorization header'));
    }

    // Verify token using Firebase Auth or Local Auth Engine
    const decoded = await auth.verifyIdToken(token);

    // Look up latest user profile in Firestore
    let userProfile = null;
    try {
      const userDoc = await db.collection('users').doc(decoded.uid || decoded.userId).get();
      if (userDoc.exists) {
        userProfile = userDoc.data();
      }
    } catch (e) {
      // Ignore if user profile lookup fails, fall back to decoded token
    }

    req.user = {
      userId: decoded.uid || decoded.userId || 'usr_admin',
      email: decoded.email || userProfile?.email || 'user@sharebite.org',
      role: userProfile?.role || decoded.role || 'DONOR',
      name: userProfile?.name || decoded.name || 'ShareBite Member'
    };

    next();
  } catch (error) {
    next(ApiError.unauthorized(`Authentication failed: ${error.message}`));
  }
};

/**
 * Restricts access to specific user roles
 * Example: router.get('/admin', authenticate, requireRole('ADMIN'), handler)
 * 
 * @param  {...string} roles Allowed roles ('ADMIN', 'DONOR', 'RECEIVER', 'VOLUNTEER')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User identity not verified'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.role}' is not authorized. Required: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

export default {
  authenticate,
  requireRole
};
