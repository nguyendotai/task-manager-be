import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { ColumnController } from '../controllers/column.controller';
import {
  columnIdParamSchema,
  createColumnSchema,
  reorderColumnsSchema,
  updateColumnSchema,
} from '../schemas/column.schema';

const router = Router();

router.use(protect);

router.post('/', validate(createColumnSchema), ColumnController.create);
router.patch('/reorder', validate(reorderColumnsSchema), ColumnController.reorder);
router.patch('/:id', validate(updateColumnSchema), ColumnController.update);
router.delete('/:id', validate(columnIdParamSchema), ColumnController.delete);

export default router;
