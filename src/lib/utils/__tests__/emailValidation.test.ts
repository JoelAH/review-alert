import { 
  validateEmail, 
  isValidEmailFormat, 
  extractEmailDomain
} from '../emailValidation';

describe('emailValidation', () => {
  describe('validateEmail', () => {
    it('should return valid result for legitimate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@company.co.uk',
        'firstname.lastname@subdomain.example.com',
        'user123@test-domain.net'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.isDisposable).toBe(false);
        expect(result.message).toBeUndefined();
      });
    });

    it('should reject empty or whitespace-only emails', () => {
      const emptyEmails = ['', '   ', '\t', '\n'];

      emptyEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.isDisposable).toBe(false);
        expect(result.message).toBe('Email address is required');
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user@.domain.com',
        'user@domain..com',
        'user name@domain.com', // space in local part
        'user@domain .com' // space in domain
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.isDisposable).toBe(false);
        expect(result.message).toBe('Please enter a valid email address');
      });
    });

    it('should reject disposable email domains', () => {
      const disposableEmails = [
        'user@10minutemail.com',
        'test@guerrillamail.com',
        'temp@mailinator.com',
        'user@yopmail.com',
        'test@tempmail.org'
      ];

      disposableEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.isDisposable).toBe(true);
        expect(result.message).toBe('Temporary or disposable email addresses are not allowed. Please use a permanent email address.');
      });
    });

    it('should handle case insensitive email validation', () => {
      const result1 = validateEmail('USER@EXAMPLE.COM');
      const result2 = validateEmail('user@example.com');
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result1.isDisposable).toBe(false);
      expect(result2.isDisposable).toBe(false);
    });

    it('should trim whitespace from emails', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
      expect(result.isDisposable).toBe(false);
    });

    it('should detect disposable domains case insensitively', () => {
      const result = validateEmail('user@MAILINATOR.COM');
      expect(result.isValid).toBe(false);
      expect(result.isDisposable).toBe(true);
    });
  });

  describe('isValidEmailFormat', () => {
    it('should return true for valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@company.co.uk',
        'firstname.lastname@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        expect(isValidEmailFormat(email)).toBe(true);
      });
    });

    it('should return false for invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmailFormat(email)).toBe(false);
      });
    });

    it('should handle whitespace trimming', () => {
      expect(isValidEmailFormat('  user@example.com  ')).toBe(true);
      expect(isValidEmailFormat('  invalid-email  ')).toBe(false);
    });
  });

  describe('extractEmailDomain', () => {
    it('should extract domain from valid emails', () => {
      expect(extractEmailDomain('user@example.com')).toBe('example.com');
      expect(extractEmailDomain('test@subdomain.domain.org')).toBe('subdomain.domain.org');
      expect(extractEmailDomain('user+tag@company.co.uk')).toBe('company.co.uk');
    });

    it('should return empty string for invalid emails', () => {
      expect(extractEmailDomain('invalid-email')).toBe('');
      expect(extractEmailDomain('@domain.com')).toBe('');
      expect(extractEmailDomain('user@')).toBe('');
      expect(extractEmailDomain('')).toBe('');
    });

    it('should handle case conversion and whitespace', () => {
      expect(extractEmailDomain('  USER@EXAMPLE.COM  ')).toBe('example.com');
    });

    it('should handle emails with multiple @ symbols correctly', () => {
      // Should return empty string for malformed emails
      expect(extractEmailDomain('user@@domain.com')).toBe('');
      expect(extractEmailDomain('user@domain@com')).toBe('');
    });
  });
});