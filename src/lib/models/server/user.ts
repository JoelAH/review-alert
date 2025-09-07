import "server-only";
import mongoose from "mongoose";
import { GamificationData, BadgeCategory, XPAction } from "@/types/gamification";

const Schema = mongoose.Schema;


export const UserSchema = new Schema({
  uid: {type: String, required: true, unique: true, index: true},
  email: {type: String, required: true, trim: true, index: true},
  apps: [
    { 
      store: { type: String, required: true }, 
      url: { type: String, required: true }, 
      appId: { type: String, required: true },
      appName: { type: String, required: true }
    }
  ],
  gamification: {
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    badges: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String, required: true },
      iconUrl: { type: String },
      earnedAt: { type: Date, required: true },
      category: { 
        type: String, 
        enum: Object.values(BadgeCategory),
        required: true 
      }
    }],
    streaks: {
      currentLoginStreak: { type: Number, default: 0, min: 0 },
      longestLoginStreak: { type: Number, default: 0, min: 0 },
      lastLoginDate: { type: Date }
    },
    activityCounts: {
      questsCreated: { type: Number, default: 0, min: 0 },
      questsCompleted: { type: Number, default: 0, min: 0 },
      questsInProgress: { type: Number, default: 0, min: 0 },
      appsAdded: { type: Number, default: 0, min: 0 },
      reviewInteractions: { type: Number, default: 0, min: 0 }
    },
    xpHistory: [{
      amount: { type: Number, required: true },
      action: { 
        type: String, 
        enum: Object.values(XPAction),
        required: true 
      },
      timestamp: { type: Date, required: true },
      metadata: { type: mongoose.Schema.Types.Mixed }
    }]
  },
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
    apps?: { store: 'ChromeExt' | 'GooglePlay' | 'AppleStore', url: string, appId?: string, appName?: string, _id?: any }[],
    gamification?: GamificationData,
    createdAt?: Date,
    updatedAt?: Date
}

export const formatUser = (savedObject: any): User => {
  const formattedUser =  savedObject.toObject() as User;
  delete formattedUser.createdAt;
  delete formattedUser.updatedAt;
  formattedUser._id = formattedUser._id.toString();
  
  // Format apps array
  const apps = [];
  if (formattedUser.apps) {
    for (const app of formattedUser.apps) {
      apps.push({ store: app.store, url: app.url, appId: app.appId, appName: app.appName, _id: app._id.toString() });
    }
    formattedUser.apps = apps;
  }

  // Format gamification data - ensure it exists with defaults
  if (!formattedUser.gamification) {
    formattedUser.gamification = {
      xp: 0,
      level: 1,
      badges: [],
      streaks: {
        currentLoginStreak: 0,
        longestLoginStreak: 0
      },
      activityCounts: {
        questsCreated: 0,
        questsCompleted: 0,
        questsInProgress: 0,
        appsAdded: 0,
        reviewInteractions: 0
      },
      xpHistory: []
    };
  }

  return formattedUser
};

export default mongoose.models.User || mongoose.model("User", UserSchema)
