import { eq, and } from "drizzle-orm";
import { drillAssignments, assignmentProgress, InsertDrillAssignment, InsertAssignmentProgress, users } from "../drizzle/schema";
import { getDb } from "./db";
import { sendDrillAssignmentEmail } from "./email";

export async function assignDrill(userId: number, drillId: string, drillName: string, notes?: string, coachName?: string, drillDetails?: { difficulty: string; duration: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get user email and name
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;

  const assignment: InsertDrillAssignment = {
    userId,
    drillId,
    drillName,
    status: "assigned",
    notes: notes || null,
  };

  const result = await db.insert(drillAssignments).values(assignment);

  // Send email notification if user email exists
  if (user?.email) {
    const portalUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://usabdrills-4gdchruk.manus.space"}/athlete-portal`;
    await sendDrillAssignmentEmail({
      athleteEmail: user.email,
      athleteName: user.name || "Athlete",
      drillName,
      drillDifficulty: drillDetails?.difficulty || "Unknown",
      drillDuration: drillDetails?.duration || "Unknown",
      coachNotes: notes,
      coachName,
      portalUrl,
    });
  }

  return result;
}

export async function unassignDrill(assignmentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.delete(drillAssignments).where(eq(drillAssignments.id, assignmentId));
}

export async function updateAssignmentStatus(assignmentId: number, status: "assigned" | "in-progress" | "completed") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = { status };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  return await db.update(drillAssignments).set(updateData).where(eq(drillAssignments.id, assignmentId));
}

export async function getUserAssignments(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(drillAssignments).where(eq(drillAssignments.userId, userId));
}

export async function getAllAssignments() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(drillAssignments);
}

export async function getAssignmentById(assignmentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(drillAssignments).where(eq(drillAssignments.id, assignmentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function recordProgress(assignmentId: number, userId: number, repsCompleted: number, notes?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const progress: InsertAssignmentProgress = {
    assignmentId,
    userId,
    repsCompleted,
    notes: notes || null,
  };

  return await db.insert(assignmentProgress).values(progress);
}

export async function getAssignmentProgress(assignmentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(assignmentProgress).where(eq(assignmentProgress.assignmentId, assignmentId));
}
