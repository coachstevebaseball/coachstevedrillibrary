import { eq, and } from "drizzle-orm";
import { drillAssignments, assignmentProgress, InsertDrillAssignment, InsertAssignmentProgress } from "../drizzle/schema";
import { getDb } from "./db";

export async function assignDrill(userId: number, drillId: string, drillName: string, notes?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const assignment: InsertDrillAssignment = {
    userId,
    drillId,
    drillName,
    status: "assigned",
    notes: notes || null,
  };

  return await db.insert(drillAssignments).values(assignment);
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
