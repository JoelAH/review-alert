import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const ReviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  comment: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  sentiment: {
    type: String,
    required: false,
    index: true
  },
  quest: {
    type: String,
    required: false
  },
  priority: {
    type: String,
    required: false,
    index: true
  },
  questId: { type: Schema.Types.ObjectId, required: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ReviewSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export type Review = {
  _id?: any;
  user: string; // ObjectId as string
  appId: string; // ObjectId as string
  name: string;
  comment: string;
  date: Date;
  rating: number;
  sentiment: string;
  quest?: string;
  priority?: string;
  questId?: string; // ObjectId as string, optional reference to created quest
  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewModel = mongoose.model('Review', ReviewSchema)