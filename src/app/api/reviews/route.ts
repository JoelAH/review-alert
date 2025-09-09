import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import ReviewModel, { ReviewSentiment, ReviewQuest } from "@/lib/models/server/review";
import UserModel from "@/lib/models/server/user";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";
import { rateLimit, getRateLimitIdentifier } from "@/lib/middleware/rateLimit";
import { sanitizeObjectId, isValidPlatform, validatePagination, validateQueryParam } from "@/lib/utils/validation";
import { createErrorResponse, handleDatabaseError, handleAuthError, ApiError } from "@/lib/utils/errorHandling";

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
      throw new ApiError("Unauthorized", 401);
    }

    let decodedClaims;
    try {
      decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return handleAuthError(error);
    }

    const uid = decodedClaims.uid;

    // Apply rate limiting
    const rateLimitId = getRateLimitIdentifier(request, uid);
    const { success: rateLimitSuccess, remaining } = rateLimit(rateLimitId, 100, 60000);

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    // Connect to database
    try {
      await dbConnect();
    } catch (error) {
      return handleDatabaseError(error);
    }

    // Get user to access their apps
    let user;
    try {
      user = await UserModel.findOne({ uid });
    } catch (error) {
      return handleDatabaseError(error);
    }

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    // Validate pagination
    const paginationResult = validatePagination(
      searchParams.get("page"),
      searchParams.get("limit")
    );

    if (!paginationResult.isValid) {
      throw new ApiError(paginationResult.error || "Invalid pagination parameters", 400);
    }

    const { page, limit } = paginationResult;

    // Validate platform parameter
    const platformParam = searchParams.get("platform");
    const platformValidation = validateQueryParam(platformParam, {
      allowedValues: ["GooglePlay", "AppleStore", "ChromeExt"]
    });

    if (!platformValidation.isValid) {
      throw new ApiError("Invalid platform parameter", 400);
    }

    const platform = platformValidation.sanitized;

    // Validate rating parameter
    const ratingParam = searchParams.get("rating");
    const ratingValidation = validateQueryParam(ratingParam, {
      isNumeric: true,
      min: 1,
      max: 5
    });

    if (!ratingValidation.isValid) {
      throw new ApiError("Invalid rating. Must be between 1 and 5.", 400);
    }

    const rating = ratingValidation.sanitized;

    // Validate sentiment parameter
    const sentimentParam = searchParams.get("sentiment");
    const sentimentValidation = validateQueryParam(sentimentParam, {
      allowedValues: Object.values(ReviewSentiment)
    });

    if (!sentimentValidation.isValid) {
      throw new ApiError(`Invalid sentiment. Must be one of: ${Object.values(ReviewSentiment).join(", ")}`, 400);
    }

    const sentiment = sentimentValidation.sanitized;

    // Validate quest parameter
    const questParam = searchParams.get("quest");
    const questValidation = validateQueryParam(questParam, {
      allowedValues: Object.values(ReviewQuest)
    });

    if (!questValidation.isValid) {
      throw new ApiError(`Invalid quest. Must be one of: ${Object.values(ReviewQuest).join(", ")}`, 400);
    }

    const quest = questValidation.sanitized;

    // Build filter query with proper sanitization
    const filter: any = { user: user._id };

    // Filter by platform (need to get appIds for the specific platform)
    if (platform && isValidPlatform(platform)) {
      const platformApps = user.apps?.filter((app: any) => app.store === platform) || [];
      const validAppIds = platformApps
        .map((app: any) => sanitizeObjectId(app._id?.toString()))
        .filter(Boolean);

      if (validAppIds.length > 0) {
        filter.appId = { $in: validAppIds };
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
      filter.rating = ratingNum;
    }

    // Filter by sentiment
    if (sentiment) {
      filter.sentiment = sentiment;
    }

    // Filter by quest
    if (quest) {
      filter.quest = quest === 'OTHER' ? { '$exists': false } : quest;
    }

    // Get total count for pagination
    let totalCount;
    try {
      totalCount = await ReviewModel.countDocuments(filter);
    } catch (error) {
      return handleDatabaseError(error);
    }

    // Calculate pagination
    const skip = ((page || 1) - 1) * (limit || 20);
    const hasMore = skip + (limit || 20) < totalCount;

    // Fetch reviews with pagination and optimized query
    let reviews;
    try {
      reviews = await ReviewModel.find(filter)
        .sort({ date: -1, _id: -1 }) // Add _id for consistent sorting
        .skip(skip)
        .limit((limit || 20))
        .lean() // Use lean() for better performance
        .hint({ user: 1, date: -1 }); // Hint to use the user + date index
    } catch (error) {
      return handleDatabaseError(error);
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
      return handleDatabaseError(error);
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

    // Add rate limit headers to successful responses
    const responseHeaders = {
      'X-RateLimit-Remaining': remaining.toString()
    };

    return NextResponse.json(response, { headers: responseHeaders });

  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(error as Error, "Failed to fetch reviews");
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdminApp();

    // Verify authentication via session cookie
    const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
    if (!sessionCookie) {
      throw new ApiError("Unauthorized", 401);
    }

    let decodedClaims;
    try {
      decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return handleAuthError(error);
    }

    const uid = decodedClaims.uid;

    // Apply rate limiting
    const rateLimitId = getRateLimitIdentifier(request, uid);
    const { success: rateLimitSuccess, remaining } = rateLimit(rateLimitId, 50, 60000); // Lower limit for PUT

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    // Connect to database
    try {
      await dbConnect();
    } catch (error) {
      return handleDatabaseError(error);
    }

    // Get user to verify ownership
    let user;
    try {
      user = await UserModel.findOne({ uid });
    } catch (error) {
      return handleDatabaseError(error);
    }

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw new ApiError("Invalid JSON in request body", 400);
    }

    const { reviewId, questId } = body;

    // Validate required fields
    if (!reviewId) {
      throw new ApiError("Review ID is required", 400);
    }

    // Sanitize reviewId
    const sanitizedReviewId = sanitizeObjectId(reviewId);
    if (!sanitizedReviewId) {
      throw new ApiError("Invalid review ID format", 400);
    }

    // Validate questId if provided
    let sanitizedQuestId = null;
    if (questId) {
      sanitizedQuestId = sanitizeObjectId(questId);
      if (!sanitizedQuestId) {
        throw new ApiError("Invalid quest ID format", 400);
      }
    }

    // Find and update the review
    let updatedReview: any;
    try {
      updatedReview = await ReviewModel.findOneAndUpdate(
        { _id: sanitizedReviewId, user: user._id },
        { questId: sanitizedQuestId, updatedAt: new Date() },
        { new: true, lean: true }
      );
    } catch (error) {
      return handleDatabaseError(error);
    }

    if (!updatedReview) {
      throw new ApiError("Review not found or access denied", 404);
    }

    // Award XP for review interaction - use authenticated user's UID for security
    let xpResult = null;
    try {
      xpResult = await XPService.awardXP(uid, XPAction.REVIEW_INTERACTION, {
        reviewId: updatedReview._id.toString(),
        questId: sanitizedQuestId?.toString() || null,
        action: sanitizedQuestId ? 'linked_to_quest' : 'unlinked_from_quest'
      });
    } catch (error) {
      console.error("Error awarding XP for review interaction:", error);
      // Don't fail the review update if XP awarding fails
    }

    const response: any = {
      success: true,
      review: {
        ...updatedReview,
        _id: updatedReview._id.toString(),
        user: updatedReview.user.toString(),
        appId: updatedReview.appId.toString(),
      }
    };

    // Include XP result in response if available
    if (xpResult) {
      response.xpAwarded = xpResult;
    }

    // Add rate limit headers to successful responses
    const responseHeaders = {
      'X-RateLimit-Remaining': remaining.toString()
    };

    return NextResponse.json(response, { headers: responseHeaders });

  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }
    return createErrorResponse(error as Error, "Failed to update review");
  }
}