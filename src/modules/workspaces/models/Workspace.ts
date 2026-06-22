import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  slug: string;
  logo?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    description: String,
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    logo: String,
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ slug: 1 });
workspaceSchema.index({ owner: 1 });

workspaceSchema.pre('find', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

workspaceSchema.pre('findOne', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
