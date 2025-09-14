/**
 * Authentication-related TypeScript interfaces and types
 */

// Email validation interfaces
export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  message?: string;
}

export interface DisposableEmailDomain {
  domain: string;
  blocked: boolean;
  reason?: string;
}

// Password validation interfaces
export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
  message?: string
}

// Authentication form interfaces
export interface EmailAuthFormProps {
  mode: 'signup' | 'login';
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  alternateAction: {
    text: string;
    linkText: string;
    href: string;
  };
}

// Authentication error types
export enum AuthErrorType {
  INVALID_EMAIL = 'invalid-email',
  WEAK_PASSWORD = 'weak-password',
  EMAIL_IN_USE = 'email-already-in-use',
  USER_NOT_FOUND = 'user-not-found',
  WRONG_PASSWORD = 'wrong-password',
  DISPOSABLE_EMAIL = 'disposable-email-blocked',
  NETWORK_ERROR = 'network-request-failed',
  TOO_MANY_REQUESTS = 'too-many-requests',
  INVALID_CREDENTIAL = 'invalid-credential'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  field?: 'email' | 'password';
}

// Authentication options interfaces
export interface GoogleAuthOptions {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  redirectUrl?: string;
}

export interface EmailAuthOptions {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  redirectUrl?: string;
}

// Authentication state interface
export interface AuthState {
  user: any | null; // Firebase User type
  loading: boolean;
  error?: string;
}

// Authentication configuration interfaces
export interface AuthConfig {
  minPasswordLength: number;
  maxPasswordLength: number;
  emailValidation: {
    enableDisposableCheck: boolean;
    cacheDisposableList: boolean;
    maxEmailLength: number;
  };
  session: {
    expirationDays: number;
    cookieOptions: {
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
  };
}

// Disposable email service configuration
export interface DisposableEmailServiceConfig {
  enabled: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in milliseconds
  fallbackToStaticList: boolean;
  apiEndpoint?: string;
  apiKey?: string;
}