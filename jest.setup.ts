import '@testing-library/jest-dom'

// Set up environment variables for testing
process.env.EMAIL_DISPOSABLE_CHECK_ENABLED = 'true';
process.env.EMAIL_DISPOSABLE_CACHE_ENABLED = 'true';
process.env.EMAIL_DISPOSABLE_CACHE_TTL = '86400000';
process.env.EMAIL_MAX_LENGTH = '254';
process.env.AUTH_MIN_PASSWORD_LENGTH = '8';
process.env.AUTH_MAX_PASSWORD_LENGTH = '128';
process.env.AUTH_SESSION_EXPIRATION_DAYS = '5';