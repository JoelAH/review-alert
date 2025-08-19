"use server";

import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { checkAuth } from "@/lib/services/middleware";
import UserModel from "../lib/models/server/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EMAIL_TEST = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function onSaveEmail(prevState: any, formData: FormData): Promise<any> {
    const decoded = await checkAuth();
    if (!decoded) {
        redirect('/');
    }
    await dbConnect();

    const email = formData.get('email')?.toString()?.trim();

    if (!email || !EMAIL_TEST.test(email)) {
        return {
            errors: ['Please submit a valid email address']
        };
    }

    const user = await getUser(decoded.uid);
    if (user) {
        user.email = email;
        await user.save();
    } else {
        const newUser = new UserModel({
            uid: decoded.uid,
            email,
            apps: [],
            createdAt: new Date()
        });
        await newUser.save();
    }

    revalidatePath('/', 'layout');

    return {
        success: true,
        message: 'Email updated successfully'
    };
}