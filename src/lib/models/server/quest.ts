import "server-only";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Enums for quest properties
export enum QuestType {
  BUG_FIX = "BUG_FIX",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  IMPROVEMENT = "IMPROVEMENT",
  RESEARCH = "RESEARCH",
  OTHER = "OTHER"
}

export enum QuestPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export enum QuestState {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE"
}

export const QuestSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: false, index: true },
  title: { type: String, required: true, trim: true },
  details: { type: String, required: false, trim: true },
  type: { 
    type: String, 
    enum: Object.values(QuestType), 
    required: true,
    index: true
  },
  priority: { 
    type: String, 
    enum: Object.values(QuestPriority),
    required: true,
    index: true
  },
  state: { 
    type: String, 
    enum: Object.values(QuestState),
    required: true,
    default: QuestState.OPEN,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient querying by user, state, and priority
QuestSchema.index({ user: 1, state: 1, priority: 1 });
QuestSchema.index({ user: 1, createdAt: -1 });
QuestSchema.index({ reviewId: 1 });

QuestSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export type Quest = {
  _id?: any;
  user: string; // ObjectId as string
  reviewId?: string; // ObjectId as string, optional reference to originating review
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  state: QuestState;
  createdAt?: Date;
  updatedAt?: Date;
}

export const formatQuest = (savedObject: any): Quest => {
  const formattedQuest = savedObject.toObject() as Quest;
  formattedQuest._id = formattedQuest._id.toString();
  formattedQuest.user = formattedQuest.user.toString();
  if (formattedQuest.reviewId) {
    formattedQuest.reviewId = formattedQuest.reviewId.toString();
  }
  
  return formattedQuest;
};

export default mongoose.models.Quest || mongoose.model("Quest", QuestSchema);