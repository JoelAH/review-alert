import "server-only";

import { initAdminApp } from "../firebase/admin.config";
import { cookies } from "next/headers";
import CONSTANTS from "../constants";
import { redirect } from "next/navigation";
import { auth } from "firebase-admin";

export async function checkAuth(isAuthPage?: boolean) {
    initAdminApp();
    const session = cookies().get(CONSTANTS.sessionCookieName)?.value;

    let decodedClaims = null;
    
    // Always attempt verification if session exists to maintain consistent timing
    if (session) {
        try {
            decodedClaims = await auth().verifySessionCookie(session, true);
        } catch (e: any) {
            // Log error code only, not full message for security
            console.error('Session verification failed:', e.code || 'unknown');
        }
    }

    // Consistent handling for all authentication failures
    if (!decodedClaims) {
        if (isAuthPage) {
            return null;
        } else {
            return redirect('/login');
        }
    }
    
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
        return redirect('/dashboard');
    }

    return decodedClaims;
}