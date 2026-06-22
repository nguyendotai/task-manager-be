import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { createTaskSchema, markTaskSchema, reorderTasksSchema, taskListQuerySchema, updateTaskSchema } from '../schemas/task.schema';

const router = Router();

router.use(protect);

router.post('/', validate(createTaskSchema), TaskController.create);
router.get('/marked', validate(taskListQuerySchema), TaskController.getMarked);
router.get('/recent', validate(taskListQuerySchema), TaskController.getRecent);
router.get('/my', validate(taskListQuerySchema), TaskController.getMyTasks);
router.get('/search', validate(taskListQuerySchema), TaskController.search);
router.get('/column/:columnId', TaskController.getByColumn);
router.patch('/:id/mark', validate(markTaskSchema), TaskController.mark);
router.patch('/reorder', validate(reorderTasksSchema), TaskController.reorder);

router.route('/:id')
  .patch(validate(updateTaskSchema), TaskController.update)
  .delete(TaskController.delete);

export default router;
