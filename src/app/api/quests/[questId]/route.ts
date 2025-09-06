import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "firebase-admin";
import { initAdminApp } from "@/lib/firebase/admin.config";
import CONSTANTS from "@/lib/constants";
import dbConnect from "@/lib/db/db";
import QuestModel, { QuestType, QuestPriority, QuestState, formatQuest } from "@/lib/models/server/quest";
import UserModel from "@/lib/models/server/user";
import { XPService } from "@/lib/services/xp";
import { XPAction } from "@/types/gamification";

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

// PUT - Update quest state and other properties
export async function PUT(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const user = await authenticateUser();
    const { questId } = params;

    // Validate questId
    if (!questId || typeof questId !== 'string') {
      return NextResponse.json(
        { error: "Invalid quest ID" },
        { status: 400 }
      );
    }

    // Parse request body
    let body: UpdateQuestRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
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

    // Get the current quest to check for state changes
    const currentQuest = await QuestModel.findOne({ _id: questId, user: user._id });
    if (!currentQuest) {
      return NextResponse.json(
        { error: "Quest not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Find and update quest
    const quest = await QuestModel.findOneAndUpdate(
      { _id: questId, user: user._id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Award XP for state changes
    let xpResult = null;
    if (body.state && body.state !== currentQuest.state) {
      try {
        let xpAction: XPAction | null = null;
        
        if (body.state === QuestState.IN_PROGRESS && currentQuest.state === QuestState.OPEN) {
          xpAction = XPAction.QUEST_IN_PROGRESS;
        } else if (body.state === QuestState.DONE && currentQuest.state !== QuestState.DONE) {
          xpAction = XPAction.QUEST_COMPLETED;
        }

        if (xpAction) {
          xpResult = await XPService.awardXP(user._id.toString(), xpAction, {
            questId: quest._id.toString(),
            questTitle: quest.title,
            questType: quest.type,
            previousState: currentQuest.state,
            newState: body.state
          });
        }
      } catch (error) {
        console.error("Error awarding XP for quest state change:", error);
        // Don't fail the quest update if XP awarding fails
      }
    }

    // Format and return updated quest
    const formattedQuest = formatQuest(quest);

    // Include XP result in response if available
    const response: any = { quest: formattedQuest };
    if (xpResult) {
      response.xpAwarded = xpResult;
    }

    return NextResponse.json(response);

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

// DELETE - Remove quest
export async function DELETE(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const user = await authenticateUser();
    const { questId } = params;

    // Validate questId
    if (!questId || typeof questId !== 'string') {
      return NextResponse.json(
        { error: "Invalid quest ID" },
        { status: 400 }
      );
    }

    // Find and delete quest
    const quest = await QuestModel.findOneAndDelete({
      _id: questId,
      user: user._id
    });

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found or does not belong to user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Quest deleted successfully" });

  } catch (error: any) {
    console.error("Error deleting quest:", error);
    
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