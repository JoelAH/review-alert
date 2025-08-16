import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { AuthError as FirebaseAuthError } from 'firebase/auth';
import { 
  getEnhancedAuthError, 
  logAuthAttempt, 
  type EnhancedAuthError
} from './authErrorHandler';
import { withAuthRetry, withNetworkRetry } from './retryHandler';

export interface AuthError {
  message: string;
  code?: string;
}

export interface GoogleAuthOptions {
  onSuccess?: () => void;
  onError?: (error: EnhancedAuthError) => void;
  redirectTo?: string;
  enableRetry?: boolean;
}

export interface EmailAuthOptions {
  onSuccess?: () => void;
  onError?: (error: EnhancedAuthError) => void;
  redirectTo?: string;
  enableRetry?: boolean;
}

/**
 * Create a Firebase Auth error object
 */
function createAuthError(code: string, message: string): FirebaseAuthError {
  return {
    code,
    message,
    name: 'FirebaseError'
  } as FirebaseAuthError;
}

/**
 * Handles Google OAuth sign-in flow with comprehensive error handling and retry logic
 * @param router - Next.js router instance for navigation
 * @param options - Configuration options for the auth flow
 */
export const handleGoogleSignIn = async (
  router: AppRouterInstance,
  options: GoogleAuthOptions = {}
) => {
  const { onSuccess, onError, redirectTo = '/dashboard', enableRetry = true } = options;

  const performSignIn = async () => {
    // Dynamic import to avoid issues in test environment
    const { signInWithGoogle } = await import('@/lib/firebase/auth');
    const { signInToServer } = await import('@/lib/services/auth');
    
    const userCred = await signInWithGoogle();
    
    if (!userCred?.user) {
      throw createAuthError('auth/no-user', 'Authentication failed. Please try again.');
    }

    await signInToServer(userCred.user);
    return userCred;
  };

  try {
    const operation = enableRetry 
      ? () => withNetworkRetry(performSignIn, {}, { action: 'login' })
      : performSignIn;
    
    await operation();
    
    // Log successful authentication
    logAuthAttempt({
      timestamp: new Date(),
      action: 'login',
      success: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onSuccess?.();
    router.replace(redirectTo);
  } catch (e: any) {
    const enhancedError = getEnhancedAuthError(e);
    
    // Log failed authentication
    logAuthAttempt({
      timestamp: new Date(),
      action: 'login',
      success: false,
      errorCode: enhancedError.code,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onError?.(enhancedError);
  }
};

/**
 * Handles email/password sign-up flow with comprehensive error handling
 * @param email - User's email address
 * @param password - User's password
 * @param router - Next.js router instance for navigation
 * @param options - Configuration options for the auth flow
 */
export const handleEmailSignUp = async (
  email: string,
  password: string,
  router: AppRouterInstance,
  options: EmailAuthOptions = {}
) => {
  const { onSuccess, onError, redirectTo = '/dashboard', enableRetry = true } = options;

  const performSignUp = async () => {
    const { signUpWithEmail } = await import('@/lib/firebase/auth');
    const { signInToServer } = await import('@/lib/services/auth');
    
    const userCred = await signUpWithEmail(email, password);
    
    if (!userCred?.user) {
      throw createAuthError('auth/no-user', 'Account creation failed. Please try again.');
    }

    await signInToServer(userCred.user);
    return userCred;
  };

  try {
    const operation = enableRetry 
      ? () => withAuthRetry(performSignUp, 'signup', email)
      : performSignUp;
    
    await operation();
    
    // Log successful signup
    logAuthAttempt({
      timestamp: new Date(),
      action: 'signup',
      email,
      success: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onSuccess?.();
    router.replace(redirectTo);
  } catch (e: any) {
    const enhancedError = getEnhancedAuthError(e);
    
    // Log failed signup
    logAuthAttempt({
      timestamp: new Date(),
      action: 'signup',
      email,
      success: false,
      errorCode: enhancedError.code,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onError?.(enhancedError);
  }
};

/**
 * Handles email/password sign-in flow with comprehensive error handling
 * @param email - User's email address
 * @param password - User's password
 * @param router - Next.js router instance for navigation
 * @param options - Configuration options for the auth flow
 */
export const handleEmailSignIn = async (
  email: string,
  password: string,
  router: AppRouterInstance,
  options: EmailAuthOptions = {}
) => {
  const { onSuccess, onError, redirectTo = '/dashboard', enableRetry = true } = options;

  const performSignIn = async () => {
    const { signInWithEmail } = await import('@/lib/firebase/auth');
    const { signInToServer } = await import('@/lib/services/auth');
    
    const userCred = await signInWithEmail(email, password);
    
    if (!userCred?.user) {
      throw createAuthError('auth/no-user', 'Authentication failed. Please try again.');
    }

    await signInToServer(userCred.user);
    return userCred;
  };

  try {
    const operation = enableRetry 
      ? () => withAuthRetry(performSignIn, 'login', email)
      : performSignIn;
    
    await operation();
    
    // Log successful login
    logAuthAttempt({
      timestamp: new Date(),
      action: 'login',
      email,
      success: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onSuccess?.();
    router.replace(redirectTo);
  } catch (e: any) {
    const enhancedError = getEnhancedAuthError(e);
    
    // Log failed login
    logAuthAttempt({
      timestamp: new Date(),
      action: 'login',
      email,
      success: false,
      errorCode: enhancedError.code,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
    
    onError?.(enhancedError);
  }
};

/**
 * Enhanced error handler for authentication flows with actionable guidance
 * @param error - The enhanced authentication error
 * @param setErrors - State setter function for error messages
 * @param onAction - Optional callback for error action buttons
 */
export const handleAuthError = (
  error: EnhancedAuthError,
  setErrors: (error: string) => void,
  onAction?: (action: () => void) => void
) => {
  setErrors(error.userMessage);
  
  // If error has an actionable handler and callback is provided
  if (error.action && onAction) {
    onAction(error.action.handler);
  }
};

/**
 * Legacy error handler for backward compatibility
 * @deprecated Use handleAuthError with EnhancedAuthError instead
 */
export const handleLegacyAuthError = (
  error: AuthError,
  setErrors: (error: string) => void
) => {
  const enhancedError = getEnhancedAuthError(error as any);
  setErrors(enhancedError.userMessage);
};