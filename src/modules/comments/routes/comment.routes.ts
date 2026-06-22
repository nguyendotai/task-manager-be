import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import {
  commentIdParamSchema,
  createCommentSchema,
  taskCommentsParamSchema,
  updateCommentSchema,
} from '../schemas/comment.schema';

const router = Router();

router.use(protect);

router.post('/', validate(createCommentSchema), CommentController.create);
router.get('/task/:taskId', validate(taskCommentsParamSchema), CommentController.getByTask);
router.patch('/:id', validate(updateCommentSchema), CommentController.update);
router.delete('/:id', validate(commentIdParamSchema), CommentController.delete);

export default router;
