import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { NotificationController } from '../controllers/notification.controller';
import { notificationIdParamSchema, notificationListQuerySchema } from '../schemas/notification.schema';

const router = Router();

router.use(protect);

router.get('/', validate(notificationListQuerySchema), NotificationController.list);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', validate(notificationIdParamSchema), NotificationController.markRead);

export default router;
