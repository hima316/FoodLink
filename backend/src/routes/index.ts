import { Router } from 'express';
import authRoutes from './auth';
import donationRoutes from './donations';
import userRoutes from './users';
import analyticsRoutes from './analytics';
import notificationRoutes from './notifications';

const router = Router();

// Mount all route modules with their base paths
router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

// API health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: '🌱 FoodLink API is healthy and running!',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
  });
});

export default router;
