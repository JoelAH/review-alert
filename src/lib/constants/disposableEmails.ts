/**
 * List of known disposable/temporary email domains to block during registration
 * This helps maintain user quality and reduce spam accounts
 */

import { disposableEmailConfig } from '@/lib/config/auth';
import type { DisposableEmailDomain } from '@/types/auth';

// Raw list of disposable domains (may contain duplicates)
const DISPOSABLE_DOMAINS_RAW = [
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  '2prong.com',
  '33mail.com',
  '3d-painting.com',
  '7tags.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'tempmail.org',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'dispostable.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'spamhole.com',
  'spamex.com',
  'spamfree24.org',
  'spamfree24.de',
  'spamfree24.eu',
  'spamfree24.net',
  'spamfree24.com',
  'e4ward.com',
  'fakemail.fr',
  'antispam.de',
  'pookmail.com',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'trashmail.org',
  'trashmail.ws',
  'trashinbox.com',
  'trashymail.com',
  'mytrashmail.com',
  'tempinbox.com',
  'tempmail.it',
  'tempmail.de',
  'tempmail.eu',
  'tempmail2.com',
  'tempmailer.com',
  'tempmailer.de',
  'tempmailaddress.com',
  'tempemail.com',
  'tempemail.net',
  'tempr.email',
  'tempsky.com',
  'tempymail.com',
  'mytempemail.com'
];

// Export deduplicated and sorted list
export const DISPOSABLE_EMAIL_DOMAINS = Array.from(new Set(DISPOSABLE_DOMAINS_RAW)).sort();

// Convert to structured format
export const DISPOSABLE_EMAIL_DOMAINS_STRUCTURED: DisposableEmailDomain[] = DISPOSABLE_EMAIL_DOMAINS.map(domain => ({
  domain,
  blocked: true,
  reason: 'Disposable email service'
}));

// Cache for external API results (if enabled)
let disposableDomainsCache: Map<string, { result: boolean; timestamp: number }> | null = null;

/**
 * Initialize cache if caching is enabled
 */
function initializeCache(): void {
  if (disposableEmailConfig.cacheEnabled && !disposableDomainsCache) {
    disposableDomainsCache = new Map();
  }
}

/**
 * Check cache for domain result
 */
function getCachedResult(domain: string): boolean | null {
  if (!disposableEmailConfig.cacheEnabled || !disposableDomainsCache) {
    return null;
  }

  const cached = disposableDomainsCache.get(domain);
  if (!cached) {
    return null;
  }

  // Check if cache entry is still valid
  const now = Date.now();
  if (now - cached.timestamp > disposableEmailConfig.cacheTTL) {
    disposableDomainsCache.delete(domain);
    return null;
  }

  return cached.result;
}

/**
 * Cache domain result
 */
function setCachedResult(domain: string, result: boolean): void {
  if (!disposableEmailConfig.cacheEnabled || !disposableDomainsCache) {
    return;
  }

  disposableDomainsCache.set(domain, {
    result,
    timestamp: Date.now()
  });
}

/**
 * Check if an email domain is in the disposable email list
 * @param domain - The domain to check (e.g., 'example.com')
 * @returns true if the domain is disposable, false otherwise
 */
export function isDisposableEmailDomain(domain: string): boolean {
  if (!disposableEmailConfig.enabled) {
    return false;
  }

  const normalizedDomain = domain.toLowerCase();

  // Check static list first
  const isInStaticList = DISPOSABLE_EMAIL_DOMAINS.includes(normalizedDomain);
  
  if (isInStaticList) {
    return true;
  }

  // If external API is configured, check cache
  if (disposableEmailConfig.apiEndpoint) {
    initializeCache();
    const cachedResult = getCachedResult(normalizedDomain);
    if (cachedResult !== null) {
      return cachedResult;
    }
  }

  return false;
}

/**
 * Check if an email domain is disposable using external API (async)
 * Falls back to static list if API fails
 * @param domain - The domain to check
 * @returns Promise<boolean> - true if disposable, false otherwise
 */
export async function isDisposableEmailDomainAsync(domain: string): Promise<boolean> {
  if (!disposableEmailConfig.enabled) {
    return false;
  }

  const normalizedDomain = domain.toLowerCase();

  // Check static list first
  const isInStaticList = DISPOSABLE_EMAIL_DOMAINS.includes(normalizedDomain);
  
  if (isInStaticList) {
    return true;
  }

  // If no external API configured, return static result
  if (!disposableEmailConfig.apiEndpoint) {
    return false;
  }

  // Check cache
  initializeCache();
  const cachedResult = getCachedResult(normalizedDomain);
  if (cachedResult !== null) {
    return cachedResult;
  }

  // Make API call (implementation would depend on specific API)
  try {
    // This is a placeholder - actual implementation would depend on the chosen API
    // For now, we'll just return the static list result
    const result = false; // Would be replaced with actual API call
    
    // Cache the result
    setCachedResult(normalizedDomain, result);
    
    return result;
  } catch (error) {
    console.warn('Failed to check disposable email via API, falling back to static list:', error);
    
    // Fallback to static list
    if (disposableEmailConfig.fallbackToStaticList) {
      return isInStaticList;
    }
    
    return false;
  }
}