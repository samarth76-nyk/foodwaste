import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment.js';
import { corsMiddleware } from './config/cors.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Express Application Configuration
 */
const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(corsMiddleware);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Direct Root Health Check alias for convenience
app.get('/health', (req, res) => res.redirect(`${env.API_PREFIX}/health`));

// Mount Central API Routes under /api
app.use(env.API_PREFIX, apiRouter);

// 404 Catch-All Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
