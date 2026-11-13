/**
 * ==============================================================================
 * SHAREBITE - AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ==============================================================================
 * RESPONSIBLE TEAMMATE: Teammate 2 (Firebase and Database)
 * 
 * INSTRUCTIONS FOR TEAMMATE 2:
 * 1. Read Bearer token from req.headers.authorization
 * 2. Verify token via Firebase Admin Auth:
 *      const decodedToken = await auth.verifyIdToken(token);
 * 3. Fetch user record or claims to attach user details:
 *      req.user = {
 *        userId: decodedToken.uid,
 *        email: decodedToken.email,
 *        role: decodedToken.role || 'RECEIVER'
 *      };
 * 4. In case of invalid/expired token, forward ApiError.unauthorized(...)
 * ==============================================================================
 */

import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/environment.js';
import { auth, isFirebaseConfigured } from '../config/firebase.js';

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
          userId: 'dev-user-001',
          name: 'Developer Mode User',
          email: 'dev@sharebite.local',
          role: 'ADMIN' // Default to admin in dev mode for easy testing
        };
        return next();
      }
      return next(ApiError.unauthorized('Missing or malformed Authorization header. Expected Bearer token.'));
    }

    const token = authHeader.split(' ')[1];

    // Teammate 2 Integration Point:
    if (isFirebaseConfigured) {
      const decoded = await auth.verifyIdToken(token);
      req.user = {
        userId: decoded.uid,
        email: decoded.email,
        role: decoded.role || 'RECEIVER'
      };
      return next();
    }

    // Mock fallback when token is present but Firebase credentials are not yet configured
    req.user = {
      userId: 'mock-user-123',
      name: 'Authenticated Volunteer',
      email: 'volunteer@sharebite.local',
      role: 'VOLUNTEER'
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
