import { eq, and, or, isNull, inArray } from "drizzle-orm";
import { drillAssignments, assignmentProgress, InsertDrillAssignment, InsertAssignmentProgress, users, notifications, invites } from "../drizzle/schema";
import { getDb } from "./db";
import { sendDrillAssignmentEmail } from "./email";

/**
 * Assign a drill to a user or an invited athlete (pre-assignment)
 * @param userId - User ID (for existing users) or null for invite-based assignment
 * @param inviteId - Invite ID (for pre-assigning to invited athletes)
 */
export async function assignDrill(
  userId: number | null, 
  drillId: string, 
  drillName: string, 
  notes?: string, 
  coachName?: string, 
  drillDetails?: { difficulty: string; duration: string },
  inviteId?: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get user or invite email for notification
  let email: string | null = null;
  let name: string | null = null;
  
  if (userId) {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult.length > 0 ? userResult[0] : null;
    email = user?.email || null;
    name = user?.name || null;
  } else if (inviteId) {
    const inviteResult = await db.select().from(invites).where(eq(invites.id, inviteId)).limit(1);
    const invite = inviteResult.length > 0 ? inviteResult[0] : null;
    email = invite?.email || null;
    name = invite?.email?.split('@')[0] || null;
  }

  const assignment: InsertDrillAssignment = {
    userId: userId || undefined,
    inviteId: inviteId || undefined,
    drillId,
    drillName,
    status: "assigned",
    notes: notes || null,
  };

  const result = await db.insert(drillAssignments).values(assignment);

  // Send email notification
  if (email) {
    const portalUrl = `https://coachstevemobilecoach.com/athlete-portal`;
    await sendDrillAssignmentEmail({
      athleteEmail: email,
      athleteName: name || "Athlete",
      drillName,
      drillDifficulty: drillDetails?.difficulty || "Unknown",
      drillDuration: drillDetails?.duration || "Unknown",
      coachNotes: notes,
      coachName,
      portalUrl,
    });
  }

  // Create in-app notification for athlete (only if userId exists)
  if (userId) {
    try {
      await db.insert(notifications).values({
        userId,
        type: "assignment",
        title: "New Drill Assigned",
        message: `You have been assigned the drill: ${drillName}`,
        isRead: 0,
      });
    } catch (err) {
      console.error("[Notification] Failed to create in-app notification:", err);
    }
  }

  return result;
}

/**
 * Link all drill assignments from an invite to a user when they accept
 */
export async function linkInviteAssignmentsToUser(inviteId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Update all assignments with this inviteId to use the new userId
  const result = await db
    .update(drillAssignments)
    .set({ userId })
    .where(eq(drillAssignments.inviteId, inviteId));
  
  console.log(`[DrillAssignments] Linked ${result} assignments from invite ${inviteId} to user ${userId}`);
  
  // Create notifications for the newly linked assignments
  const linkedAssignments = await db
    .select()
    .from(drillAssignments)
    .where(eq(drillAssignments.inviteId, inviteId));
  
  for (const assignment of linkedAssignments) {
    try {
      await db.insert(notifications).values({
        userId,
        type: "assignment",
        title: "Drill Waiting for You",
        message: `You have a drill assigned: ${assignment.drillName}`,
        isRead: 0,
      });
    } catch (err) {
      console.error("[Notification] Failed to create notification for linked assignment:", err);
    }
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

  // First, get assignments directly linked to this user
  const directAssignments = await db.select().from(drillAssignments).where(eq(drillAssignments.userId, userId));
  
  // Also check if this user has any accepted invites, and get assignments linked to those invites
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;
  
  if (user?.email) {
    // Find any invites for this user's email
    const userInvites = await db.select().from(invites).where(eq(invites.email, user.email));
    
    if (userInvites.length > 0) {
      const inviteIds = userInvites.map(i => i.id);
      // Get assignments linked to these invites that don't have userId set yet
      const inviteAssignments = await db.select().from(drillAssignments).where(
        and(
          inArray(drillAssignments.inviteId, inviteIds),
          isNull(drillAssignments.userId)
        )
      );
      
      // Combine both sets of assignments
      return [...directAssignments, ...inviteAssignments];
    }
  }
  
  return directAssignments;
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
