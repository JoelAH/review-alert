import { authConfig } from '@/lib/config/auth';
import type { PasswordValidationResult } from '@/types/auth';

/**
 * Password strength criteria
 */
export interface PasswordCriteria {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Default password criteria based on Firebase Auth requirements and security best practices
 */
export const DEFAULT_PASSWORD_CRITERIA: PasswordCriteria = {
  minLength: authConfig.minPasswordLength, // From configuration
  requireUppercase: false, // Not required by Firebase, but recommended
  requireLowercase: false, // Not required by Firebase, but recommended
  requireNumbers: false, // Not required by Firebase, but recommended
  requireSpecialChars: false // Not required by Firebase, but recommended
};

/**
 * Validates password strength based on specified criteria
 * @param password - The password to validate
 * @param criteria - Password criteria to check against (optional, uses defaults)
 * @returns PasswordValidationResult with validation details
 */
export function validatePassword(
  password: string, 
  criteria: PasswordCriteria = DEFAULT_PASSWORD_CRITERIA
): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check if password is empty
  if (!password) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'Password is required',
      errors: ['Password is required']
    };
  }

  // Check minimum length
  if (password.length < criteria.minLength) {
    errors.push(`Password must be at least ${criteria.minLength} characters long`);
  }

  // Check maximum length (from configuration)
  if (password.length > authConfig.maxPasswordLength) {
    errors.push(`Password must be no more than ${authConfig.maxPasswordLength} characters long`);
  }

  // Check for uppercase letters
  if (criteria.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (criteria.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (criteria.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (criteria.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password);
  
  // Determine if password is valid (meets minimum requirements)
  const isValid = errors.length === 0;
  
  return {
    isValid,
    strength,
    message: isValid ? undefined : errors[0], // Return first error as main message
    errors
  };
}

/**
 * Calculates password strength based on various factors
 * @param password - The password to analyze
 * @returns Password strength level
 */
export function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  
  // Length scoring (more conservative)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/\d/.test(password)) score += 1; // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1; // special chars
  
  // Pattern complexity (penalties)
  if (/(.)\1{2,}/.test(password)) score -= 1; // penalize repeated characters (3+ times)
  if (/^(.{1,3})\1+$/.test(password)) score -= 2; // heavily penalize simple repeated patterns
  
  // Ensure minimum score of 0
  score = Math.max(0, score);
  
  // Determine strength based on score (more conservative thresholds)
  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'strong';
  return 'strong';
}

/**
 * Checks if password meets Firebase Auth minimum requirements
 * @param password - The password to check
 * @returns true if password meets Firebase requirements
 */
export function meetsFirebaseRequirements(password: string): boolean {
  return password.length >= 6; // Firebase minimum is 6 characters
}

/**
 * Gets password strength color for UI display
 * @param strength - Password strength level
 * @returns CSS color value
 */
export function getPasswordStrengthColor(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return '#f44336'; // red
    case 'fair':
      return '#ff9800'; // orange
    case 'good':
      return '#2196f3'; // blue
    case 'strong':
      return '#4caf50'; // green
    default:
      return '#757575'; // gray
  }
}

/**
 * Gets password strength text for UI display
 * @param strength - Password strength level
 * @returns Human-readable strength description
 */
export function getPasswordStrengthText(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}