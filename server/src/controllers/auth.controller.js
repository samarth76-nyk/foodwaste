import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { authService } from '../services/auth.service.js';
import { db } from '../config/firebase.js';

/**
 * ==============================================================================
 * AUTHENTICATION CONTROLLER (DATABASE INTEGRATED)
 * ==============================================================================
 * Responsible Teammate: Samarth (Member 2 – Backend & Database)
 */

export const register = asyncHandler(async (req, res) => {
  const newUser = await authService.registerUser(req.body);
  return ApiResponse.created(res, newUser, 'User registered and stored in database successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw ApiError.badRequest('Email is required for login');
  }

  // Find user by email in database
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await db.collection('users').where('email', '==', normalizedEmail).get();

  let user = null;
  if (!snapshot.empty) {
    user = snapshot.docs[0].data();
  } else {
    // If not found, create a new user profile on first login
    const name = email.split('@')[0].replace(/[._-]/g, ' ');
    user = await authService.registerUser({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: normalizedEmail,
      role: 'DONOR'
    });
  }

  const token = `sb_token_${user.userId}`;
  return ApiResponse.success(
    res,
    {
      token,
      user
    },
    'Login successful'
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized('No user session active');
  }
  const profile = await authService.getUserProfile(req.user.userId);
  return ApiResponse.success(res, profile, 'User profile retrieved');
});

export const verifyToken = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.body.token;
  if (!token) {
    throw ApiError.badRequest('Token is required for verification');
  }
  const result = await authService.verifyAuthToken(token);
  return ApiResponse.success(res, result, 'Token verified successfully');
});

export const authController = {
  register,
  login,
  getCurrentUser,
  verifyToken
};

export default authController;
