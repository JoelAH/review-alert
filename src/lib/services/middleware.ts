import "server-only";

import { initAdminApp } from "../firebase/admin.config";
import { cookies } from "next/headers";
import CONSTANTS from "../constants";
import { redirect } from "next/navigation";
import { auth } from "firebase-admin";

export async function checkAuth(isAuthPage?: boolean) {
    initAdminApp();
    const session = cookies().get(CONSTANTS.sessionCookieName)?.value || undefined;

    //Validate if the cookie exist in the request
    if (!session) {
        if (isAuthPage) {
            return null;
        } else {
            return redirect('/login');
        }
    } else if (isAuthPage) {
        return redirect('/dashboard');
    }
    //Use Firebase Admin to validate the session cookie
    let decodedClaims;
    try {
        decodedClaims = await auth().verifySessionCookie(session, true);
    }
    catch (e: any) {
        console.log(e.message);
    }

    if (!decodedClaims) {
        if (isAuthPage) {
            return null;
        } else {
            return redirect('/login');
        }
    } else if (isAuthPage) {
        return redirect('/dashboard');
    }

    return decodedClaims;
}