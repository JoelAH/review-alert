import "server-only";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from '@/lib/db/db';
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
    { params }: { params: { appId: string } }
) {
    try {
        const user = await authenticateUser();
        const { appId } = params;

        // Validate appId
        if (!appId || typeof appId !== 'string') {
            return NextResponse.json(
                { error: 'Invalid app ID' },
                { status: 400 }
            );
        }

        // Find the app in user's apps array
        const app = user.apps?.find((app: any) => app._id?.toString() === appId || app.appId === appId);

        if (!app) {
            return NextResponse.json(
                { error: 'App not found' },
                { status: 404 }
            );
        }

        // Return app information
        return NextResponse.json({
            _id: app._id,
            appId: app.appId,
            store: app.store,
            url: app.url,
            name: `App (${app.store})` // Since we don't store app names, use a generic name
        });
    } catch (error: any) {
        console.error('Error fetching app:', error);

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
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}