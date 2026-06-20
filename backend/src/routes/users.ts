import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getVolunteers,
  getNGOs,
  updateUserStatus,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/volunteers', getVolunteers);
router.get('/ngos', getNGOs);

// Admin only
router.get('/', authorize('admin'), getAllUsers);
router.patch('/:id/status', authorize('admin'), updateUserStatus);

export default router;
