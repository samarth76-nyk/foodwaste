import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { adminService } from '../services/admin.service.js';

/**
 * ==============================================================================
 * ADMIN DASHBOARD CONTROLLER (INTEGRATION PLACEHOLDERS)
 * ==============================================================================
 * Responsible Teammate: Teammate 3 (Food Donation, Requests & Admin Functionality)
 */

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers(req.query);
  return ApiResponse.success(res, users, 'Admin user list retrieved', 200, {
    count: users.length
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const updated = await adminService.updateUserRole(userId, role);
  return ApiResponse.success(res, updated, `Role updated for user ${userId}`);
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await adminService.getAuditLogs();
  return ApiResponse.success(res, logs, 'System audit logs retrieved', 200, {
    count: logs.length
  });
});

export const getSystemReports = asyncHandler(async (req, res) => {
  const reports = {
    generatedAt: new Date().toISOString(),
    systemHealth: 'OPERATIONAL',
    activeIncidents: 0,
    storageUsage: '12%',
    complianceStatus: 'VERIFIED'
  };
  return ApiResponse.success(res, reports, 'System administrative report generated');
});

export const adminController = {
  getAllUsers,
  updateUserRole,
  getAuditLogs,
  getSystemReports
};

export default adminController;
