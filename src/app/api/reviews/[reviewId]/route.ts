import "server-only";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from '@/lib/db/db';
import ReviewModel, { formatReview } from '@/lib/models/server/review';
import UserModel from '@/lib/models/server/user';

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

export async function GET(
    request: NextRequest,
    { params }: { params: { reviewId: string } }
) {
    try {
        const user = await authenticateUser();
        const { reviewId } = params;

        // Validate reviewId
        if (!reviewId || typeof reviewId !== 'string') {
            return NextResponse.json(
                { error: 'Invalid review ID' },
                { status: 400 }
            );
        }

        // Find the review by ID and ensure it belongs to the user
        const review = await ReviewModel.findOne({
            _id: reviewId,
            user: user._id
        });

        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404 }
            );
        }

        // Format and return the review
        const formattedReview = formatReview(review);
        return NextResponse.json(formattedReview);
    } catch (error: any) {
        console.error('Error fetching review:', error);

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

        // Handle invalid ObjectId errors
        if (error.name === 'CastError') {
            return NextResponse.json(
                { error: "Invalid review ID format" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}