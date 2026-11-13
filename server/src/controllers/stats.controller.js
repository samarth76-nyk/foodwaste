import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { statsService } from '../services/stats.service.js';

/**
 * ==============================================================================
 * IMPACT STATISTICS & ANALYTICS CONTROLLER
 * ==============================================================================
 * Member 4 - Smart Features & Integration
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

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await statsService.getLeaderboard();
  return ApiResponse.success(res, leaderboard, 'Community impact leaderboard retrieved');
});

export const calculateCustomImpact = asyncHandler(async (req, res) => {
  const { mealsSaved, kgFood } = req.body;
  const targetMeals = mealsSaved || (kgFood ? Math.round(kgFood / 0.42) : 100);
  const calculation = await statsService.getImpactMetrics({ mealsSaved: targetMeals });
  return ApiResponse.success(res, calculation, 'Custom impact projection calculated');
});

export const statsController = {
  getOverviewStats,
  getImpactMetrics,
  getCategoryBreakdown,
  getLeaderboard,
  calculateCustomImpact
};

export default statsController;
