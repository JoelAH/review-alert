import { GamificationData } from "@/types/gamification";

export type User = {
    _id?: any;
    uid: string,
    email: string,
    apps?: { store: 'ChromeExt' | 'GooglePlay' | 'AppleStore', url: string, appId?: string, appName?: string, _id?: any }[],
    gamification?: GamificationData,
    createdAt?: Date,
    updatedAt?: Date
}