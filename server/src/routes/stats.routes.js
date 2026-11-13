import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

const router = Router();

/**
 * ==============================================================================
 * IMPACT STATISTICS & ANALYTICS ROUTES
 * ==============================================================================
 */

/**
 * @route   GET /api/stats/overview
 * @desc    High-level platform metrics (total donations, meals saved, active requests)
 * @access  Public
 */
router.get('/overview', statsController.getOverviewStats);

/**
 * @route   GET /api/stats/impact
 * @desc    Comprehensive environmental impact metrics (CO2, water, landfill methane)
 * @access  Public
 */
router.get('/impact', statsController.getImpactMetrics);

/**
 * @route   GET /api/stats/categories
 * @desc    Category-wise food distribution stats
 * @access  Public
 */
router.get('/categories', statsController.getCategoryBreakdown);

/**
 * @route   GET /api/stats/leaderboard
 * @desc    Top food donors and recipient shelters impact ranking
 * @access  Public
 */
router.get('/leaderboard', statsController.getLeaderboard);

/**
 * @route   POST /api/stats/calculate
 * @desc    Interactive impact calculator for custom meal / food quantities
 * @access  Public
 */
router.post('/calculate', statsController.calculateCustomImpact);

export default router;
