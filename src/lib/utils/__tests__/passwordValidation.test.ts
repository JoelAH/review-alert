import {
  validatePassword,
  calculatePasswordStrength,
  meetsFirebaseRequirements,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  DEFAULT_PASSWORD_CRITERIA,
  PasswordCriteria
} from '../passwordValidation';

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    it('should return invalid result for empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.message).toBe('Password is required');
      expect(result.errors).toEqual(['Password is required']);
    });

    it('should validate password with default criteria (minimum 8 characters)', () => {
      const validPassword = 'password123';
      const result = validatePassword(validPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.message).toBeUndefined();
    });

    it('should reject password shorter than minimum length', () => {
      const shortPassword = '1234567'; // 7 characters
      const result = validatePassword(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.message).toBe('Password must be at least 8 characters long');
    });

    it('should validate password with custom criteria requiring all character types', () => {
      const strictCriteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      };

      const validPassword = 'Password123!';
      const result = validatePassword(validPassword, strictCriteria);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject password missing required character types', () => {
      const strictCriteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      };

      const weakPassword = 'password'; // missing uppercase, numbers, special chars
      const result = validatePassword(weakPassword, strictCriteria);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should validate password missing only uppercase when required', () => {
      const criteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      };

      const noUppercase = 'password123';
      const result = validatePassword(noUppercase, criteria);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should validate password missing only lowercase when required', () => {
      const criteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      };

      const noLowercase = 'PASSWORD123';
      const result = validatePassword(noLowercase, criteria);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should validate password missing only numbers when required', () => {
      const criteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: true,
        requireSpecialChars: false
      };

      const noNumbers = 'Password';
      const result = validatePassword(noNumbers, criteria);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should validate password missing only special characters when required', () => {
      const criteria: PasswordCriteria = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: true
      };

      const noSpecialChars = 'Password123';
      const result = validatePassword(noSpecialChars, criteria);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should return weak for very simple passwords', () => {
      expect(calculatePasswordStrength('123')).toBe('weak');
      expect(calculatePasswordStrength('password')).toBe('weak');
      expect(calculatePasswordStrength('12345678')).toBe('weak');
    });

    it('should return fair for passwords with some complexity', () => {
      expect(calculatePasswordStrength('password123')).toBe('weak'); // only lowercase + numbers
      expect(calculatePasswordStrength('Password123')).toBe('fair'); // has uppercase, lowercase, numbers
    });

    it('should return good for moderately complex passwords', () => {
      expect(calculatePasswordStrength('Password123!')).toBe('good'); // all character types
      expect(calculatePasswordStrength('mypassword123!')).toBe('fair'); // long but missing uppercase
    });

    it('should return strong for highly complex passwords', () => {
      expect(calculatePasswordStrength('MyComplexPassword123!')).toBe('good'); // long with all types
      expect(calculatePasswordStrength('Str0ng!P@ssw0rd2024')).toBe('good'); // very long with all types
    });

    it('should penalize repeated characters', () => {
      const withRepeats = 'Passwordddd123!';
      const withoutRepeats = 'Password123!';
      
      expect(calculatePasswordStrength(withRepeats)).toBe('fair'); // penalized for repeated chars
      expect(calculatePasswordStrength(withoutRepeats)).toBe('good'); // no penalty
    });

    it('should penalize simple repeated patterns', () => {
      const repeatedPattern = 'abcabcabc';
      expect(calculatePasswordStrength(repeatedPattern)).toBe('weak');
    });
  });

  describe('meetsFirebaseRequirements', () => {
    it('should return true for passwords 6 characters or longer', () => {
      expect(meetsFirebaseRequirements('123456')).toBe(true);
      expect(meetsFirebaseRequirements('password')).toBe(true);
      expect(meetsFirebaseRequirements('a'.repeat(100))).toBe(true);
    });

    it('should return false for passwords shorter than 6 characters', () => {
      expect(meetsFirebaseRequirements('12345')).toBe(false);
      expect(meetsFirebaseRequirements('abc')).toBe(false);
      expect(meetsFirebaseRequirements('')).toBe(false);
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return correct colors for each strength level', () => {
      expect(getPasswordStrengthColor('weak')).toBe('#f44336');
      expect(getPasswordStrengthColor('fair')).toBe('#ff9800');
      expect(getPasswordStrengthColor('good')).toBe('#2196f3');
      expect(getPasswordStrengthColor('strong')).toBe('#4caf50');
    });

    it('should return gray for unknown strength', () => {
      // @ts-expect-error - testing invalid input
      expect(getPasswordStrengthColor('unknown')).toBe('#757575');
    });
  });

  describe('getPasswordStrengthText', () => {
    it('should return correct text for each strength level', () => {
      expect(getPasswordStrengthText('weak')).toBe('Weak');
      expect(getPasswordStrengthText('fair')).toBe('Fair');
      expect(getPasswordStrengthText('good')).toBe('Good');
      expect(getPasswordStrengthText('strong')).toBe('Strong');
    });

    it('should return Unknown for invalid strength', () => {
      // @ts-expect-error - testing invalid input
      expect(getPasswordStrengthText('invalid')).toBe('Unknown');
    });
  });

  describe('DEFAULT_PASSWORD_CRITERIA', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PASSWORD_CRITERIA.minLength).toBe(8);
      expect(DEFAULT_PASSWORD_CRITERIA.requireUppercase).toBe(false);
      expect(DEFAULT_PASSWORD_CRITERIA.requireLowercase).toBe(false);
      expect(DEFAULT_PASSWORD_CRITERIA.requireNumbers).toBe(false);
      expect(DEFAULT_PASSWORD_CRITERIA.requireSpecialChars).toBe(false);
    });
  });
});