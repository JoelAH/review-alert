import { UserModel } from "@libs/models/user";
import { ReviewModel } from "@libs/models/review";
// @ts-ignore
import gplay from "google-play-scraper";
import appStoreScraper from 'app-store-scraper';
import { parse } from 'node-html-parser';
import axios from 'axios';
import { Types } from "mongoose";

const EMAIL_URL = "https://kp7r9sedu1.execute-api.us-east-1.amazonaws.com/dev/email-alert";
const EMAIL_API_KEY = process.env["EMAIL_API_KEY"];

export async function processApps(): Promise<void> {
    const processed = { apps: 0, users: 0 };
    const users = await UserModel.find({});
    for (const user of users) {
        for (const app of user.apps) {
            let review: { name: string, rating: number, date: Date, comment: string } | null = null;
            switch (app.store) {
                case 'ChromeExt':
                    review = await getChromeReview(app.appId);
                    break;
                case 'GooglePlay':
                    review = await getPlayStoreReview(app.appId);
                    break;
                case 'AppleStore':
                    review = await getAppStoreReview(app.appId);
                    break;
            }

            if (review) {
                const savedReviews = await ReviewModel.find({ user: user._id, appId: app._id }, null, { sort: { date: -1 }, limit: 10 });
                const found = savedReviews.find(r => r.name === review.name && r.comment === review.comment && r.rating === review.rating);
                if (!found) {
                    const newReview = new ReviewModel({
                        user: user._id,
                        appId: app._id,
                        name: review.name,
                        comment: review.comment,
                        date: review.date,
                        rating: review.rating,
                        createdAt: new Date()
                    });
                    await newReview.save();
                    await sendNotification(user.email, { name: review.name, date: review.date, score: review.rating, text: review.comment });
                }
            }
            processed.apps++;
        }
        processed.users++
    }

    console.log(`Finished processing ${processed.users} users & ${processed.apps} apps`)
}

async function getChromeReview(fullAppId: string): Promise<{ name: string, rating: number, date: Date, comment: string } | null> {
    const response = await axios.get(`https://chrome.google.com/webstore/detail/${fullAppId}/reviews`);
    const root = parse(response.data);

    const all = root.querySelectorAll('section.T7rvce');
    if (!all.length) return null;

    const info = all[0].querySelector('h3').childNodes;
    const text = all[0].querySelector('p');

    return {
        name: info[0].rawText,
        rating: Number(info[1]['rawAttrs'].split('title="')[1].split(' ')[0]),
        date: new Date(info[2].rawText || new Date()),
        comment: text.rawText
    }
}

async function getPlayStoreReview(fullAppId: string) {
    const all = await gplay.reviews({
        appId: fullAppId,
        sort: gplay.sort.NEWEST,
        num: 1
    });

    if (!all?.length) return null;

    return {
        name: all[0].userName,
        rating: all[0].score,
        date: new Date(all[0].date || new Date()),
        comment: all[0].text
    }
}

async function getAppStoreReview(fullAppId: string) {
    const all = await appStoreScraper.reviews({
        id: fullAppId,
        sort: appStoreScraper.sort.RECENT
    })

    if (!all?.length) return null;

    return {
        name: all[0].userName,
        rating: all[0].score,
        date: new Date(all[0].updated || new Date()),
        comment: all[0].text
    }
}

async function  sendNotification(email: string, review: { name: string, date: Date, score: number, text: string }) {
    const { name, date, score, text } = review;
    try {
        // @ts-ignore
        await fetch(EMAIL_URL, {
            method: "POST",
            body: JSON.stringify({
                to: email,
                subject: "You have a new review for your app",
                message: `A new review was posted to one of your apps. Details:
                    name: ${name},
                    date: ${date.toISOString()},
                    score: ${score},
                    comment: ${text}`,
                from: {
                    name: "App Review Alert",
                    email: "admin@wimeki.com",
                },
            }),
            headers: {
                "Content-Type": "application/json",
                "x-api-key": EMAIL_API_KEY || '',
            },
        });
    }
    catch(e) {
        console.log('error sending email');
    }
}