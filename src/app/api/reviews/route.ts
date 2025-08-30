import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import ReviewModel, { ReviewSentiment, ReviewQuest } from "@/lib/models/server/review";
import UserModel from "@/lib/models/server/user";

interface ReviewsResponse {
  reviews: any[];
  hasMore: boolean;
  totalCount: number;
  overview: {
    sentimentBreakdown: {
      positive: number;
      negative: number;
    };
    platformBreakdown: {
      GooglePlay: number;
      AppleStore: number;
      ChromeExt: number;
    };
    questBreakdown: {
      bug: number;
      featureRequest: number;
      other: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdminApp();

    // Verify authentication via session cookie
    const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized - No session cookie" },
        { status: 401 }
      );
    }

    let decodedClaims;
    try {
      decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const uid = decodedClaims.uid;

    // Connect to database
    try {
      await dbConnect();
    } catch (error) {
      console.error("Database connection failed:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    // Get user to access their apps
    let user;
    try {
      user = await UserModel.findOne({ uid });
    } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Cap at 100
    const platform = searchParams.get("platform");
    const rating = searchParams.get("rating");
    const sentiment = searchParams.get("sentiment");
    const quest = searchParams.get("quest");

    // Validate parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page and limit must be positive integers." },
        { status: 400 }
      );
    }

    // Validate platform parameter
    if (platform && !["GooglePlay", "AppleStore", "ChromeExt"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be one of: GooglePlay, AppleStore, ChromeExt" },
        { status: 400 }
      );
    }

    // Validate rating parameter
    if (rating) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return NextResponse.json(
          { error: "Invalid rating. Must be between 1 and 5." },
          { status: 400 }
        );
      }
    }

    // Validate sentiment parameter
    if (sentiment && !Object.values(ReviewSentiment).includes(sentiment as ReviewSentiment)) {
      return NextResponse.json(
        { error: `Invalid sentiment. Must be one of: ${Object.values(ReviewSentiment).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate quest parameter
    if (quest && !Object.values(ReviewQuest).includes(quest as ReviewQuest)) {
      return NextResponse.json(
        { error: `Invalid quest. Must be one of: ${Object.values(ReviewQuest).join(", ")}` },
        { status: 400 }
      );
    }

    // Build filter query
    const filter: any = { user: user._id };

    // Filter by platform (need to get appIds for the specific platform)
    if (platform && ["GooglePlay", "AppleStore", "ChromeExt"].includes(platform)) {
      const platformApps = user.apps?.filter((app: any) => app.store === platform) || [];
      const appIds = platformApps.map((app: any) => app._id);
      if (appIds.length > 0) {
        filter.appId = { $in: appIds };
      } else {
        // No apps for this platform, return empty result
        const emptyResponse: ReviewsResponse = {
          reviews: [],
          hasMore: false,
          totalCount: 0,
          overview: {
            sentimentBreakdown: { positive: 0, negative: 0 },
            platformBreakdown: { GooglePlay: 0, AppleStore: 0, ChromeExt: 0 },
            questBreakdown: { bug: 0, featureRequest: 0, other: 0 }
          }
        };
        return NextResponse.json(emptyResponse);
      }
    }

    // Filter by rating
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        filter.rating = ratingNum;
      }
    }

    // Filter by sentiment
    if (sentiment && Object.values(ReviewSentiment).includes(sentiment as ReviewSentiment)) {
      filter.sentiment = sentiment;
    }

    // Filter by quest
    if (quest && Object.values(ReviewQuest).includes(quest as ReviewQuest)) {
      filter.quest = quest;
    }

    // Get total count for pagination
    let totalCount;
    try {
      totalCount = await ReviewModel.countDocuments(filter);
    } catch (error) {
      console.error("Error counting reviews:", error);
      return NextResponse.json(
        { error: "Error counting reviews" },
        { status: 500 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const hasMore = skip + limit < totalCount;

    // Fetch reviews with pagination
    let reviews;
    try {
      reviews = await ReviewModel.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { error: "Error fetching reviews" },
        { status: 500 }
      );
    }

    // Create app lookup map for platform and app name information
    const appIdToInfo = new Map<string, { platform: string; appName: string }>();
    user.apps?.forEach((app: any) => {
      appIdToInfo.set(app._id.toString(), {
        platform: app.store,
        appName: app.url.split('/').pop() || 'Unknown App', // Extract app name from URL
      });
    });

    // Format reviews with app information
    const formattedReviews = reviews.map((review: any) => {
      const appInfo = appIdToInfo.get(review.appId.toString());
      return {
        ...review,
        _id: review._id.toString(),
        user: review.user.toString(),
        appId: review.appId.toString(),
        platform: appInfo?.platform || 'Unknown',
        appName: appInfo?.appName || 'Unknown App',
      };
    });

    // Calculate overview statistics for all user's reviews (not just filtered)
    let allUserReviews;
    try {
      allUserReviews = await ReviewModel.find({ user: user._id }).lean();
    } catch (error) {
      console.error("Error fetching user reviews for overview:", error);
      return NextResponse.json(
        { error: "Error calculating overview statistics" },
        { status: 500 }
      );
    }

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: allUserReviews.filter((r: any) => r.sentiment === ReviewSentiment.POSITIVE).length,
      negative: allUserReviews.filter((r: any) => r.sentiment === ReviewSentiment.NEGATIVE).length,
    };

    // Platform breakdown - need to map appIds to platforms
    const appIdToPlatform = new Map<string, string>();
    user.apps?.forEach((app: any) => {
      appIdToPlatform.set(app._id.toString(), app.store);
    });

    const platformBreakdown = {
      GooglePlay: 0,
      AppleStore: 0,
      ChromeExt: 0,
    };

    allUserReviews.forEach((review: any) => {
      const platform = appIdToPlatform.get(review.appId.toString());
      if (platform && platformBreakdown.hasOwnProperty(platform)) {
        platformBreakdown[platform as keyof typeof platformBreakdown]++;
      }
    });

    // Quest breakdown
    const questBreakdown = {
      bug: allUserReviews.filter((r: any) => r.quest === ReviewQuest.BUG).length,
      featureRequest: allUserReviews.filter((r: any) => r.quest === ReviewQuest.FEATURE_REQUEST).length,
      other: allUserReviews.filter((r: any) => r.quest === ReviewQuest.OTHER).length,
    };

    const response: ReviewsResponse = {
      reviews: formattedReviews,
      hasMore,
      totalCount,
      overview: {
        sentimentBreakdown,
        platformBreakdown,
        questBreakdown,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}