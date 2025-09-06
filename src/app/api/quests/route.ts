import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import QuestModel, { QuestType, QuestPriority, QuestState, formatQuest } from "@/lib/models/server/quest";
import UserModel from "@/lib/models/server/user";
import ReviewModel from "@/lib/models/server/review";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";

interface QuestsResponse {
  quests: any[];
  hasMore: boolean;
  totalCount: number;
  overview: {
    stateBreakdown: {
      open: number;
      inProgress: number;
      done: number;
    };
    priorityBreakdown: {
      high: number;
      medium: number;
      low: number;
    };
    typeBreakdown: {
      bugFix: number;
      featureRequest: number;
      improvement: number;
      research: number;
      other: number;
    };
  };
}

interface CreateQuestRequest {
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  reviewId?: string;
  state?: QuestState;
}



// Helper function to verify authentication and get user
async function authenticateUser() {
  // Initialize Firebase Admin
  initAdminApp();

  // Verify authentication via session cookie
  const sessionCookie = cookies().get(CONSTANTS.sessionCookieName)?.value;
  if (!sessionCookie) {
    throw new Error("Unauthorized - No session cookie");
  }

  let decodedClaims;
  try {
    decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    throw new Error("Unauthorized - Invalid session");
  }

  const uid = decodedClaims.uid;

  // Connect to database
  await dbConnect();

  // Get user
  const user = await UserModel.findOne({ uid });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// GET - Fetch user's quests with sorting by state and priority
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Cap at 100
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Validate parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page and limit must be positive integers." },
        { status: 400 }
      );
    }

    // Validate state parameter
    if (state && !Object.values(QuestState).includes(state as QuestState)) {
      return NextResponse.json(
        { error: `Invalid state. Must be one of: ${Object.values(QuestState).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate priority parameter
    if (priority && !Object.values(QuestPriority).includes(priority as QuestPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${Object.values(QuestPriority).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate type parameter
    if (type && !Object.values(QuestType).includes(type as QuestType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${Object.values(QuestType).join(", ")}` },
        { status: 400 }
      );
    }

    // Build filter query
    const filter: any = { user: user._id };

    if (state) {
      filter.state = state;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (type) {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await QuestModel.countDocuments(filter);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Define sort order: state (OPEN, IN_PROGRESS, DONE), then priority (HIGH, MEDIUM, LOW), then createdAt (newest first)
    const stateOrder = { [QuestState.OPEN]: 1, [QuestState.IN_PROGRESS]: 2, [QuestState.DONE]: 3 };
    const priorityOrder = { [QuestPriority.HIGH]: 1, [QuestPriority.MEDIUM]: 2, [QuestPriority.LOW]: 3 };

    // Fetch quests with custom sorting using aggregation pipeline
    const quests = await QuestModel.aggregate([
      { $match: filter },
      {
        $addFields: {
          stateOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$state", QuestState.OPEN] }, then: 1 },
                { case: { $eq: ["$state", QuestState.IN_PROGRESS] }, then: 2 },
                { case: { $eq: ["$state", QuestState.DONE] }, then: 3 }
              ],
              default: 4
            }
          },
          priorityOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", QuestPriority.HIGH] }, then: 1 },
                { case: { $eq: ["$priority", QuestPriority.MEDIUM] }, then: 2 },
                { case: { $eq: ["$priority", QuestPriority.LOW] }, then: 3 }
              ],
              default: 4
            }
          }
        }
      },
      {
        $sort: {
          stateOrder: 1,
          priorityOrder: 1,
          createdAt: -1
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          stateOrder: 0,
          priorityOrder: 0
        }
      }
    ]);

    // Format quests
    const formattedQuests = quests.map((quest: any) => ({
      ...quest,
      _id: quest._id.toString(),
      user: quest.user.toString(),
      reviewId: quest.reviewId ? quest.reviewId.toString() : undefined,
    }));

    // Calculate overview statistics
    const allQuests = await QuestModel.find({ user: user._id });
    const overview = {
      stateBreakdown: {
        open: allQuests.filter(q => q.state === QuestState.OPEN).length,
        inProgress: allQuests.filter(q => q.state === QuestState.IN_PROGRESS).length,
        done: allQuests.filter(q => q.state === QuestState.DONE).length,
      },
      priorityBreakdown: {
        high: allQuests.filter(q => q.priority === QuestPriority.HIGH).length,
        medium: allQuests.filter(q => q.priority === QuestPriority.MEDIUM).length,
        low: allQuests.filter(q => q.priority === QuestPriority.LOW).length,
      },
      typeBreakdown: {
        bugFix: allQuests.filter(q => q.type === QuestType.BUG_FIX).length,
        featureRequest: allQuests.filter(q => q.type === QuestType.FEATURE_REQUEST).length,
        improvement: allQuests.filter(q => q.type === QuestType.IMPROVEMENT).length,
        research: allQuests.filter(q => q.type === QuestType.RESEARCH).length,
        other: allQuests.filter(q => q.type === QuestType.OTHER).length,
      },
    };

    const hasMore = skip + limit < totalCount;

    const response: QuestsResponse = {
      quests: formattedQuests,
      hasMore,
      totalCount,
      overview,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching quests:", error);
    
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error.message === "User not found") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (error.message === "Database connection failed") {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new quest with validation and user authentication
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();

    // Parse request body
    let body: CreateQuestRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!body.type || !Object.values(QuestType).includes(body.type)) {
      return NextResponse.json(
        { error: `Type is required and must be one of: ${Object.values(QuestType).join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.priority || !Object.values(QuestPriority).includes(body.priority)) {
      return NextResponse.json(
        { error: `Priority is required and must be one of: ${Object.values(QuestPriority).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (body.details && typeof body.details !== 'string') {
      return NextResponse.json(
        { error: "Details must be a string if provided" },
        { status: 400 }
      );
    }

    if (body.state && !Object.values(QuestState).includes(body.state)) {
      return NextResponse.json(
        { error: `State must be one of: ${Object.values(QuestState).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate reviewId if provided
    if (body.reviewId) {
      try {
        const review = await ReviewModel.findOne({ _id: body.reviewId, user: user._id });
        if (!review) {
          return NextResponse.json(
            { error: "Review not found or does not belong to user" },
            { status: 404 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid reviewId format" },
          { status: 400 }
        );
      }
    }

    // Create quest data
    const questData = {
      user: user._id,
      title: body.title.trim(),
      details: body.details?.trim(),
      type: body.type,
      priority: body.priority,
      state: body.state || QuestState.OPEN,
      reviewId: body.reviewId || undefined,
    };

    // Create quest
    const quest = new QuestModel(questData);
    const savedQuest = await quest.save();

    // Award XP for quest creation
    let xpResult = null;
    try {
      xpResult = await XPService.awardXP(user._id.toString(), XPAction.QUEST_CREATED, {
        questId: savedQuest._id.toString(),
        questTitle: savedQuest.title,
        questType: savedQuest.type
      });
    } catch (error) {
      console.error("Error awarding XP for quest creation:", error);
      // Don't fail the quest creation if XP awarding fails
    }

    // If quest was created from a review, update the review to link back to the quest
    if (body.reviewId) {
      try {
        await ReviewModel.findOneAndUpdate(
          { _id: body.reviewId, user: user._id },
          { questId: savedQuest._id, updatedAt: new Date() },
          { new: true }
        );
      } catch (error) {
        console.error("Error updating review with quest ID:", error);
        // Don't fail the quest creation if review update fails
      }
    }

    // Format and return quest
    const formattedQuest = formatQuest(savedQuest);

    // Include XP result in response if available
    const response: any = { quest: formattedQuest };
    if (xpResult) {
      response.xpAwarded = xpResult;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error("Error creating quest:", error);
    
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error.message === "User not found") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (error.message === "Database connection failed") {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

