import "server-only";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Enums for review properties
export enum ReviewSentiment {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE"
}

export enum ReviewQuest {
  BUG = "BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  OTHER = "OTHER"
}

export enum ReviewPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export const ReviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  comment: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  sentiment: { 
    type: String, 
    enum: Object.values(ReviewSentiment), 
    required: true,
    index: true
  },
  quest: { 
    type: String, 
    enum: Object.values(ReviewQuest),
    required: false
  },
  priority: { 
    type: String, 
    enum: Object.values(ReviewPriority),
    required: false,
    index: true
  },
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient querying
ReviewSchema.index({ user: 1, date: -1 });
ReviewSchema.index({ appId: 1, date: -1 });
ReviewSchema.index({ sentiment: 1, priority: 1 });

ReviewSchema.pre("save", function(next) {
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
  sentiment: ReviewSentiment;
  quest?: ReviewQuest;
  priority?: ReviewPriority;
  questId?: string; // ObjectId as string, optional reference to created quest
  createdAt?: Date;
  updatedAt?: Date;
}

export const formatReview = (savedObject: any): Review => {
  const formattedReview = savedObject.toObject() as Review;
  formattedReview._id = formattedReview._id.toString();
  formattedReview.user = formattedReview.user.toString();
  formattedReview.appId = formattedReview.appId.toString();
  if (formattedReview.questId) {
    formattedReview.questId = formattedReview.questId.toString();
  }
  
  return formattedReview;
};

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);