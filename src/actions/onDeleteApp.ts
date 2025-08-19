"use server";

import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { checkAuth } from "@/lib/services/middleware";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function onDeleteApp(_prevState: any, formData: FormData): Promise<any> {
    const decoded = await checkAuth();
    if (!decoded) {
        redirect('/');
    }
    await dbConnect();

    const appId = formData.get('appId')?.toString()?.trim();

    if (!appId) {
        return {
            errors: ['App ID is required']
        };
    }

    const user = await getUser(decoded.uid);
    if (!user) {
        return { errors: ['User not found'] };
    }

    // Find the app to get its store name for the success message
    const appToDelete = user.apps?.find((app: any) => app._id.toString() === appId);
    if (!appToDelete) {
        return { errors: ['App not found'] };
    }

    // Remove app from user's apps array by ID
    if (user.apps) {
        user.apps = user.apps.filter((app: any) => app._id.toString() !== appId);
        await user.save();
    }

    revalidatePath('/', 'layout');

    return {
        success: true,
        message: `${getStoreName(appToDelete.store)} app removed successfully`
    };
}

function getStoreName(store: string): string {
    switch (store) {
        case 'GooglePlay': return 'Google Play Store';
        case 'AppleStore': return 'Apple App Store';
        case 'ChromeExt': return 'Chrome Web Store';
        default: return 'Unknown Store';
    }
}