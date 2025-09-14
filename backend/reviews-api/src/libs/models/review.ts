import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const ReviewSchema = new Schema({
    user: {type: Schema.Types.ObjectId, required: true, ref: "User", index: true},
    appId: {type: Schema.Types.ObjectId, required: true,  index: true},
    name:  {type: String},
    comment:  {type: String},
    date:  {type: Date},
    rating: {type: Number},
    createdAt: {type: Date, default: new Date()},
    updatedAt: {type: Date, default: new Date()}
  });
  
  ReviewSchema.pre("save", function(next) {
    this.updatedAt = new Date();
    next();
  });

  export type Review = {
    _id?: any;
    userId: any,
    appId: any,
    name?: string,
    date?: Date,
    comment?: string,
    rating?: number,
    createdAt?: Date,
    updatedAt?: Date
}

export const ReviewModel = mongoose.model('Review', ReviewSchema)