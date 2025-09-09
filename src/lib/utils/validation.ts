import mongoose from 'mongoose';

/**
 * Sanitize and validate MongoDB ObjectId
 * @param id - String to validate as ObjectId
 * @returns Valid ObjectId or null
 */
export function sanitizeObjectId(id: string): mongoose.Types.ObjectId | null {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * Validate platform with strict whitelist
 */
export const VALID_PLATFORMS = ['GooglePlay', 'AppleStore', 'ChromeExt'] as const;
export type ValidPlatform = typeof VALID_PLATFORMS[number];

export function isValidPlatform(platform: string): platform is ValidPlatform {
  return VALID_PLATFORMS.includes(platform as ValidPlatform);
}

/**
 * Validate and sanitize query parameters
 */
export interface QueryValidationOptions {
  maxLength?: number;
  allowedValues?: string[];
  isNumeric?: boolean;
  min?: number;
  max?: number;
}

export function validateQueryParam(
  value: string | null, 
  options: QueryValidationOptions = {}
): { isValid: boolean; sanitized: string | null; error?: string } {
  if (!value) {
    return { isValid: true, sanitized: null };
  }

  const { maxLength = 100, allowedValues, isNumeric, min, max } = options;

  // Check length
  if (value.length > maxLength) {
    return { isValid: false, sanitized: null, error: 'Parameter too long' };
  }

  // Check allowed values
  if (allowedValues && !allowedValues.includes(value)) {
    return { isValid: false, sanitized: null, error: 'Invalid parameter value' };
  }

  // Check numeric constraints
  if (isNumeric) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return { isValid: false, sanitized: null, error: 'Parameter must be numeric' };
    }
    if (min !== undefined && num < min) {
      return { isValid: false, sanitized: null, error: `Parameter must be at least ${min}` };
    }
    if (max !== undefined && num > max) {
      return { isValid: false, sanitized: null, error: `Parameter must be at most ${max}` };
    }
    return { isValid: true, sanitized: num.toString() };
  }

  // Basic sanitization - remove potentially dangerous characters
  const sanitized = value.replace(/[<>'"&]/g, '');
  
  return { isValid: true, sanitized };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: string | null, limit: string | null) {
  const pageValidation = validateQueryParam(page, { 
    isNumeric: true, 
    min: 1, 
    max: 10000 
  });
  
  const limitValidation = validateQueryParam(limit, { 
    isNumeric: true, 
    min: 1, 
    max: 100 
  });

  if (!pageValidation.isValid) {
    return { isValid: false, error: pageValidation.error };
  }
  
  if (!limitValidation.isValid) {
    return { isValid: false, error: limitValidation.error };
  }

  return {
    isValid: true,
    page: parseInt(pageValidation.sanitized || '1', 10),
    limit: parseInt(limitValidation.sanitized || '20', 10)
  };
}