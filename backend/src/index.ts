import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize = require('express-mongo-sanitize');
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import connectDB from './config/database';
import logger from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ==========================================
// Create Express App
// ==========================================
const app = express();

// ==========================================
// Security Middleware
// ==========================================
// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,  // 15 minutes
  max: config.rateLimit.maxRequests,    // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 auth attempts
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ==========================================
// Body Parsing Middleware
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// Data Sanitization
// ==========================================
// Prevent MongoDB injection attacks
app.use(mongoSanitize());

// ==========================================
// Performance Middleware
// ==========================================
app.use(compression());

// ==========================================
// Logging Middleware
// ==========================================
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  // Production logging
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// ==========================================
// API Routes
// ==========================================
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🌱 Welcome to FoodLink API',
    version: config.apiVersion,
    docs: `/api/${config.apiVersion}/health`,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Error Handling (must be after routes)
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log('\n');
      console.log('╔═══════════════════════════════════════╗');
      console.log('║       🌱 FoodLink API Server          ║');
      console.log('╠═══════════════════════════════════════╣');
      console.log(`║  Environment: ${config.nodeEnv.padEnd(24)}║`);
      console.log(`║  Port: ${String(config.port).padEnd(31)}║`);
      console.log(`║  API: /api/${config.apiVersion.padEnd(28)}║`);
      console.log('╚═══════════════════════════════════════╝');
      console.log('\n');
    });

    // ==========================================
    // Graceful Shutdown
    // ==========================================
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Gracefully shutting down...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        const { disconnectDB } = await import('./config/database');
        await disconnectDB();

        logger.info('Server shutdown complete');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
