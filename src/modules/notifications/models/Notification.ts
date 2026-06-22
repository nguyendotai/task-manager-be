import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  readAt?: Date;
  metadata?: Record<string, any>;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: String,
    readAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
