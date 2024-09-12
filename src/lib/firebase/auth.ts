import {
    type User,
    GoogleAuthProvider,
    OAuthProvider,
    onAuthStateChanged as _onAuthStateChanged,
    signInWithPopup
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
    return firebaseAuth.currentUser
}
    