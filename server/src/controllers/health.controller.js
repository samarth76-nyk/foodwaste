import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/environment.js';
import { isFirebaseConfigured, getDbStatus } from '../config/firebase.js';

/**
 * Health Check Controller
 * Verifies server status, uptime, and database storage status.
 * Endpoint: GET /api/health
 */
export const getHealth = (req, res) => {
  const dbStatus = getDbStatus ? getDbStatus() : { status: 'operational' };

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      api: 'operational',
      database: isFirebaseConfigured ? 'connected (Google Cloud Firebase Firestore)' : 'operational (Local Persistent Firestore Storage)'
    },
    databaseStatus: dbStatus
  };

  return ApiResponse.success(res, healthData, 'ShareBite API and Database service are operational');
};

export const healthController = {
  getHealth
};

export default healthController;
