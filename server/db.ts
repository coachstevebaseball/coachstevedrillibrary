import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, notifications, notificationPreferences, InsertNotificationPreference } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and, desc, count } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else {
      // Assign 'user' role to new OAuth users by default
      values.role = 'user';
      // Only set role on insert, not on update (don't override existing roles)
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Client access management functions
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

export async function toggleClientAccess(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot toggle client access: database not available");
    return false;
  }

  try {
    await db.update(users)
      .set({ isActiveClient: isActive ? 1 : 0 })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to toggle client access:", error);
    return false;
  }
}

export async function convertUserToAthlete(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot convert user: database not available");
    return false;
  }

  try {
    await db.update(users)
      .set({ role: 'athlete' })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to convert user to athlete:", error);
    return false;
  }
}

// Drill video management functions
export async function saveOrUpdateDrillVideo(drillId: string, videoUrl: string, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save drill video: database not available");
    return false;
  }

  try {
    const { drillVideos } = await import("../drizzle/schema");
    
    // Check if video already exists
    const existing = await db.select().from(drillVideos).where(eq(drillVideos.drillId, drillId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing video
      await db.update(drillVideos)
        .set({ videoUrl, updatedAt: new Date() })
        .where(eq(drillVideos.drillId, drillId));
    } else {
      // Insert new video
      await db.insert(drillVideos).values({
        drillId,
        videoUrl,
        uploadedBy: userId,
      });
    }
    
    return true;
  } catch (error) {
    console.error("[Database] Failed to save drill video:", error);
    return false;
  }
}

export async function getDrillVideo(drillId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get drill video: database not available");
    return null;
  }

  try {
    const { drillVideos } = await import("../drizzle/schema");
    const result = await db.select().from(drillVideos).where(eq(drillVideos.drillId, drillId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get drill video:", error);
    return null;
  }
}

export async function getAllDrillVideos() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get drill videos: database not available");
    return [];
  }

  try {
    const { drillVideos } = await import("../drizzle/schema");
    return await db.select().from(drillVideos);
  } catch (error) {
    console.error("[Database] Failed to get drill videos:", error);
    return [];
  }
}

export async function deleteDrillVideo(drillId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete drill video: database not available");
    return false;
  }

  try {
    const { drillVideos } = await import("../drizzle/schema");
    await db.delete(drillVideos).where(eq(drillVideos.drillId, drillId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete drill video:", error);
    return false;
  }
}


// Drill Details Management
export async function saveDrillDetail(drillId: string, detail: {
  skillSet: string;
  difficulty: string;
  athletes: string;
  time: string;
  equipment: string;
  goal: string;
  description: string[];
  commonMistakes?: string[];
  progressions?: string[];
}, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save drill detail: database not available");
    return false;
  }

  try {
    const { drillDetails } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Check if detail already exists
    const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
    
    if (existing.length > 0) {
      // Update existing
      await db.update(drillDetails).set({
        skillSet: detail.skillSet,
        difficulty: detail.difficulty,
        athletes: detail.athletes,
        time: detail.time,
        equipment: detail.equipment,
        goal: detail.goal,
        description: detail.description,
        commonMistakes: detail.commonMistakes || null,
        progressions: detail.progressions || null,
        updatedAt: new Date(),
      }).where(eq(drillDetails.drillId, drillId));
    } else {
      // Insert new
      await db.insert(drillDetails).values({
        drillId,
        skillSet: detail.skillSet,
        difficulty: detail.difficulty,
        athletes: detail.athletes,
        time: detail.time,
        equipment: detail.equipment,
        goal: detail.goal,
        description: detail.description,
        commonMistakes: detail.commonMistakes || null,
        progressions: detail.progressions || null,
        createdBy: userId,
      });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to save drill detail:", error);
    return false;
  }
}

export async function getDrillDetail(drillId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get drill detail: database not available");
    return null;
  }

  try {
    const { drillDetails } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const result = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get drill detail:", error);
    return null;
  }
}

export async function deleteDrillDetail(drillId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete drill detail: database not available");
    return false;
  }

  try {
    const { drillDetails } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.delete(drillDetails).where(eq(drillDetails.drillId, drillId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete drill detail:", error);
    return false;
  }
}

export async function saveDrillInstructions(drillId: string, instructions: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save drill instructions: database not available");
    return false;
  }

  try {
    const { drillDetails } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Check if detail already exists
    const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
    
    if (existing.length > 0) {
      // Update existing
      await db.update(drillDetails).set({
        instructions: instructions,
        updatedAt: new Date(),
      }).where(eq(drillDetails.drillId, drillId));
    } else {
      // Insert new with just instructions
      await db.insert(drillDetails).values({
        drillId,
        instructions: instructions,
        description: [],
        skillSet: "Custom",
        difficulty: "Medium",
        athletes: "Varies",
        time: "Varies",
        equipment: "Varies",
        goal: "Custom Drill",
        createdBy: userId,
      });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to save drill instructions:", error);
    return false;
  }
}

export async function saveDrillGoal(drillId: string, goal: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save drill goal: database not available");
    return false;
  }

  try {
    const { drillDetails } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    // Check if detail already exists
    const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
    
    if (existing.length > 0) {
      // Update existing
      await db.update(drillDetails).set({
        goal: goal,
        updatedAt: new Date(),
      }).where(eq(drillDetails.drillId, drillId));
    } else {
      // Insert new with just goal
      await db.insert(drillDetails).values({
        drillId,
        goal: goal,
        description: [],
        skillSet: "Custom",
        difficulty: "Medium",
        athletes: "Varies",
        time: "Varies",
        equipment: "Varies",
        createdBy: userId,
      });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to save drill goal:", error);
    return false;
  }
}


// ============= DRILL SUBMISSIONS & FEEDBACK =============

import { drillSubmissions, coachFeedback, InsertDrillSubmission, InsertCoachFeedback } from "../drizzle/schema";

export async function createDrillSubmission(submission: InsertDrillSubmission) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create submission: database not available");
    return null;
  }

  try {
    const result = await db.insert(drillSubmissions).values(submission);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create drill submission:", error);
    throw error;
  }
}

export async function getSubmissionsByAssignment(assignmentId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get submissions: database not available");
    return [];
  }

  try {
    const result = await db.select().from(drillSubmissions).where(eq(drillSubmissions.assignmentId, assignmentId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get submissions:", error);
    return [];
  }
}

export async function getSubmissionsByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get submissions: database not available");
    return [];
  }

  try {
    const result = await db.select().from(drillSubmissions).where(eq(drillSubmissions.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get user submissions:", error);
    return [];
  }
}

export async function updateDrillSubmission(submissionId: number, updates: Partial<InsertDrillSubmission>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update submission: database not available");
    return false;
  }

  try {
    await db.update(drillSubmissions).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(drillSubmissions.id, submissionId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update submission:", error);
    return false;
  }
}

export async function deleteDrillSubmission(submissionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete submission: database not available");
    return false;
  }

  try {
    await db.delete(drillSubmissions).where(eq(drillSubmissions.id, submissionId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete submission:", error);
    return false;
  }
}

export async function createCoachFeedback(feedback: InsertCoachFeedback) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create feedback: database not available");
    return null;
  }

  try {
    const result = await db.insert(coachFeedback).values(feedback);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create coach feedback:", error);
    throw error;
  }
}

export async function getFeedbackBySubmission(submissionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback: database not available");
    return [];
  }

  try {
    const result = await db.select().from(coachFeedback).where(eq(coachFeedback.submissionId, submissionId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get feedback:", error);
    return [];
  }
}

export async function getFeedbackByDrill(drillId: string, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback: database not available");
    return [];
  }

  try {
    const result = await db.select().from(coachFeedback)
      .where(and(eq(coachFeedback.drillId, drillId), eq(coachFeedback.userId, userId)));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get drill feedback:", error);
    return [];
  }
}

export async function updateCoachFeedback(feedbackId: number, feedback: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update feedback: database not available");
    return false;
  }

  try {
    await db.update(coachFeedback).set({
      feedback,
      updatedAt: new Date(),
    }).where(eq(coachFeedback.id, feedbackId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update feedback:", error);
    return false;
  }
}

export async function deleteCoachFeedback(feedbackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete feedback: database not available");
    return false;
  }

  try {
    await db.delete(coachFeedback).where(eq(coachFeedback.id, feedbackId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete feedback:", error);
    return false;
  }
}


// ============ NOTIFICATIONS ============

export async function createNotification(data: {
  userId: number;
  type: "submission" | "feedback" | "badge" | "assignment" | "system";
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId || null,
      relatedType: data.relatedType || null,
      actionUrl: data.actionUrl || null,
      isRead: 0,
    });
    return result;
  } catch (error) {
    console.error("[DB] Error creating notification:", error);
    return null;
  }
}

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return result;
  } catch (error) {
    console.error("[DB] Error fetching notifications:", error);
    return [];
  }
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)))
      .orderBy(desc(notifications.createdAt));
    return result;
  } catch (error) {
    console.error("[DB] Error fetching unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(eq(notifications.id, notificationId));
    return true;
  } catch (error) {
    console.error("[DB] Error marking notification as read:", error);
    return false;
  }
}

export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
    return true;
  } catch (error) {
    console.error("[DB] Error deleting notification:", error);
    return false;
  }
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error fetching notification preferences:", error);
    return null;
  }
}

export async function createOrUpdateNotificationPreferences(userId: number, data: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) return null;

  try {
    const existing = await getNotificationPreferences(userId);
    
    if (existing) {
      await db
        .update(notificationPreferences)
        .set(data)
        .where(eq(notificationPreferences.userId, userId));
      return await getNotificationPreferences(userId);
    } else {
      const result = await db.insert(notificationPreferences).values({
        userId,
        ...data,
      });
      return await getNotificationPreferences(userId);
    }
  } catch (error) {
    console.error("[DB] Error creating/updating notification preferences:", error);
    return null;
  }
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[DB] Error getting unread notification count:", error);
    return 0;
  }
}
