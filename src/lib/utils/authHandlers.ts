import CONSTANTS from '@/lib/constants';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface AuthError {
  message: string;
  code?: string;
}

export interface GoogleAuthOptions {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  redirectTo?: string;
}

/**
 * Handles Google OAuth sign-in flow with consistent error handling
 * @param router - Next.js router instance for navigation
 * @param options - Configuration options for the auth flow
 */
export const handleGoogleSignIn = async (
  router: AppRouterInstance,
  options: GoogleAuthOptions = {}
) => {
  const { onSuccess, onError, redirectTo = '/dashboard' } = options;

  try {
    // Dynamic import to avoid issues in test environment
    const { signInWithGoogle } = await import('@/lib/firebase/auth');
    const { signInToServer } = await import('@/lib/services/auth');
    
    const userCred = await signInWithGoogle();
    
    if (!userCred?.user) {
      const error: AuthError = {
        message: 'Authentication failed. Please try again.',
        code: 'auth/no-user'
      };
      onError?.(error);
      return;
    }

    await signInToServer(userCred.user);
    onSuccess?.();
    router.replace(redirectTo);
  } catch (e: any) {
    const error: AuthError = {
      message: e.code === CONSTANTS.errors.firebase.EMAIL_USED
        ? 'You have already signed up! Please log into your account.'
        : CONSTANTS.errors.defaultMessage,
      code: e.code
    };
    onError?.(error);
  }
};

/**
 * Common error handler for authentication flows
 * @param error - The authentication error
 * @param setErrors - State setter function for error messages
 */
export const handleAuthError = (
  error: AuthError,
  setErrors: (error: string) => void
) => {
  setErrors(error.message);
};