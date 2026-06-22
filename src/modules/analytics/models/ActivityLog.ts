import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  workspace: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  details?: string;
  metadata?: Record<string, any>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    details: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
