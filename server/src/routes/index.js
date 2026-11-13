import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import donationRoutes from './donation.routes.js';
import requestRoutes from './request.routes.js';
import adminRoutes from './admin.routes.js';
import statsRoutes from './stats.routes.js';

const apiRouter = Router();

/**
 * ==============================================================================
 * CENTRAL API ROUTE REGISTRATION
 * All endpoints prefixed by /api (or env.API_PREFIX)
 * ==============================================================================
 */

// Core Health Check
apiRouter.use('/health', healthRoutes);

// Teammate 2 Integration
apiRouter.use('/auth', authRoutes);

// Teammate 3 Integrations
apiRouter.use('/donations', donationRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/stats', statsRoutes);

export default apiRouter;
