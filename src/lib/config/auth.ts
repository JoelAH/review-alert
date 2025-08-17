/**
 * Authentication configuration utilities
 */

import type { AuthConfig, DisposableEmailServiceConfig } from '@/types/auth';

/**
 * Get authentication configuration from environment variables
 */
export function getAuthConfig(): AuthConfig {
  return {
    minPasswordLength: parseInt(process.env.AUTH_MIN_PASSWORD_LENGTH || '8', 10),
    maxPasswordLength: parseInt(process.env.AUTH_MAX_PASSWORD_LENGTH || '128', 10),
    emailValidation: {
      enableDisposableCheck: process.env.EMAIL_DISPOSABLE_CHECK_ENABLED === 'true',
      cacheDisposableList: process.env.EMAIL_DISPOSABLE_CACHE_ENABLED === 'true',
      maxEmailLength: parseInt(process.env.EMAIL_MAX_LENGTH || '254', 10)
    },
    session: {
      expirationDays: parseInt(process.env.AUTH_SESSION_EXPIRATION_DAYS || '5', 10),
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
      }
    }
  };
}

/**
 * Get disposable email service configuration
 */
export function getDisposableEmailServiceConfig(): DisposableEmailServiceConfig {
  return {
    enabled: process.env.EMAIL_DISPOSABLE_CHECK_ENABLED === 'true',
    cacheEnabled: process.env.EMAIL_DISPOSABLE_CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.EMAIL_DISPOSABLE_CACHE_TTL || '86400000', 10), // 24 hours default
    fallbackToStaticList: true,
    apiEndpoint: process.env.EMAIL_DISPOSABLE_API_ENDPOINT || undefined,
    apiKey: process.env.EMAIL_DISPOSABLE_API_KEY || undefined
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(config: AuthConfig): boolean {
  if (config.minPasswordLength < 1 || config.minPasswordLength > config.maxPasswordLength) {
    console.error('Invalid password length configuration');
    return false;
  }

  if (config.emailValidation.maxEmailLength < 1 || config.emailValidation.maxEmailLength > 320) {
    console.error('Invalid email length configuration');
    return false;
  }

  if (config.session.expirationDays < 1 || config.session.expirationDays > 365) {
    console.error('Invalid session expiration configuration');
    return false;
  }

  return true;
}

// Export default configuration instance
export const authConfig = getAuthConfig();
export const disposableEmailConfig = getDisposableEmailServiceConfig();

// Validate configuration on module load
if (!validateAuthConfig(authConfig)) {
  throw new Error('Invalid authentication configuration');
}