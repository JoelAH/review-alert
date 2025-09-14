import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import UserModel from "@/lib/models/server/user";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";

interface AwardXPRequest {
  action: XPAction;
  metadata?: Record<string, any>;
}

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 XP awards per minute per user

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

// Rate limiting helper
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userKey = `xp_award_${userId}`;
  const userLimit = rateLimitStore.get(userKey);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(userKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment count
  userLimit.count++;
  return true;
}

// POST - Award XP to user
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    const userId = user._id.toString();

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} XP awards per minute allowed` 
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: AwardXPRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Validate action type
    if (!Object.values(XPAction).includes(body.action)) {
      return NextResponse.json(
        { 
          error: `Invalid action. Must be one of: ${Object.values(XPAction).join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Validate metadata if provided
    if (body.metadata && typeof body.metadata !== 'object') {
      return NextResponse.json(
        { error: "Metadata must be an object if provided" },
        { status: 400 }
      );
    }

    // Special validation for LOGIN_STREAK_BONUS
    if (body.action === XPAction.LOGIN_STREAK_BONUS) {
      if (!body.metadata?.streakDays || typeof body.metadata.streakDays !== 'number') {
        return NextResponse.json(
          { error: "LOGIN_STREAK_BONUS action requires metadata.streakDays (number)" },
          { status: 400 }
        );
      }
      if (body.metadata.streakDays < 1) {
        return NextResponse.json(
          { error: "streakDays must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Award XP
    const result = await XPService.awardXP(userId, body.action, body.metadata);

    // Format response with ISO date strings
    const response = {
      ...result,
      badgesEarned: result.badgesEarned.map(badge => ({
        ...badge,
        earnedAt: badge.earnedAt.toISOString(),
      })),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("Error awarding XP lawwd:", error);
    
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

    // Handle validation errors from XP service
    if (error.message.includes("Failed to award XP")) {
      return NextResponse.json(
        { error: "Failed to award XP", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}