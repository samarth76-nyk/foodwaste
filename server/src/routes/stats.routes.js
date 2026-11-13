import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

const router = Router();

/**
 * ==============================================================================
 * STATISTICS & ANALYTICS ROUTES (TEAMMATE 3 INTEGRATION POINT)
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
 * @desc    Environmental impact metrics (CO2 avoided, food waste diverted)
 * @access  Public
 */
router.get('/impact', statsController.getImpactMetrics);

/**
 * @route   GET /api/stats/categories
 * @desc    Category-wise food distribution stats
 * @access  Public
 */
router.get('/categories', statsController.getCategoryBreakdown);

export default router;
