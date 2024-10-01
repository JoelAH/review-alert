"use server";

import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { checkAuth } from "@/lib/services/middleware";
import UserModel from "../lib/models/server/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

const EMAIL_TEST = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_TEST = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;


export async function onSaveInfo(prevState: any, formData: FormData): Promise<any> {
    const decoded = await checkAuth();
    if (!decoded) {
        redirect('/');
    }
    await dbConnect();

    const email = formData.get('email')?.toString()?.trim();
    const google = formData.get('google')?.toString()?.trim();
    const apple = formData.get('apple')?.toString()?.trim();
    const chrome = formData.get('chrome')?.toString()?.trim();

    const googleId = formData.get('googleId')?.toString()?.trim();
    const appleId = formData.get('appleId')?.toString()?.trim();
    const chromeId = formData.get('chromeId')?.toString()?.trim();

    let errors: string[] = [];
    if (!email || !EMAIL_TEST.test(email)) {
        errors.push('Please submit a valid email address');
    }
    if (
        google && (!URL_TEST.test(google))
    ) {
        errors.push("Please submit a valid play store link")
    }
    if (
        apple && !URL_TEST.test(apple)
    ) {
        errors.push("Please submit a valid apple store link")
    }
    if (
        chrome && !URL_TEST.test(chrome)
    ) {
        errors.push("Please submit a valid chrome store link")
    }

    if (errors.length) {
        return {
            errors
        }
    }

    const user = await getUser(decoded.uid);
    let dirtyIds: string[] = [];
    let saved;
    if (user) {
        user.email = email;
        const apps = [];
        let found: any;

        // chrome
        if (chrome) {
            const chromeApp: any = { store: 'ChromeExt', url: chrome, appId: chrome.split('/').pop() };
            found = user.apps?.find((app: any) => app._id.toString() === chromeId);

            if (chromeId) {
                chromeApp._id = new Types.ObjectId(chromeId);
                if ((found && found.url !== chrome) || !found) {
                    dirtyIds.push(chromeId);
                }
            }

            apps.push(chromeApp);
        }

        // google
        if (google) {
            const googleAppId = new URL(google).searchParams.get('id');
            if (!googleAppId) {
                return { errors: ['Please submit a valid google store url with id'] }
            }
            const googleApp: any = { store: 'GooglePlay', url: google, appId: googleAppId };
            found = user.apps?.find((app: any) => app._id.toString() === googleId);

            if (googleId) {
                googleApp._id = new Types.ObjectId(googleId);
                if ((found && found.url !== google) || !found) {
                    dirtyIds.push(googleId);
                }
            }

            apps.push(googleApp)
        }

        if (apple) {
            const appleApp: any = { store: 'AppleStore', url: apple, appId: apple.split('id').pop() };
            found = user.apps?.find((app: any) => app._id.toString() === appleId);

            if (appleId) {
                appleApp._id = new Types.ObjectId(appleId);
                if ((found && found.url !== apple) || !found) {
                    dirtyIds.push(appleId);
                }
            }

            apps.push(appleApp);
        }

        user.apps = apps;
        saved = await user.save();

        if (saved && !chromeId && chrome) {
            dirtyIds.push(saved.apps.find((app: any) => app.store === 'ChromeExt')?._id?.toString() || '');
        }
        if (saved && !googleId && google) {
            dirtyIds.push(saved.apps.find((app: any) => app.store === 'GooglePlay')?._id?.toString() || '');
        }
        if (saved && !appleId && apple) {
            dirtyIds.push(saved.apps.find((app: any) => app.store === 'AppleStore')?._id?.toString() || '');
        }
    } else {
        const newUser = new UserModel({
            uid: decoded.uid,
            email,
            createdAt: new Date()
        });
        newUser.apps = [];
        if (chrome) {
            newUser.apps.push({ store: 'ChromeExt', url: chrome, appId: chrome.split('/').pop() })
        }
        if (google) {
            const googleAppId = new URL(google).searchParams.get('id');
            if (!googleAppId) {
                return { errors: ['Please submit a valid google store url with id'] }
            }
            newUser.apps.push({ store: 'GooglePlay', url: google, appId: googleAppId })
        }
        if (apple) {
            newUser.apps.push({ store: 'AppleStore', url: apple, appId: apple.split('id').pop() })
        }

        saved = await newUser.save();
        dirtyIds = saved?.apps?.map((app: any) => app._id.toString());
    }

    console.log('dirtyIds', dirtyIds.filter(Boolean));
    if (dirtyIds.filter(Boolean)?.length) {
        try {
            await fetch(
                'https://sdhxsfg2f6.execute-api.us-east-1.amazonaws.com/dev/update-reviews',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ids: dirtyIds.filter(Boolean)
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.BACKEND_API_KEY || ''
                    },
                    cache: 'no-store'
                }
            )
        }
        catch (e) {
            console.log('failed id process', e)
        }
    }
    revalidatePath('/', 'layout');

    return {
        success: true,
        user: {
            googleId: saved.apps.find((app: any) => app.store === 'GooglePlay')?._id?.toString() || '',
            appleId: saved.apps.find((app: any) => app.store === 'AppleStore')?._id?.toString() || '',
            chromeId: saved.apps.find((app: any) => app.store === 'ChromeExt')?._id?.toString() || ''
        }
    }
}