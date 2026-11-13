import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import donationRoutes from './donation.routes.js';
import requestRoutes from './request.routes.js';
import adminRoutes from './admin.routes.js';
import statsRoutes from './stats.routes.js';
import matchingRoutes from './matching.routes.js';

const apiRouter = Router();

/**
 * ==============================================================================
 * CENTRAL API ROUTE REGISTRATION
 * All endpoints prefixed by /api (or env.API_PREFIX)
 * ==============================================================================
 */

// Core Health Check
apiRouter.use('/health', healthRoutes);

// Authentication
apiRouter.use('/auth', authRoutes);

// Core Modules
apiRouter.use('/donations', donationRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/admin', adminRoutes);

// Proximity & Impact Analytics
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/matching', matchingRoutes);

export default apiRouter;
