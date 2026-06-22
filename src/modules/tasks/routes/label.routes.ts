import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { LabelController } from '../controllers/label.controller';
import { createLabelSchema, getWorkspaceLabelsSchema, updateLabelSchema } from '../schemas/label.schema';

const router = Router();

router.use(protect);

router.post('/', validate(createLabelSchema), LabelController.create);
router.get('/workspace/:workspaceId', validate(getWorkspaceLabelsSchema), LabelController.getByWorkspace);

router
  .route('/:id')
  .patch(validate(updateLabelSchema), LabelController.update)
  .delete(LabelController.delete);

export default router;
