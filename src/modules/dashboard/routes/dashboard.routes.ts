import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.use(protect);

router.get('/', DashboardController.getDashboard);

export default router;
