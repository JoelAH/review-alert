const CONSTANTS = {
    appName: 'App Review Alert',
    sessionCookieName: 'app_review_session',
    maxPasswordLength: 6,
    errors: {
        defaultMessage: 'Error. Something went wrong.',
        firebase: {
            EMAIL_USED: 'auth/email-already-in-use',
            INVALID_CREDENTIAL: 'auth/invalid-credential',
            WRONG_PASSWORD: 'auth/wrong-password',
            EMAIL_NOT_FOUND: 'auth/user-not-found'
        }
    }
}

export default CONSTANTS;