/**
 * ShareBite Centralized API Endpoints
 * All client services should import endpoints from here to ensure single source of truth.
 */

export const API_ENDPOINTS = {
  HEALTH: '/health',

  // Authentication (Teammate 2)
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    VERIFY_TOKEN: '/auth/verify-token'
  },

  // Food Donations (Teammate 3 + Member 4 Deadline Warnings)
  DONATIONS: {
    LIST: '/donations',
    GET_BY_ID: (foodId) => `/donations/${foodId}`,
    EXPIRING_SOON: (hours = 5) => `/donations/warnings/expiring-soon?hours=${hours}`,
    CREATE: '/donations',
    UPDATE: (foodId) => `/donations/${foodId}`,
    UPDATE_STATUS: (foodId) => `/donations/${foodId}/status`,
    DELETE: (foodId) => `/donations/${foodId}`
  },

  // Food Requests (Teammate 3)
  REQUESTS: {
    LIST: '/requests',
    GET_BY_ID: (requestId) => `/requests/${requestId}`,
    CREATE: '/requests',
    UPDATE_STATUS: (requestId) => `/requests/${requestId}/status`,
    ACCEPT: (requestId) => `/requests/${requestId}/accept`,
    REJECT: (requestId) => `/requests/${requestId}/reject`,
    BY_USER: (receiverId) => `/requests/user/${receiverId}`
  },

  // Smart NGO Matching (Member 4)
  MATCHING: {
    NEARBY_NGOS: (foodId, radius = 20) => `/matching/donations/${foodId}/ngos?radius=${radius}`,
    NEARBY_DONATIONS: (lat, lng, radius = 15) => `/matching/nearby-donations?lat=${lat}&lng=${lng}&radius=${radius}`,
    ALL_NGOS: '/matching/ngos'
  },

  // Admin Dashboard (Teammate 3)
  ADMIN: {
    USERS: '/admin/users',
    UPDATE_ROLE: (userId) => `/admin/users/${userId}/role`,
    AUDIT_LOGS: '/admin/audit-logs',
    REPORTS: '/admin/reports'
  },

  // Statistics & Impact Analytics (Member 4)
  STATS: {
    OVERVIEW: '/stats/overview',
    IMPACT: '/stats/impact',
    CATEGORIES: '/stats/categories',
    LEADERBOARD: '/stats/leaderboard',
    CALCULATE: '/stats/calculate'
  }
};

export default API_ENDPOINTS;
