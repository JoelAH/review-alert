import { DISPOSABLE_EMAIL_DOMAINS, isDisposableEmailDomain } from '../disposableEmails';

describe('disposableEmails', () => {
  describe('DISPOSABLE_EMAIL_DOMAINS', () => {
    it('should contain known disposable email domains', () => {
      const knownDisposableDomains = [
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
        'tempmail.org',
        'yopmail.com',
        'trashmail.com'
      ];

      knownDisposableDomains.forEach(domain => {
        expect(DISPOSABLE_EMAIL_DOMAINS).toContain(domain);
      });
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(DISPOSABLE_EMAIL_DOMAINS)).toBe(true);
      expect(DISPOSABLE_EMAIL_DOMAINS.length).toBeGreaterThan(0);
      
      DISPOSABLE_EMAIL_DOMAINS.forEach(domain => {
        expect(typeof domain).toBe('string');
        expect(domain.length).toBeGreaterThan(0);
      });
    });

    it('should contain domains in lowercase', () => {
      DISPOSABLE_EMAIL_DOMAINS.forEach(domain => {
        expect(domain).toBe(domain.toLowerCase());
      });
    });

    it('should not contain duplicate domains', () => {
      const uniqueDomains = [...new Set(DISPOSABLE_EMAIL_DOMAINS)];
      expect(uniqueDomains.length).toBe(DISPOSABLE_EMAIL_DOMAINS.length);
    });

    it('should contain valid domain formats', () => {
      const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
      
      DISPOSABLE_EMAIL_DOMAINS.forEach(domain => {
        expect(domainRegex.test(domain)).toBe(true);
      });
    });
  });

  describe('isDisposableEmailDomain', () => {
    it('should return true for known disposable domains', () => {
      const disposableDomains = [
        'mailinator.com',
        'guerrillamail.com',
        '10minutemail.com',
        'tempmail.org',
        'yopmail.com'
      ];

      disposableDomains.forEach(domain => {
        expect(isDisposableEmailDomain(domain)).toBe(true);
      });
    });

    it('should return false for legitimate email domains', () => {
      const legitimateDomains = [
        'gmail.com',
        'yahoo.com',
        'outlook.com',
        'hotmail.com',
        'company.com',
        'university.edu',
        'government.gov'
      ];

      legitimateDomains.forEach(domain => {
        expect(isDisposableEmailDomain(domain)).toBe(false);
      });
    });

    it('should handle case insensitive domain checking', () => {
      expect(isDisposableEmailDomain('MAILINATOR.COM')).toBe(true);
      expect(isDisposableEmailDomain('Mailinator.Com')).toBe(true);
      expect(isDisposableEmailDomain('mailinator.com')).toBe(true);
    });

    it('should return false for empty or invalid domains', () => {
      expect(isDisposableEmailDomain('')).toBe(false);
      expect(isDisposableEmailDomain(' ')).toBe(false);
      expect(isDisposableEmailDomain('invalid-domain')).toBe(false);
    });

    it('should handle domains with mixed case correctly', () => {
      // Test with a known disposable domain in mixed case
      expect(isDisposableEmailDomain('TempMail.Org')).toBe(true);
      expect(isDisposableEmailDomain('GUERRILLAMAIL.COM')).toBe(true);
    });
  });
});