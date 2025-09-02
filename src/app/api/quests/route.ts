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

interface QuestsResponse {
  quests: any[];
  totalCount: number;
}

interface CreateQuestRequest {
  title: string;
  details?: string;
  type: QuestType;
  priority: QuestPriority;
  reviewId?: string;
  state?: QuestState;
}

interface UpdateQuestRequest {
  title?: string;
  details?: string;
  type?: QuestType;
  priority?: QuestPriority;
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100
    const state = searchParams.get("state");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");

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

    const response: QuestsResponse = {
      quests: formattedQuests,
      totalCount,
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

    // Format and return quest
    const formattedQuest = formatQuest(savedQuest);

    return NextResponse.json(formattedQuest, { status: 201 });

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

// PUT - Update quest state and other properties
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser();

    // Parse request body
    let body: { questId: string } & UpdateQuestRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate questId
    if (!body.questId || typeof body.questId !== 'string') {
      return NextResponse.json(
        { error: "questId is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate update fields
    const updates: any = {};
    
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.details !== undefined) {
      if (typeof body.details !== 'string') {
        return NextResponse.json(
          { error: "Details must be a string" },
          { status: 400 }
        );
      }
      updates.details = body.details.trim();
    }

    if (body.type !== undefined) {
      if (!Object.values(QuestType).includes(body.type)) {
        return NextResponse.json(
          { error: `Type must be one of: ${Object.values(QuestType).join(", ")}` },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }

    if (body.priority !== undefined) {
      if (!Object.values(QuestPriority).includes(body.priority)) {
        return NextResponse.json(
          { error: `Priority must be one of: ${Object.values(QuestPriority).join(", ")}` },
          { status: 400 }
        );
      }
      updates.priority = body.priority;
    }

    if (body.state !== undefined) {
      if (!Object.values(QuestState).includes(body.state)) {
        return NextResponse.json(
          { error: `State must be one of: ${Object.values(QuestState).join(", ")}` },
          { status: 400 }
        );
      }
      updates.state = body.state;
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Find and update quest
    const quest = await QuestModel.findOneAndUpdate(
      { _id: body.questId, user: user._id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Format and return updated quest
    const formattedQuest = formatQuest(quest);

    return NextResponse.json(formattedQuest);

  } catch (error: any) {
    console.error("Error updating quest:", error);
    
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

    // Handle invalid ObjectId errors
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: "Invalid quest ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}