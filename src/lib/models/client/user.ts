export type User = {
    _id?: any;
    uid: string,
    email: string,
    apps?: { store: 'ChromeExt' | 'GooglePlay' | 'AppleStore', url: string, id?: string }[],
    createdAt?: Date,
    updatedAt?: Date
}