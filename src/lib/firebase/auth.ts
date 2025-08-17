import {
    type User,
    type UserCredential,
    GoogleAuthProvider,
    OAuthProvider,
    onAuthStateChanged as _onAuthStateChanged,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail as _sendPasswordResetEmail,
    AuthError
} from 'firebase/auth';

import { firebaseAuth } from './config';

export function onAuthStateChanged(callback: (authUser: User | null) => void) {
    return _onAuthStateChanged(firebaseAuth, callback);
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(firebaseAuth, provider);
}

export async function signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return await signInWithPopup(firebaseAuth, provider);
}

export async function signOut() {
    return await firebaseAuth.signOut();
}

export function getUser(): User | null {
    return firebaseAuth.currentUser;
}

/**
 * Create a new user account with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<UserCredential> - Firebase user credential
 * @throws AuthError - Firebase authentication error
 */
export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
        return await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        // Re-throw as AuthError for consistent error handling
        throw error as AuthError;
    }
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<UserCredential> - Firebase user credential
 * @throws AuthError - Firebase authentication error
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
        return await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        // Re-throw as AuthError for consistent error handling
        throw error as AuthError;
    }
}

/**
 * Send password reset email to user
 * @param email - User's email address
 * @returns Promise<void>
 * @throws AuthError - Firebase authentication error
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
    try {
        return await _sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
        // Re-throw as AuthError for consistent error handling
        throw error as AuthError;
    }
}

/**
 * Firebase Auth error codes for email/password authentication
 */
export const AUTH_ERROR_CODES = {
    EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
    INVALID_EMAIL: 'auth/invalid-email',
    OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
    WEAK_PASSWORD: 'auth/weak-password',
    USER_DISABLED: 'auth/user-disabled',
    USER_NOT_FOUND: 'auth/user-not-found',
    WRONG_PASSWORD: 'auth/wrong-password',
    TOO_MANY_REQUESTS: 'auth/too-many-requests',
    NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
    INTERNAL_ERROR: 'auth/internal-error'
} as const;

/**
 * Get user-friendly error message from Firebase Auth error
 * @param error - Firebase AuthError
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(error: AuthError): string {
    switch (error.code) {
        case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
            return 'An account with this email address already exists. Please sign in instead.';
        case AUTH_ERROR_CODES.INVALID_EMAIL:
            return 'Please enter a valid email address.';
        case AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED:
            return 'Email/password authentication is not enabled. Please contact support.';
        case AUTH_ERROR_CODES.WEAK_PASSWORD:
            return 'Password is too weak. Please choose a stronger password.';
        case AUTH_ERROR_CODES.USER_DISABLED:
            return 'This account has been disabled. Please contact support.';
        case AUTH_ERROR_CODES.USER_NOT_FOUND:
            return 'No account found with this email address. Please check your email or sign up.';
        case AUTH_ERROR_CODES.WRONG_PASSWORD:
            return 'Incorrect password. Please try again.';
        case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
            return 'Too many failed attempts. Please try again later.';
        case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
            return 'Network error. Please check your connection and try again.';
        case AUTH_ERROR_CODES.INTERNAL_ERROR:
            return 'An internal error occurred. Please try again.';
        default:
            return 'An error occurred during authentication. Please try again.';
    }
}
    