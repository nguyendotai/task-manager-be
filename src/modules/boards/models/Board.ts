import { Schema, model, Document, Types } from 'mongoose';
import { ResourceVisibility } from '@/common/constants/enums';

export interface IBoard extends Document {
  name: string;
  workspace: Types.ObjectId;
  createdBy: Types.ObjectId;
  visibility: ResourceVisibility;
  allowedMembers: Types.ObjectId[];
  isDeleted: boolean;
}

const boardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

boardSchema.index({ workspace: 1 });
boardSchema.index({ allowedMembers: 1 });

boardSchema.pre('find', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

boardSchema.pre('findOne', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const Board = model<IBoard>('Board', boardSchema);
