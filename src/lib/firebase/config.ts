import { getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Load .env variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

const newApp = getApps().length <= 0;
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

if (typeof window !== "undefined" && newApp && "measurementId" in firebaseConfig && firebaseConfig.measurementId) {
  getAnalytics(firebaseApp);
}


export const firebaseAuth = getAuth(firebaseApp);
export const auth = firebaseAuth; // Export as 'auth' for compatibility
export const firebaseStorage = getStorage(firebaseApp);