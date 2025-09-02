import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import ReviewModel from "@/lib/models/server/review";
import UserModel from "@/lib/models/server/user";

export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    // Initialize Firebase Admin
    initAdminApp();

    // Verify authentication via session cookie
    const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session cookie" },
        { status: 401 }
      );
    }

    let decodedClaims;
    try {
      decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const uid = decodedClaims.uid;
    const { reviewId } = params;

    // Validate reviewId
    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await dbConnect();
    } catch (error) {
      console.error("Database connection failed:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    // Get user to verify ownership
    let user;
    try {
      user = await UserModel.findOne({ uid });
    } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { questId } = body;

    // Find and update the review
    let updatedReview;
    try {
      updatedReview = await ReviewModel.findOneAndUpdate(
        { _id: reviewId, user: user._id },
        { questId: questId || null, updatedAt: new Date() },
        { new: true, lean: true }
      );
    } catch (error) {
      console.error("Error updating review:", error);
      return NextResponse.json(
        { error: "Error updating review" },
        { status: 500 }
      );
    }

    if (!updatedReview) {
      return NextResponse.json(
        { error: "Review not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: {
        ...updatedReview,
        _id: updatedReview._id.toString(),
        user: updatedReview.user.toString(),
        appId: updatedReview.appId.toString(),
      }
    });

  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}