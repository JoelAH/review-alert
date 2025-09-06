"use server";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";

// Helper function to verify authentication and get user
async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(CONSTANTS.SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const { initAdminApp } = await import("@/lib/firebase/admin.config");
    const { auth } = initAdminApp();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const userClaims = await getAuthenticatedUser();
    if (!userClaims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { action, metadata } = body;

    // Validate action
    if (!action || !Object.values(XPAction).includes(action)) {
      return NextResponse.json({ error: "Invalid XP action" }, { status: 400 });
    }

    // Award XP
    const result = await XPService.awardXP(userClaims.uid, action, metadata);

    return NextResponse.json({
      success: true,
      xpAwarded: result
    });

  } catch (error) {
    console.error("Error awarding XP:", error);
    return NextResponse.json(
      { error: "Failed to award XP" },
      { status: 500 }
    );
  }
}