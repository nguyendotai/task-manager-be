import { Router } from 'express';
import authRoutes from '@/modules/auth/routes/auth.routes';
import userRoutes from '@/modules/users/routes/user.routes';
import workspaceRoutes from '@/modules/workspaces/routes/workspace.routes';
import boardRoutes from '@/modules/boards/routes/board.routes';
import columnRoutes from '@/modules/columns/routes/column.routes';
import taskRoutes from '@/modules/tasks/routes/task.routes';
import labelRoutes from '@/modules/tasks/routes/label.routes';
import commentRoutes from '@/modules/comments/routes/comment.routes';
import dashboardRoutes from '@/modules/dashboard/routes/dashboard.routes';
import notificationRoutes from '@/modules/notifications/routes/notification.routes';
import activityRoutes from '@/modules/analytics/routes/activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/boards', boardRoutes);
router.use('/columns', columnRoutes);
router.use('/tasks', taskRoutes);
router.use('/labels', labelRoutes);
router.use('/comments', commentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);

export default router;
