import { UserModel } from "@libs/models/user";
import { Types } from "mongoose";
import axios from 'axios';
import { parse } from 'node-html-parser';
import { ReviewModel } from "@libs/models/review";
import gplay from "google-play-scraper";
import appStoreScraper from 'app-store-scraper';

export async function update(updatedIds: string[]): Promise<{ processed: string[] }> {

    const processed = [];
    for (const id of updatedIds) {
        const users = await UserModel.find({
            apps: {
                $elemMatch: {
                    _id: new Types.ObjectId(id)
                }
            }
        });
        if (users?.length) {
            const app = users[0].apps.find(app => app._id.toString() === id);
            console.log('the app', app);
            switch (app.store) {
                case 'ChromeExt':
                    await getChromeReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
                case 'GooglePlay':
                    await getPlayStoreReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
                case 'AppleStore':
                    await getAppStoreReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
            }
            processed.push(id);
        }
    }

    return { processed }
}

async function getChromeReviews(userId: string, appId: string, fullAppId: string) {
    const response = await axios.get(`https://chrome.google.com/webstore/detail/${fullAppId}/reviews`);
    const root = parse(response.data);

    const all = root.querySelectorAll('section.T7rvce');
    let count = 1;
    for (const r of all) {
        const info = r.querySelector('h3').childNodes;
        // console.log(info[0].rawText);
        // console.log(info[2].rawText);
        // console.log(Number(info[1].rawAttrs.split('title="')[1].split(' ')[0]));
        const text = r.querySelector('p')
        // console.log(text.rawText);
        // console.log('-------------------')

        const newReview = new ReviewModel({
            user: new Types.ObjectId(userId),
            appId: new Types.ObjectId(appId),
            name: info[0].rawText,
            comment: text.rawText,
            date: new Date(info[2].rawText || new Date()),
            rating: Number(info[1]['rawAttrs'].split('title="')[1].split(' ')[0]),
            createdAt: new Date()
        });
        await newReview.save();
        count++;
        if (count >= 11) break;
    }
}

async function getPlayStoreReviews(userId: string, appId: string, fullAppId: string) {
    const all = await gplay.reviews({
        appId: fullAppId,
        sort: gplay.sort.NEWEST,
        num: 10
    });

    if (!all?.length) return;

    for (const r of all) {
        const newReview = new ReviewModel({
            user: new Types.ObjectId(userId),
            appId: new Types.ObjectId(appId),
            name: r.userName,
            comment: r.text,
            date: new Date(r.date || new Date()),
            rating: r.score,
            createdAt: new Date()
        });
        await newReview.save();
    }
}

async function getAppStoreReviews(userId: string, appId: string, fullAppId: string) {
    const all = await appStoreScraper.reviews({
        id: fullAppId,
        sort: appStoreScraper.sort.RECENT
    })

    if (!all?.length) return;

    for (const r of all) {
        const newReview = new ReviewModel({
            user: new Types.ObjectId(userId),
            appId: new Types.ObjectId(appId),
            name: r.userName,
            comment: r.text,
            date: new Date(r.updated || new Date()),
            rating: r.score,
            createdAt: new Date()
        });
        await newReview.save();
    }
}
