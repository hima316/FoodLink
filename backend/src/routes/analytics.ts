import { Router } from 'express';
import {
  getAnalyticsOverview,
  getMonthlyStats,
  getMyStats,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/overview', getAnalyticsOverview);
router.get('/monthly', getMonthlyStats);
router.get('/my-stats', getMyStats);

export default router;
