"use server";

import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { checkAuth } from "@/lib/services/middleware";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";

const URL_TEST = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

export async function onSaveApp(_prevState: any, formData: FormData): Promise<any> {
    const decoded = await checkAuth();
    if (!decoded) {
        redirect('/');
    }
    await dbConnect();

    const store = formData.get('store')?.toString()?.trim() as 'ChromeExt' | 'GooglePlay' | 'AppleStore';
    const url = formData.get('url')?.toString()?.trim();
    const appId = formData.get('appId')?.toString()?.trim();
    const appName = formData.get('appName')?.toString()?.trim();

    const errors: string[] = [];

    if (!store || !['ChromeExt', 'GooglePlay', 'AppleStore'].includes(store)) {
        errors.push('Invalid store type');
    }

    if (!url || !URL_TEST.test(url)) {
        errors.push('Please submit a valid URL');
    }

    if (!appName || appName.length < 1) {
        errors.push('Please provide an app name');
    }

    // Validate store-specific URL formats and extract appId
    let extractedAppId = '';
    if (url) {
        switch (store) {
            case 'GooglePlay':
                const googleAppId = new URL(url).searchParams.get('id');
                if (!googleAppId) {
                    errors.push('Please submit a valid Google Play Store URL with app ID');
                } else {
                    extractedAppId = googleAppId;
                }
                break;
            case 'AppleStore':
                const appleMatch = url.match(/id(\d+)/);
                if (!appleMatch) {
                    errors.push('Please submit a valid Apple App Store URL with app ID');
                } else {
                    extractedAppId = appleMatch[1];
                }
                break;
            case 'ChromeExt':
                const chromeAppId = url.split('/').pop();
                if (!chromeAppId) {
                    errors.push('Please submit a valid Chrome Web Store URL');
                } else {
                    extractedAppId = chromeAppId;
                }
                break;
        }
    }

    if (errors.length) {
        return { errors };
    }

    const user = await getUser(decoded.uid);
    if (!user) {
        return { errors: ['User not found. Please save your email first.'] };
    }

    let isUpdate = false;
    let savedApp;

    if (appId) {
        // Update existing app by ID
        const existingAppIndex = user.apps?.findIndex((app: any) => app._id.toString() === appId) ?? -1;

        if (existingAppIndex >= 0) {
            user.apps![existingAppIndex] = {
                store,
                url: url!,
                appId: extractedAppId,
                appName: appName!,
                _id: new Types.ObjectId(appId)
            };
            isUpdate = true;
        } else {
            return { errors: ['App not found for update'] };
        }
    } else {
        // Add new app
        if (!user.apps) user.apps = [];
        const newAppId = new Types.ObjectId();
        user.apps.push({
            store,
            url: url!,
            appId: extractedAppId,
            appName: appName!,
            _id: newAppId
        });
    }

    const saved = await user.save();

    // Find the saved app for triggering review update
    if (appId) {
        savedApp = saved.apps?.find((app: any) => app._id.toString() === appId);
    } else {
        // For new apps, find the most recently added one
        savedApp = saved.apps?.[saved.apps.length - 1];
    }

    // Award XP for adding a new app (not for updates)
    let xpResult = null;
    if (!isUpdate && savedApp) {
        try {
            xpResult = await XPService.awardXP(saved._id.toString(), XPAction.APP_ADDED, {
                appId: savedApp._id.toString(),
                appName: savedApp.appName,
                store: savedApp.store,
                url: savedApp.url
            });
        } catch (error) {
            console.error("Error awarding XP for app addition:", error);
            // Don't fail the app save if XP awarding fails
        }
    }

    // if (savedApp) {
    //     try {
    //         await fetch(
    //             'https://sdhxsfg2f6.execute-api.us-east-1.amazonaws.com/dev/update-reviews',
    //             {
    //                 method: 'POST',
    //                 body: JSON.stringify({
    //                     ids: [savedApp._id.toString()]
    //                 }),
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     "x-api-key": process.env.BACKEND_API_KEY || ''
    //                 },
    //                 cache: 'no-store'
    //             }
    //         );
    //     } catch (e) {
    //         console.log('Failed to trigger review update:', e);
    //     }
    // }

    revalidatePath('/', 'layout');

    const response: any = {
        success: true,
        message: `${getStoreName(store)} app ${isUpdate ? 'updated' : 'added'} successfully`,
        appId: savedApp?._id?.toString()
    };

    // Include XP result in response if available
    if (xpResult) {
        response.xpAwarded = xpResult;
    }

    return response;
}

function getStoreName(store: string): string {
    switch (store) {
        case 'GooglePlay': return 'Google Play Store';
        case 'AppleStore': return 'Apple App Store';
        case 'ChromeExt': return 'Chrome Web Store';
        default: return 'Unknown Store';
    }
}