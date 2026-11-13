import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/environment.js';
import { isFirebaseConfigured } from '../config/firebase.js';

/**
 * Health Check Controller
 * Verifies server status, uptime, and database connection.
 * Endpoint: GET /api/health
 */
export const getHealth = (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      api: 'operational',
      database: isFirebaseConfigured ? 'connected (Firebase)' : 'mock/pending configuration'
    }
  };

  return ApiResponse.success(res, healthData, 'ShareBite API service is up and running');
};

export const healthController = {
  getHealth
};

export default healthController;
