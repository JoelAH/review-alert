import { UserModel } from "@libs/models/user";
import { Types } from "mongoose";
import axios from 'axios';
import { parse } from 'node-html-parser';
import { ReviewModel } from "@libs/models/review";
import gplay from "google-play-scraper";
import appStoreScraper from 'app-store-scraper';

export async function update(updatedIds: string[]): Promise<{ processed: string[] }> {

    const processed = [];
    let commentMap: { comment: string, id: any }[] = [];
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
                    commentMap = await getChromeReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
                case 'GooglePlay':
                    commentMap = await getPlayStoreReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
                case 'AppleStore':
                    commentMap = await getAppStoreReviews(users[0]._id.toString(), app._id.toString(), app.appId);
                    break;
            }
            processed.push(id);
        }

        // get classifications
        try {
            const result = await fetch(
                `${process.env.CLASS_URI}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        texts: commentMap.map(c => c.comment)
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.CLASS_KEY || ''
                    },
                    cache: 'no-store'
                }
            );
            const data = await result.json();
            for (let i = 0; i < data.results.length; i++) {
                const review = await ReviewModel.findById(commentMap[i].id);
                review.sentiment = data.results[i].sentiment.label;
                review.priority = data.results[i].priority.label;
                review.quest = data.results[i].category.label;

                await review.save();
            }
        }
        catch (e) {
            console.log('error getting classification', e)
        }
    }

    return { processed }
}

async function getChromeReviews(userId: string, appId: string, fullAppId: string) {
    const commentMap: { comment: string, id: any }[] = [];
    const response = await axios.get(`https://chrome.google.com/webstore/detail/${fullAppId}/reviews`);
    const root = parse(response.data);

    const all = root.querySelectorAll('section.T7rvce');
    let count = 1;
    for (const r of all) {
        const info = r.querySelector('h3').childNodes;
        const text = r.querySelector('p');

        const newReview = new ReviewModel({
            user: new Types.ObjectId(userId),
            appId: new Types.ObjectId(appId),
            name: info[0].rawText,
            comment: text.rawText,
            date: new Date(info[2].rawText || new Date()),
            rating: Number(info[1]['rawAttrs'].split('title="')[1].split(' ')[0]),
            createdAt: new Date()
        });
        const saved = await newReview.save();
        commentMap.push({
            comment: text.rawText,
            id: saved._id.toString()
        });
        count++;
        if (count >= 11) break;
    }

    return commentMap;
}

async function getPlayStoreReviews(userId: string, appId: string, fullAppId: string) {
    const commentMap: { comment: string, id: any }[] = [];
    const all = await gplay.reviews({
        appId: fullAppId,
        sort: gplay.sort.NEWEST,
        num: 10
    });
    if (!all?.data?.length) return;
    for (const r of all.data) {
        const newReview = new ReviewModel({
            user: new Types.ObjectId(userId),
            appId: new Types.ObjectId(appId),
            name: r.userName,
            comment: r.text,
            date: new Date(r.date || new Date()),
            rating: r.score,
            createdAt: new Date()
        });
        const saved = await newReview.save();
        commentMap.push({
            comment: r.text,
            id: saved._id.toString()
        });
    }

    return commentMap;
}

async function getAppStoreReviews(userId: string, appId: string, fullAppId: string) {
    const commentMap: { comment: string, id: any }[] = [];
    const all = await appStoreScraper.reviews({
        id: fullAppId,
        sort: appStoreScraper.sort.RECENT
    })
    if (!all?.length) return;

    let count = 1;
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
        const saved = await newReview.save();
        commentMap.push({
            comment: r.text,
            id: saved._id.toString()
        });
        count++;
        if (count >= 11) break;
    }

    return commentMap;
}
