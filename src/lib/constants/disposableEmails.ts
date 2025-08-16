/**
 * List of known disposable/temporary email domains to block during registration
 * This helps maintain user quality and reduce spam accounts
 */

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

/**
 * Check if an email domain is in the disposable email list
 * @param domain - The domain to check (e.g., 'example.com')
 * @returns true if the domain is disposable, false otherwise
 */
export function isDisposableEmailDomain(domain: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain.toLowerCase());
}