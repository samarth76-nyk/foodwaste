import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { registerUserSchema, loginUserSchema } from '../validators/user.validator.js';

const router = Router();

/**
 * ==============================================================================
 * AUTHENTICATION ROUTES
 * ==============================================================================
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user profile
 * @access  Public
 */
router.post('/register', validate(registerUserSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Log in user / exchange credentials for session token
 * @access  Public
 */
router.post('/login', validate(loginUserSchema), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (Requires Bearer token)
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify Firebase ID token validity
 * @access  Public
 */
router.post('/verify-token', authController.verifyToken);

export default router;
