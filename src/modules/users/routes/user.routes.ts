import { Router } from 'express';
import { protect } from '@/common/middlewares/auth';
import { validate } from '@/common/middlewares/validate';
import { UserController } from '../controllers/user.controller';
import {
  changePasswordSchema,
  updateProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  userListQuerySchema,
} from '../schemas/user.schema';

const router = Router();

router.use(protect);

router.get('/me', UserController.getMe);
router.patch('/me', validate(updateProfileSchema), UserController.updateMe);
router.patch('/me/password', validate(changePasswordSchema), UserController.changePassword);
router.delete('/me', UserController.deactivateMe);

router.get('/', validate(userListQuerySchema), UserController.listUsers);
router.patch('/:id/role', validate(updateUserRoleSchema), UserController.updateRole);
router.patch('/:id/ban', validate(userIdParamSchema), UserController.ban);
router.patch('/:id/unban', validate(userIdParamSchema), UserController.unban);

export default router;
