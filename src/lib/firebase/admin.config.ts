import "server-only";
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const firebaseAdminConfig = {
    credential: cert(JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    ))
}

export function initAdminApp() {
    if (getApps().length <= 0) {
        initializeApp(firebaseAdminConfig);
    }
}