import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { authService } from '../services/auth.service.js';

/**
 * ==============================================================================
 * AUTHENTICATION CONTROLLER (INTEGRATION PLACEHOLDERS)
 * ==============================================================================
 * Responsible Teammate: Teammate 2 (Firebase & Database)
 */

export const register = asyncHandler(async (req, res) => {
  // Teammate 2 Integration Point: register user via authService
  const newUser = await authService.registerUser(req.body);
  return ApiResponse.created(res, newUser, 'User registered successfully. Integration placeholder active.');
});

export const login = asyncHandler(async (req, res) => {
  // Teammate 2 Integration Point: client sends Firebase ID token or credentials
  const { email } = req.body;
  const mockAuthResponse = {
    token: `sb_mock_token_${Date.now()}`,
    user: {
      userId: `usr_${Date.now()}`,
      email,
      name: 'Sample User',
      role: 'DONOR'
    }
  };
  return ApiResponse.success(res, mockAuthResponse, 'Login successful. Integration placeholder active.');
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  // Returns currently authenticated user attached by auth.middleware.js
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
