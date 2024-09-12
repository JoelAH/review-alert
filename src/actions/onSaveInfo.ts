"use server";

import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { checkAuth } from "@/lib/services/middleware";
import UserModel from "../lib/models/server/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EMAIL_TEST = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_TEST = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;


export async function onSaveInfo(prevState: any, formData: FormData): Promise<any> {
    const decoded = await checkAuth();
    if (!decoded) {
        redirect('/');
    }
    await dbConnect();
    
    const email = formData.get('email')?.toString();
    const google = formData.get('google')?.toString();
    const apple = formData.get('apple')?.toString();
    const chrome = formData.get('chrome')?.toString();
    
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
    if (user) {
        user.email = email;
        user.apps = [];
        if (chrome) {
            user.apps.push({ store: 'ChromeExt', url: chrome, id: chrome.split('/').pop()   })
        }
        if (google) {
            const googleId = new URL(google).searchParams.get('id');
            if (!googleId) {
                return { errors: ['Please submit a valid google store url with id'] }
            }
            user.apps.push({ store: 'GooglePlay', url: google, id: googleId })
        }
        if (apple) {
            user.apps.push({ store: 'AppleStore', url: apple, id: apple.split('id').pop()   })
        }
        await  user.save();
    } else {
        const newUser = new UserModel({
            uid: decoded.uid,
            email,
            createdAt: new Date()
        });
        newUser.apps = [];
        if (chrome) {
            newUser.apps.push({ store: 'ChromeExt', url: chrome, id: chrome.split('/').pop()   })
        }
        if (google) {
            const googleId = new URL(google).searchParams.get('id');
            if (!googleId) {
                return { errors: ['Please submit a valid google store url with id'] }
            }
            newUser.apps.push({ store: 'GooglePlay', url: google, id: googleId })
        }
        if (apple) {
            newUser.apps.push({ store: 'AppleStore', url: apple, id: apple.split('id').pop()   })
        }
        await newUser.save();
    }

    revalidatePath('/', 'layout');
}