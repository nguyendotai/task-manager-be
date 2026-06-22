import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { WorkspaceService } from '../services/workspace.service';

export class WorkspaceController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const workspace = await WorkspaceService.createWorkspace(userId, req.body);
    return sendSuccess(res, 'Workspace created successfully', workspace, StatusCodes.CREATED);
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const workspaces = await WorkspaceService.getUserWorkspaces(userId);
    return sendSuccess(res, 'Workspaces retrieved successfully', workspaces);
  });

  static getOne = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const workspace = await WorkspaceService.getWorkspaceById(id as string, userId);
    return sendSuccess(res, 'Workspace retrieved successfully', workspace);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const workspace = await WorkspaceService.updateWorkspace(id as string, userId, req.body);
    return sendSuccess(res, 'Workspace updated successfully', workspace);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    await WorkspaceService.deleteWorkspace(id as string, userId);
    return sendSuccess(res, 'Workspace deleted successfully');
  });

  static invite = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const invitation = await WorkspaceService.inviteMember(id as string, userId, req.body);
    return sendSuccess(res, 'Workspace invitation created successfully', invitation, StatusCodes.CREATED);
  });

  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id, memberId } = req.params;
    const member = await WorkspaceService.updateMemberRole(id as string, memberId as string, userId, req.body.role);
    return sendSuccess(res, 'Workspace member role updated successfully', member);
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id, memberId } = req.params;
    await WorkspaceService.removeMember(id as string, memberId as string, userId);
    return sendSuccess(res, 'Workspace member removed successfully');
  });

  static transferOwnership = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id, memberId } = req.params;
    const workspace = await WorkspaceService.transferOwnership(id as string, memberId as string, userId);
    return sendSuccess(res, 'Workspace ownership transferred successfully', workspace);
  });

  static getInvitation = asyncHandler(async (req: Request, res: Response) => {
    const invitation = await WorkspaceService.getInvitation(req.params.token as string);
    return sendSuccess(res, 'Invitation retrieved successfully', invitation);
  });

  static acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const member = await WorkspaceService.acceptInvitation(req.params.token as string, userId);
    return sendSuccess(res, 'Invitation accepted successfully', member);
  });

  static rejectInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    await WorkspaceService.rejectInvitation(req.params.token as string, userId);
    return sendSuccess(res, 'Invitation rejected successfully');
  });
}
