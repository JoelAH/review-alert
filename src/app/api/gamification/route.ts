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
import { rateLimit, getRateLimitIdentifier } from "@/lib/middleware/rateLimit";
import { createErrorResponse, handleDatabaseError, handleAuthError, ApiError } from "@/lib/utils/errorHandling";

export const dynamic = 'force-dynamic';

// Helper function to verify authentication and get user
async function authenticateUser() {
  // Initialize Firebase Admin
  initAdminApp();

  // Verify authentication via session cookie
  const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
  if (!sessionCookie) {
    throw new ApiError("Unauthorized", 401);
  }

  let decodedClaims;
  try {
    decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    throw new ApiError("Unauthorized", 401);
  }

  const uid = decodedClaims.uid;

  // Connect to database
  try {
    await dbConnect();
  } catch (error) {
    throw error; // Let the caller handle database errors
  }

  // Get user
  const user = await UserModel.findOne({ uid });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return { user, uid };
}

// GET - Fetch user's gamification data
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitId = getRateLimitIdentifier(request);
    const { success: rateLimitSuccess, remaining } = rateLimit(rateLimitId, 100, 60000);
    
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many requests" },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    const { user, uid } = await authenticateUser();

    // Get user's gamification data using Firebase UID
    const gamificationData = await XPService.getUserGamificationData(uid);
    
    if (!gamificationData) {
      throw new ApiError("Gamification data not found", 404);
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

    // Add rate limit headers to successful responses
    const responseHeaders = {
      'X-RateLimit-Remaining': remaining.toString()
    };

    return NextResponse.json(response, { headers: responseHeaders });

  } catch (error: any) {
    // Handle database errors specifically
    if (error.name && (error.name.includes('Mongo') || error.name === 'ValidationError')) {
      return handleDatabaseError(error);
    }
    
    // Handle API errors
    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }
    
    // Handle all other errors
    return createErrorResponse(error as Error, "Failed to fetch gamification data");
  }
}