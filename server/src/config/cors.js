import cors from 'cors';
import { env } from './environment.js';

/**
 * Configures CORS based on environment origins
 */
const allowedOrigins = env.CLIENT_ORIGINS;

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or curl/Postman requests without origin in development
    if (!origin || allowedOrigins.includes(origin) || env.isDevelopment) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

export const corsMiddleware = cors(corsOptions);
export default corsMiddleware;
