import { cookies, headers } from "next/headers";
import { auth } from "firebase-admin";
import { NextResponse } from "next/server";
import CONSTANTS from "@/lib/constants";
import { initAdminApp } from "@/lib/firebase/admin.config";
import { revalidatePath } from "next/cache";
import { XPService } from "@/lib/services/xp";

export async function POST() {
    initAdminApp();

    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.split("Bearer ")[1];
        const decodedToken = await auth().verifyIdToken(idToken);
        if (decodedToken) {
            //Generate session cookie
            const expiresIn = 60 * 60 * 24 * 5 * 1000;
            const sessionCookie = await auth().createSessionCookie(idToken, {
                expiresIn,
            });
            const options = {
                name: CONSTANTS.sessionCookieName,
                value: sessionCookie,
                maxAge: expiresIn,
                httpOnly: true,
                secure: true,
            };
            //Add the cookie to the browser
            cookies().set(options);
            
            // Update login streak and award streak bonus XP if applicable
            try {
                await XPService.updateLoginStreak(decodedToken.uid);
            } catch (error) {
                console.error('Error updating login streak:', error);
                // Don't fail the login if streak tracking fails
            }
            
            revalidatePath('/');
            return NextResponse.json({ success: true }, { status: 200 });
        }
    }

    return NextResponse.json({ message: 'unauthorized', success: false }, { status: 401 });
}