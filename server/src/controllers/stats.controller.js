import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { statsService } from '../services/stats.service.js';

/**
 * ==============================================================================
 * STATISTICS & ANALYTICS CONTROLLER (INTEGRATION PLACEHOLDERS)
 * ==============================================================================
 * Responsible Teammate: Teammate 3 (Food Donation, Requests & Admin Functionality)
 */

export const getOverviewStats = asyncHandler(async (req, res) => {
  const overview = await statsService.getOverviewStats();
  return ApiResponse.success(res, overview, 'Platform overview statistics retrieved');
});

export const getImpactMetrics = asyncHandler(async (req, res) => {
  const impact = await statsService.getImpactMetrics();
  return ApiResponse.success(res, impact, 'Environmental impact metrics retrieved');
});

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await statsService.getCategoryBreakdown();
  return ApiResponse.success(res, breakdown, 'Food category distribution retrieved');
});

export const statsController = {
  getOverviewStats,
  getImpactMetrics,
  getCategoryBreakdown
};

export default statsController;
