import { authConfig } from '@/lib/config/auth';

const CONSTANTS = {
    appName: 'ReviewQuest',
    sessionCookieName: 'app_review_session',
    maxPasswordLength: 6, // Legacy - kept for backward compatibility
    // Email authentication constants
    auth: authConfig,
    errors: {
        defaultMessage: 'Error. Something went wrong.',
        firebase: {
            EMAIL_USED: 'auth/email-already-in-use',
            INVALID_CREDENTIAL: 'auth/invalid-credential',
            WRONG_PASSWORD: 'auth/wrong-password',
            EMAIL_NOT_FOUND: 'auth/user-not-found',
            WEAK_PASSWORD: 'auth/weak-password',
            INVALID_EMAIL: 'auth/invalid-email',
            NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
            TOO_MANY_REQUESTS: 'auth/too-many-requests'
        },
        validation: {
            DISPOSABLE_EMAIL: 'disposable-email-blocked',
            INVALID_EMAIL_FORMAT: 'invalid-email-format',
            PASSWORD_TOO_SHORT: 'password-too-short',
            PASSWORD_TOO_LONG: 'password-too-long'
        }
    }
}

export default CONSTANTS;