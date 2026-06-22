import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller';
import { protect } from '@/common/middlewares/auth';
import { requirePlatformPermission, requireWorkspacePermission } from '@/common/middlewares/authorize';
import { validate } from '@/common/middlewares/validate';
import { Permissions } from '@/common/authorization/permissions';
import {
  createWorkspaceSchema,
  invitationTokenParamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from '../schemas/workspace.schema';

const router = Router();

router.use(protect);

router.get('/invitations/:token', validate(invitationTokenParamSchema), WorkspaceController.getInvitation);
router.post('/invitations/:token/accept', validate(invitationTokenParamSchema), WorkspaceController.acceptInvitation);
router.post('/invitations/:token/reject', validate(invitationTokenParamSchema), WorkspaceController.rejectInvitation);

router.route('/')
  .post(requirePlatformPermission(Permissions.WORKSPACE_CREATE), validate(createWorkspaceSchema), WorkspaceController.create)
  .get(WorkspaceController.getAll);

router.route('/:id')
  .get(requireWorkspacePermission(Permissions.WORKSPACE_VIEW), WorkspaceController.getOne)
  .patch(requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), validate(updateWorkspaceSchema), WorkspaceController.update)
  .delete(requireWorkspacePermission(Permissions.WORKSPACE_DELETE), WorkspaceController.delete);

router.post('/:id/invitations', requireWorkspacePermission(Permissions.WORKSPACE_INVITE), validate(inviteMemberSchema), WorkspaceController.invite);
router.patch(
  '/:id/members/:memberId/role',
  requireWorkspacePermission(Permissions.WORKSPACE_MANAGE_ROLES),
  validate(updateMemberRoleSchema),
  WorkspaceController.updateMemberRole,
);
router.delete(
  '/:id/members/:memberId',
  requireWorkspacePermission(Permissions.WORKSPACE_REMOVE_MEMBER),
  WorkspaceController.removeMember,
);
router.post(
  '/:id/transfer-ownership/:memberId',
  requireWorkspacePermission(Permissions.WORKSPACE_TRANSFER_OWNERSHIP),
  WorkspaceController.transferOwnership,
);

export default router;
