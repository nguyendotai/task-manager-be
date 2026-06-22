import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { ActivityController } from '../controllers/activity.controller';
import { workspaceActivityQuerySchema } from '../schemas/activity.schema';

const router = Router();

router.use(protect);

router.get('/workspaces/:workspaceId', validate(workspaceActivityQuerySchema), ActivityController.listByWorkspace);

export default router;
