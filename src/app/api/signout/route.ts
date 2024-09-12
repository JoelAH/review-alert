import CONSTANTS from "@/lib/constants";
import { initAdminApp } from "@/lib/firebase/admin.config";
import { auth } from "firebase-admin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    initAdminApp();
    
    const session = cookies().get(CONSTANTS.sessionCookieName)?.value || undefined;
    if (!session) {
        return NextResponse.json({ success: false }, { status: 401 });
    }
    const decodedClaims = await auth().verifySessionCookie(session, true);
    if (!decodedClaims?.sub) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    await auth().revokeRefreshTokens(decodedClaims.sub);
    cookies().delete(CONSTANTS.sessionCookieName);
    revalidatePath('/');
    return NextResponse.json({ success: true }, { status: 200 });
}