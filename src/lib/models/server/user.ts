import "server-only";
import mongoose from "mongoose";

const Schema = mongoose.Schema;


export const UserSchema = new Schema({
  uid: {type: String, required: true, unique: true, index: true},
  email: {type: String, required: true, unique: true, trim: true, index: true},
  apps: [
    { 
      store: { type: String, required: true }, url: { type: String, required: true }, id: { type: String, required: true } 
    }
  ],
  createdAt: {type: Date, default: new Date()},
  updatedAt: {type: Date, default: new Date()}
});

UserSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export type User = {
    _id?: any;
    uid: string,
    email: string,
    apps?: { store: 'ChromeExt' | 'GooglePlay' | 'AppleStore', url: string, id?: string }[],
    createdAt?: Date,
    updatedAt?: Date
}

export const formatUser = (savedObject: any): User => {
  const formattedUser =  savedObject.toObject() as User;
  delete formattedUser.createdAt;
  delete formattedUser.updatedAt;
  delete formattedUser.createdAt;
  formattedUser._id = formattedUser._id.toString();

  return formattedUser
};

export default mongoose.models.User || mongoose.model("User", UserSchema)
