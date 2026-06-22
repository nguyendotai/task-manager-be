import { Schema, model, Document, Types } from 'mongoose';
import { WorkspaceRole, InvitationStatus } from '@/common/constants/enums';

export interface IInvitation extends Document {
  workspace: Types.ObjectId;
  email: string;
  role: WorkspaceRole;
  invitedBy: Types.ObjectId;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: Object.values(WorkspaceRole),
      default: WorkspaceRole.MEMBER,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

invitationSchema.index({ email: 1, workspace: 1 });
invitationSchema.index({ token: 1 });

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
