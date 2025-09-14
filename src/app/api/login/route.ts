import { cookies, headers } from "next/headers";
import { auth } from "firebase-admin";
import { NextResponse } from "next/server";
import CONSTANTS from "@/lib/constants";
import { initAdminApp } from "@/lib/firebase/admin.config";
import { revalidatePath } from "next/cache";
import { XPService } from "@/lib/services/xp";
import dbConnect from "@/lib/db/db";

export async function POST() {
    initAdminApp();
    dbConnect();
    console.log('1');
    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        console.log('2');
        const idToken = authorization.split("Bearer ")[1];
        const decodedToken = await auth().verifyIdToken(idToken);
        console.log('3');
        if (decodedToken) {
            //Generate session cookie
            const expiresIn = 60 * 60 * 24 * 5 * 1000;
            console.log('4');
            const sessionCookie = await auth().createSessionCookie(idToken, {
                expiresIn,
            });
            console.log('5');
            const options = {
                name: CONSTANTS.sessionCookieName,
                value: sessionCookie,
                maxAge: expiresIn,
                httpOnly: true,
                secure: true,
            };
            //Add the cookie to the browser
            cookies().set(options);
            console.log('6');
            // Update login streak and award streak bonus XP if applicable
            try {
                console.log('6.5', decodedToken.uid);
                await XPService.updateLoginStreak(decodedToken.uid);
                console.log('7');
            } catch (error) {
                console.log('8');
                console.error('Error updating login streak:', error);
                // Don't fail the login if streak tracking fails
            }
            console.log('9');
            revalidatePath('/');
            return NextResponse.json({ success: true }, { status: 200 });
        }
    }

    return NextResponse.json({ message: 'unauthorized', success: false }, { status: 401 });
}