import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateUserRoleSchema } from '../validators/user.validator.js';
import { USER_ROLE } from '../config/constants.js';

const router = Router();

/**
 * ==============================================================================
 * ADMIN DASHBOARD ROUTES
 * All endpoints require ADMIN role authorization
 * ==============================================================================
 */

// Apply auth + role check to all admin routes
router.use(authenticate, requireRole(USER_ROLE.ADMIN));

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users with their roles
 * @access  Admin Only
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   PATCH /api/admin/users/:userId/role
 * @desc    Change user role (e.g. promote to VOLUNTEER or ADMIN)
 * @access  Admin Only
 */
router.patch('/users/:userId/role', validate(updateUserRoleSchema), adminController.updateUserRole);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    View platform audit log trail
 * @access  Admin Only
 */
router.get('/audit-logs', adminController.getAuditLogs);

/**
 * @route   GET /api/admin/reports
 * @desc    Get platform administrative health & compliance reports
 * @access  Admin Only
 */
router.get('/reports', adminController.getSystemReports);

export default router;
