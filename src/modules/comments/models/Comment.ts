import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  task: Types.ObjectId;
  user: Types.ObjectId;
  attachments?: string[];
  isDeleted: boolean;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachments: [String],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1 });

commentSchema.pre('find', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

commentSchema.pre('findOne', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const Comment = model<IComment>('Comment', commentSchema);
