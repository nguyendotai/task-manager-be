import { Schema, model, Document, Types } from 'mongoose';
import { WorkspaceRole } from '@/common/constants/enums';

export interface IMember extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(WorkspaceRole),
      default: WorkspaceRole.MEMBER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Tránh duplicate member trong 1 workspace
memberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const Member = model<IMember>('Member', memberSchema);
