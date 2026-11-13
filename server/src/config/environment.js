import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to current working directory or server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Central Environment Configuration
 * Validates and exposes typed configuration options with safe fallbacks.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api',
  CLIENT_ORIGINS: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  
  // Firebase configuration parameters
  FIREBASE: {
    SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '',
    DATABASE_URL: process.env.FIREBASE_DATABASE_URL || ''
  },

  // Toggle for testing endpoints before Firebase credentials are configured
  MOCK_AUTH_ENABLED: process.env.MOCK_AUTH_ENABLED !== 'false'
};

export default env;
