import { Schema, model, Document, Types } from 'mongoose';

export interface IColumn extends Document {
  name: string;
  board: Types.ObjectId;
  order: number;
  isDeleted: boolean;
}

const columnSchema = new Schema<IColumn>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    order: {
      type: Number,
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

columnSchema.index({ board: 1, order: 1 });

columnSchema.pre('find', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

columnSchema.pre('findOne', function (this: any, next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

export const Column = model<IColumn>('Column', columnSchema);
