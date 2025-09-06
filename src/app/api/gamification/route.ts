import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import UserModel from "@/lib/models/server/user";
import { XPService } from "@/lib/services/xp";
import { BadgeService } from "@/lib/services/badges";
import { GamificationData } from "@/types/gamification";

// Helper function to verify authentication and get user
async function authenticateUser() {
  // Initialize Firebase Admin
  initAdminApp();

  // Verify authentication via session cookie
  const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
  if (!sessionCookie) {
    throw new Error("Unauthorized - No session cookie");
  }

  let decodedClaims;
  try {
    decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    throw new Error("Unauthorized - Invalid session");
  }

  const uid = decodedClaims.uid;

  // Connect to database
  await dbConnect();

  // Get user
  const user = await UserModel.findOne({ uid });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// GET - Fetch user's gamification data
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();

    // Get user's gamification data
    const gamificationData = await XPService.getUserGamificationData(user._id.toString());
    
    if (!gamificationData) {
      return NextResponse.json(
        { error: "Gamification data not found" },
        { status: 404 }
      );
    }

    // Get badge progress for unearned badges
    const badgeProgress = BadgeService.getBadgeProgress(gamificationData);
    
    // Calculate additional metrics
    const xpForNextLevel = XPService.getXPForNextLevel(gamificationData.xp);
    const levelThresholds = XPService.getLevelThresholds();
    
    // Format response
    const response = {
      gamificationData: {
        ...gamificationData,
        // Convert dates to ISO strings for JSON serialization
        streaks: {
          ...gamificationData.streaks,
          lastLoginDate: gamificationData.streaks.lastLoginDate?.toISOString(),
        },
        badges: gamificationData.badges.map(badge => ({
          ...badge,
          earnedAt: badge.earnedAt.toISOString(),
        })),
        xpHistory: gamificationData.xpHistory.map(transaction => ({
          ...transaction,
          timestamp: transaction.timestamp.toISOString(),
        })),
      },
      badgeProgress,
      xpForNextLevel,
      levelThresholds,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching gamification data:", error);
    
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error.message === "User not found") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (error.message === "Database connection failed") {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}