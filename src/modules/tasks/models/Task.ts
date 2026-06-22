import { Schema, model, Document, Types } from 'mongoose';
import { ResourceVisibility, TaskPriority, TaskStatus } from '@/common/constants/enums';

export interface ITask extends Document {
  title: string;
  description?: string;
  board: Types.ObjectId;
  column: Types.ObjectId;
  workspace: Types.ObjectId;
  assignees: Types.ObjectId[];
  visibility: ResourceVisibility;
  allowedMembers: Types.ObjectId[];
  labels: Types.ObjectId[];
  markedBy: Types.ObjectId[];
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  order: number;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    column: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    visibility: {
      type: String,
      enum: Object.values(ResourceVisibility),
      default: ResourceVisibility.PUBLIC,
    },
    allowedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    labels: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    markedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    dueDate: Date,
    order: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

taskSchema.index({ column: 1, order: 1 });
taskSchema.index({ workspace: 1 });
taskSchema.index({ markedBy: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ allowedMembers: 1 });
taskSchema.index({ visibility: 1 });

taskSchema.pre('find', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

taskSchema.pre('findOne', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const Task = model<ITask>('Task', taskSchema);
