import "server-only";
import mongoose from "mongoose";

const Schema = mongoose.Schema;


export const ReviewSchema = new Schema({
  user: {type: Schema.Types.ObjectId, required: true, ref: "User"},
  type: { type: String, required: true },
  reviewId: { type: String },
  reviewDate: { type: Date },
  userName: { type: String },
  score: { type: Number },
  text: { type: String },
  createdAt: {type: Date, default: new Date()},
  updatedAt: {type: Date, default: new Date()},
});

ReviewSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export type Review = {
    _id?: any;
    user: any;
    type: string;
    reviewId: string;
    reviewDate: Date;
    userName: string;
    score: number;
    text: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const formatReview = (savedObject: any) => {
  const formattedReview = Object.assign({}, {...savedObject});
  formattedReview._id = savedObject._id.toString();
  formattedReview.user = savedObject.user.toString();

  return formattedReview;
};

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema)
