import { isDisposableEmailDomain, isDisposableEmailDomainAsync } from '@/lib/constants/disposableEmails';
import { authConfig } from '@/lib/config/auth';
import type { EmailValidationResult } from '@/types/auth';

/**
 * Email regex pattern that requires a TLD (more restrictive than RFC 5322)
 * This pattern validates email addresses with proper domain structure including TLD
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email format and checks for disposable email domains
 * @param email - The email address to validate
 * @returns EmailValidationResult with validation details
 */
export function validateEmail(email: string): EmailValidationResult {
  // Trim whitespace and convert to lowercase for consistent processing
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check if email is empty
  if (!trimmedEmail) {
    return {
      isValid: false,
      isDisposable: false,
      message: 'Email address is required'
    };
  }

  // Check email length against configuration
  if (trimmedEmail.length > authConfig.emailValidation.maxEmailLength) {
    return {
      isValid: false,
      isDisposable: false,
      message: `Email address is too long (maximum ${authConfig.emailValidation.maxEmailLength} characters)`
    };
  }

  // Check email format using regex
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      isDisposable: false,
      message: 'Please enter a valid email address'
    };
  }

  // Extract domain from email
  const domain = trimmedEmail.split('@')[1];
  
  // Check if domain is disposable (only if enabled in config)
  if (authConfig.emailValidation.enableDisposableCheck) {
    const isDisposable = isDisposableEmailDomain(domain);
    
    if (isDisposable) {
      return {
        isValid: false,
        isDisposable: true,
        message: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.'
      };
    }
  }

  // Email is valid and not disposable
  return {
    isValid: true,
    isDisposable: false
  };
}

/**
 * Async version of email validation that can use external APIs
 * @param email - The email address to validate
 * @returns Promise<EmailValidationResult> with validation details
 */
export async function validateEmailAsync(email: string): Promise<EmailValidationResult> {
  // Trim whitespace and convert to lowercase for consistent processing
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check if email is empty
  if (!trimmedEmail) {
    return {
      isValid: false,
      isDisposable: false,
      message: 'Email address is required'
    };
  }

  // Check email length against configuration
  if (trimmedEmail.length > authConfig.emailValidation.maxEmailLength) {
    return {
      isValid: false,
      isDisposable: false,
      message: `Email address is too long (maximum ${authConfig.emailValidation.maxEmailLength} characters)`
    };
  }

  // Check email format using regex
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      isDisposable: false,
      message: 'Please enter a valid email address'
    };
  }

  // Extract domain from email
  const domain = trimmedEmail.split('@')[1];
  
  // Check if domain is disposable (only if enabled in config)
  if (authConfig.emailValidation.enableDisposableCheck) {
    const isDisposable = await isDisposableEmailDomainAsync(domain);
    
    if (isDisposable) {
      return {
        isValid: false,
        isDisposable: true,
        message: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.'
      };
    }
  }

  // Email is valid and not disposable
  return {
    isValid: true,
    isDisposable: false
  };
}

/**
 * Simple email format validation without disposable domain check
 * @param email - The email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmedEmail = email.trim();
  return EMAIL_REGEX.test(trimmedEmail);
}

/**
 * Extract domain from email address
 * @param email - The email address
 * @returns the domain part of the email or empty string if invalid
 */
export function extractEmailDomain(email: string): string {
  const trimmedEmail = email.trim().toLowerCase();
  
  // First check if it's a valid email format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return '';
  }
  
  const parts = trimmedEmail.split('@');
  return parts.length === 2 ? parts[1] : '';
}