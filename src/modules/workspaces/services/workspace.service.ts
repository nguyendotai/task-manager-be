import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Member } from '../models/Member';
import { Invitation } from '../models/Invitation';
import { InvitationStatus, WorkspaceRole } from '@/common/constants/enums';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { User } from '@/modules/users/models/User';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityService } from '@/modules/analytics/services/activity.service';

export class WorkspaceService {
  static async createWorkspace(userId: string, data: Partial<IWorkspace>) {
    await AccessControl.assertPlatformPermission(userId, Permissions.WORKSPACE_CREATE);

    // Generate slug (basic version)
    const slug = data.name!.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

    const workspace = await Workspace.create({ ...data, owner: userId, slug });

    try {
      await Member.create({
        workspace: workspace._id,
        user: userId,
        role: WorkspaceRole.OWNER,
      });
    } catch (error) {
      await Workspace.findByIdAndDelete(workspace._id);
      throw error;
    }

    await ActivityService.record({
      user: workspace.owner,
      workspace: workspace._id,
      action: 'workspace.created',
      entityType: 'Workspace',
      entityId: workspace._id,
      details: `Workspace "${workspace.name}" created`,
    });

    return workspace;
  }

  static async getUserWorkspaces(userId: string) {
    const actor = await AccessControl.getActor(userId);
    if (AccessControl.isSuperAdmin(actor)) {
      return Workspace.find();
    }

    const memberships = await Member.find({ user: userId }).populate('workspace');
    return memberships.map(m => m.workspace);
  }

  static async getWorkspaceById(workspaceId: string, userId: string) {
    await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_VIEW);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found', StatusCodes.NOT_FOUND);
    }

    return workspace;
  }

  static async updateWorkspace(workspaceId: string, userId: string, data: Partial<IWorkspace>) {
    await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_UPDATE);

    const workspace = await Workspace.findByIdAndUpdate(workspaceId, data, { new: true, runValidators: true });
    if (workspace) {
      await ActivityService.record({
        user: userId as any,
        workspace: workspace._id,
        action: 'workspace.updated',
        entityType: 'Workspace',
        entityId: workspace._id,
        details: `Workspace "${workspace.name}" updated`,
      });
    }
    return workspace;
  }

  static async deleteWorkspace(workspaceId: string, userId: string) {
    await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_DELETE);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', StatusCodes.NOT_FOUND);

    workspace.isDeleted = true;
    await workspace.save();

    await ActivityService.record({
      user: userId as any,
      workspace: workspace._id,
      action: 'workspace.deleted',
      entityType: 'Workspace',
      entityId: workspace._id,
      details: `Workspace "${workspace.name}" deleted`,
    });
  }

  static async inviteMember(workspaceId: string, userId: string, data: { email: string; role: WorkspaceRole }) {
    const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_INVITE);
    if (!AccessControl.isSuperAdmin(access.actor)) {
      AccessControl.assertAssignableWorkspaceRole(access.member, data.role);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', StatusCodes.NOT_FOUND);

    const invitedUser = await User.findOne({ email: data.email });
    if (invitedUser) {
      const existingMember = await Member.findOne({ workspace: workspaceId, user: invitedUser._id });
      if (existingMember) throw new AppError('User is already a workspace member', StatusCodes.CONFLICT);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.findOneAndUpdate(
      { workspace: workspaceId, email: data.email.toLowerCase(), status: InvitationStatus.PENDING },
      {
        workspace: workspaceId,
        email: data.email.toLowerCase(),
        role: data.role,
        invitedBy: userId,
        status: InvitationStatus.PENDING,
        token,
        expiresAt,
      },
      { new: true, upsert: true, runValidators: true },
    );

    if (invitedUser && invitation) {
      await NotificationService.create({
        recipient: invitedUser._id,
        sender: userId as any,
        type: 'workspace.invitation',
        title: 'Workspace invitation',
        message: `You have been invited to join ${workspace.name}`,
        link: `/invitations/${invitation.token}`,
        metadata: { workspaceId, invitationId: invitation._id, role: data.role },
      });
    }

    await ActivityService.record({
      user: userId as any,
      workspace: workspace._id,
      action: 'workspace.invitation.created',
      entityType: 'Invitation',
      entityId: invitation!._id,
      details: `Invitation sent to ${data.email}`,
      metadata: { role: data.role },
    });

    return invitation;
  }

  static async getInvitation(token: string) {
    const invitation = await Invitation.findOne({ token }).populate('workspace', 'name slug logo').populate('invitedBy', 'name email avatar');
    if (!invitation) throw new AppError('Invitation not found', StatusCodes.NOT_FOUND);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new AppError('Invitation is no longer pending', StatusCodes.BAD_REQUEST);
    }
    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', StatusCodes.BAD_REQUEST);
    }
    return invitation;
  }

  static async acceptInvitation(token: string, userId: string) {
    const invitation = await Invitation.findOne({ token });
    if (!invitation) throw new AppError('Invitation not found', StatusCodes.NOT_FOUND);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new AppError('Invitation is no longer pending', StatusCodes.BAD_REQUEST);
    }
    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', StatusCodes.BAD_REQUEST);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError('This invitation belongs to another email address', StatusCodes.FORBIDDEN);
    }

    const existingMember = await Member.findOne({ workspace: invitation.workspace, user: userId });
    if (!existingMember) {
      await Member.create({
        workspace: invitation.workspace,
        user: userId,
        role: invitation.role,
      });
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await invitation.save();

    await ActivityService.record({
      user: user._id,
      workspace: invitation.workspace,
      action: 'workspace.invitation.accepted',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: `${user.email} accepted the invitation`,
    });

    return Member.findOne({ workspace: invitation.workspace, user: userId }).populate('workspace');
  }

  static async rejectInvitation(token: string, userId: string) {
    const invitation = await Invitation.findOne({ token });
    if (!invitation) throw new AppError('Invitation not found', StatusCodes.NOT_FOUND);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new AppError('Invitation is no longer pending', StatusCodes.BAD_REQUEST);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError('This invitation belongs to another email address', StatusCodes.FORBIDDEN);
    }

    invitation.status = InvitationStatus.REJECTED;
    await invitation.save();

    await ActivityService.record({
      user: user._id,
      workspace: invitation.workspace,
      action: 'workspace.invitation.rejected',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: `${user.email} rejected the invitation`,
    });
  }

  static async updateMemberRole(workspaceId: string, targetUserId: string, userId: string, role: WorkspaceRole) {
    const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_MANAGE_ROLES);
    const targetMember = await Member.findOne({ workspace: workspaceId, user: targetUserId });
    if (!targetMember) throw new AppError('Workspace member not found', StatusCodes.NOT_FOUND);
    if (!AccessControl.isSuperAdmin(access.actor)) {
      AccessControl.assertCanManageRole(access.member, targetMember.role);
      AccessControl.assertAssignableWorkspaceRole(access.member, role);
    }

    targetMember.role = role;
    await targetMember.save();
    await ActivityService.record({
      user: userId as any,
      workspace: workspaceId as any,
      action: 'workspace.member.role_updated',
      entityType: 'Member',
      entityId: targetMember._id,
      details: `Workspace member role updated to ${role}`,
      metadata: { targetUserId },
    });
    return targetMember;
  }

  static async removeMember(workspaceId: string, targetUserId: string, userId: string) {
    const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_REMOVE_MEMBER);
    const targetMember = await Member.findOne({ workspace: workspaceId, user: targetUserId });
    if (!targetMember) throw new AppError('Workspace member not found', StatusCodes.NOT_FOUND);
    if (!AccessControl.isSuperAdmin(access.actor)) {
      AccessControl.assertCanManageRole(access.member, targetMember.role);
    }

    await targetMember.deleteOne();
    await ActivityService.record({
      user: userId as any,
      workspace: workspaceId as any,
      action: 'workspace.member.removed',
      entityType: 'Member',
      entityId: targetMember._id,
      details: 'Workspace member removed',
      metadata: { targetUserId },
    });
  }

  static async transferOwnership(workspaceId: string, targetUserId: string, userId: string) {
    await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_TRANSFER_OWNERSHIP);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', StatusCodes.NOT_FOUND);

    const currentOwner = await Member.findOne({ workspace: workspaceId, user: workspace.owner });
    const nextOwner = await Member.findOne({ workspace: workspaceId, user: targetUserId });
    if (!nextOwner) throw new AppError('New owner must be a workspace member', StatusCodes.BAD_REQUEST);

    workspace.owner = nextOwner.user;
    nextOwner.role = WorkspaceRole.OWNER;
    if (currentOwner && currentOwner.user.toString() !== targetUserId) {
      currentOwner.role = WorkspaceRole.ADMIN;
      await currentOwner.save();
    }

    await nextOwner.save();
    await workspace.save();
    await ActivityService.record({
      user: userId as any,
      workspace: workspace._id,
      action: 'workspace.ownership.transferred',
      entityType: 'Workspace',
      entityId: workspace._id,
      details: 'Workspace ownership transferred',
      metadata: { targetUserId },
    });
    return workspace;
  }
}
