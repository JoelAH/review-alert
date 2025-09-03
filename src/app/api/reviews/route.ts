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
      filter.quest = quest === 'OTHER' ? { '$exists': false } : quest;
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

    // Fetch reviews with pagination and optimized query
    let reviews;
    try {
      reviews = await ReviewModel.find(filter)
        .sort({ date: -1, _id: -1 }) // Add _id for consistent sorting
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance
        .hint({ user: 1, date: -1 }); // Hint to use the user + date index
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

    // Calculate overview statistics using aggregation for better performance
    let overviewStats;
    try {
      overviewStats = await ReviewModel.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            positiveReviews: {
              $sum: { $cond: [{ $eq: ["$sentiment", "POSITIVE"] }, 1, 0] }
            },
            negativeReviews: {
              $sum: { $cond: [{ $eq: ["$sentiment", "NEGATIVE"] }, 1, 0] }
            },
            bugReviews: {
              $sum: { $cond: [{ $eq: ["$quest", "BUG"] }, 1, 0] }
            },
            featureRequestReviews: {
              $sum: { $cond: [{ $eq: ["$quest", "FEATURE_REQUEST"] }, 1, 0] }
            },
            otherReviews: {
              $sum: { $cond: [{ $or: [{ $eq: ["$quest", "OTHER"] }, { $eq: [{ $type: "$quest" }, 'missing'] }] }, 1, 0] }
            },
            reviewsByApp: { $push: "$appId" }
          }
        }
      ]);
    } catch (error) {
      console.error("Error calculating overview statistics:", error);
      return NextResponse.json(
        { error: "Error calculating overview statistics" },
        { status: 500 }
      );
    }

    // Use aggregated data for overview statistics
    const stats = overviewStats[0] || {
      totalReviews: 0,
      positiveReviews: 0,
      negativeReviews: 0,
      bugReviews: 0,
      featureRequestReviews: 0,
      otherReviews: 0,
      reviewsByApp: []
    };

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: stats.positiveReviews,
      negative: stats.negativeReviews,
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

    // Count reviews by platform using the aggregated app IDs
    stats.reviewsByApp.forEach((appId: any) => {
      const platform = appIdToPlatform.get(appId.toString());
      if (platform && platformBreakdown.hasOwnProperty(platform)) {
        platformBreakdown[platform as keyof typeof platformBreakdown]++;
      }
    });

    // Quest breakdown
    const questBreakdown = {
      bug: stats.bugReviews,
      featureRequest: stats.featureRequestReviews,
      other: stats.otherReviews,
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

export async function PUT(request: NextRequest) {
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

    // Get user to verify ownership
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { reviewId, questId } = body;

    // Validate required fields
    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // Find and update the review
    let updatedReview: any;
    try {
      updatedReview = await ReviewModel.findOneAndUpdate(
        { _id: reviewId, user: user._id },
        { questId: questId || null, updatedAt: new Date() },
        { new: true, lean: true }
      );
    } catch (error) {
      console.error("Error updating review:", error);
      return NextResponse.json(
        { error: "Error updating review" },
        { status: 500 }
      );
    }

    if (!updatedReview) {
      return NextResponse.json(
        { error: "Review not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: {
        ...updatedReview,
        _id: updatedReview._id.toString(),
        user: updatedReview.user.toString(),
        appId: updatedReview.appId.toString(),
      }
    });

  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}