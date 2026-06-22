import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { createBoardSchema, updateBoardSchema } from '../schemas/board.schema';

const router = Router();

router.use(protect);

router.post('/', validate(createBoardSchema), BoardController.create);
router.get('/workspace/:workspaceId', BoardController.getByWorkspace);
router.route('/:id')
  .get(BoardController.getFullData)
  .patch(validate(updateBoardSchema), BoardController.update)
  .delete(BoardController.delete);

export default router;
