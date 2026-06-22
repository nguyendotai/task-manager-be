import { Schema, model, Document, Types } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string;
  workspace: Types.ObjectId;
}

const labelSchema = new Schema<ILabel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#000000',
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
  },
  { timestamps: true }
);

labelSchema.index({ workspace: 1 });
labelSchema.index({ workspace: 1, name: 1 }, { unique: true });

export const Label = model<ILabel>('Label', labelSchema);
