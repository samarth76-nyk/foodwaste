import axios from 'axios';

/**
 * ShareBite Centralized API Client
 * Configured with baseURL, request token injection, and response formatting.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach Auth Token if present
apiClient.interceptors.request.use(
  (config) => {
    // Teammate 1 & 2: Store your token in localStorage as 'sharebite_token'
    const token = localStorage.getItem('sharebite_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap standardized ApiResponse or format error
apiClient.interceptors.response.use(
  (response) => {
    // Return the response data body directly (ApiResponse instance)
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data || {
      success: false,
      statusCode: error.response?.status || 500,
      message: error.message || 'Network error occurred',
      timestamp: new Date().toISOString()
    };
    return Promise.reject(errorResponse);
  }
);

export default apiClient;
