//import "server-only";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/db";


/**
 * Migration script to add gamification data to existing users
 * This script initializes gamification fields for users who don't have them
 */
export async function migrateGamificationData() {
  try {
    await dbConnect();
    
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    
    // Find users without gamification data
    const usersWithoutGamification = await User.find({
      $or: [
        { gamification: { $exists: false } },
        { gamification: null }
      ]
    });

    console.log(`Found ${usersWithoutGamification.length} users without gamification data`);

    // Initialize gamification data for each user
    for (const user of usersWithoutGamification) {
      const gamificationData = {
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
          appsAdded: user.apps ? user.apps.length : 0, // Initialize with current app count
          reviewInteractions: 0
        },
        xpHistory: []
      };

      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            gamification: gamificationData,
            updatedAt: new Date()
          }
        }
      );
    }

    console.log(`Successfully initialized gamification data for ${usersWithoutGamification.length} users`);
    return { success: true, usersUpdated: usersWithoutGamification.length };
    
  } catch (error) {
    console.error("Error during gamification migration:", error);
    throw error;
  }
}

/**
 * Rollback function to remove gamification data (for testing purposes)
 */
export async function rollbackGamificationData() {
  try {
    await dbConnect();
    
    const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    
    const result = await User.updateMany(
      {},
      { 
        $unset: { gamification: "" },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`Removed gamification data from ${result.modifiedCount} users`);
    return { success: true, usersUpdated: result.modifiedCount };
    
  } catch (error) {
    console.error("Error during gamification rollback:", error);
    throw error;
  }
}