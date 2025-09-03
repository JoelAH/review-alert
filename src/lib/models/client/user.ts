export type User = {
    _id?: any;
    uid: string,
    email: string,
    apps?: { store: 'ChromeExt' | 'GooglePlay' | 'AppleStore', url: string, appId?: string, appName?: string, _id?: any }[],
    createdAt?: Date,
    updatedAt?: Date
}