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
    // Debug logging
    console.log(`[Database] upsertUser called - openId: ${user.openId}, ENV.ownerOpenId: ${ENV.ownerOpenId}, match: ${user.openId === ENV.ownerOpenId}`);
    
    // Check if user already exists and has admin role - preserve it
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    const existingRole = existingUser.length > 0 ? existingUser[0].role : null;
    console.log(`[Database] Existing user role: ${existingRole}`);
    
    // Always ensure owner has admin role, or preserve existing admin role
    if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
      console.log(`[Database] Setting admin role for owner: ${user.openId}`);
    } else if (existingRole === 'admin') {
      // Preserve existing admin role
      values.role = 'admin';
      updateSet.role = 'admin';
      console.log(`[Database] Preserving existing admin role for: ${user.openId}`);
    } else if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (existingRole) {
      // Preserve existing role if user already exists
      values.role = existingRole;
      // Don't update role if it already exists
    } else {
      // Assign 'athlete' role to new OAuth users by default (this is an athlete platform)
      values.role = 'athlete';
      values.isActiveClient = 1;
      updateSet.role = 'athlete';
      updateSet.isActiveClient = 1;
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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

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

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user role: database not available");
    return false;
  }

  try {
    await db.update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    return false;
  }
}

export async function markWelcomeEmailSent(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark welcome email sent: database not available");
    return false;
  }

  try {
    await db.update(users)
      .set({ sentWelcomeEmail: 1 })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark welcome email sent:", error);
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


// ============= DRILL Q&A FUNCTIONS =============

import { drillQuestions, drillAnswers } from "../drizzle/schema";

export async function createDrillQuestion(data: {
  athleteId: number;
  drillId: string;
  question: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create question: database not available");
    return null;
  }

  try {
    const result = await db.insert(drillQuestions).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create drill question:", error);
    throw error;
  }
}

export async function getDrillQuestions(drillId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get questions: database not available");
    return [];
  }

  try {
    return await db.select().from(drillQuestions).where(eq(drillQuestions.drillId, drillId));
  } catch (error) {
    console.error("[Database] Failed to get drill questions:", error);
    return [];
  }
}

export async function getAthleteQuestions(athleteId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get questions: database not available");
    return [];
  }

  try {
    return await db.select().from(drillQuestions).where(eq(drillQuestions.athleteId, athleteId));
  } catch (error) {
    console.error("[Database] Failed to get athlete questions:", error);
    return [];
  }
}

export async function getAllQuestions() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get questions: database not available");
    return [];
  }

  try {
    return await db.select().from(drillQuestions);
  } catch (error) {
    console.error("[Database] Failed to get all questions:", error);
    return [];
  }
}

export async function getQuestionWithAnswers(questionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get question: database not available");
    return null;
  }

  try {
    const question = await db.select().from(drillQuestions).where(eq(drillQuestions.id, questionId)).limit(1);
    
    if (question.length === 0) return null;
    
    const answers = await db.select().from(drillAnswers).where(eq(drillAnswers.questionId, questionId));
    
    return { ...question[0], answers };
  } catch (error) {
    console.error("[Database] Failed to get question with answers:", error);
    return null;
  }
}

export async function createDrillAnswer(data: {
  questionId: number;
  coachId: number;
  answer: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create answer: database not available");
    return null;
  }

  try {
    const result = await db.insert(drillAnswers).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create drill answer:", error);
    throw error;
  }
}

export async function getAnswersByQuestion(questionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get answers: database not available");
    return [];
  }

  try {
    return await db.select().from(drillAnswers).where(eq(drillAnswers.questionId, questionId));
  } catch (error) {
    console.error("[Database] Failed to get answers by question:", error);
    return [];
  }
}


// Bulk import drill descriptions
export async function bulkImportDrillDescriptions(
  drillsData: Array<{ drillName: string; description: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const drill of drillsData) {
    try {
      const { drillDetails } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Find drill by name to get drillId
      const drillId = drill.drillName.toLowerCase().replace(/\s+/g, "-");
      
      // Check if detail already exists
      const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
      
      const descriptionArray = drill.description.split("\n").filter((line: string) => line.trim());
      
      if (existing.length > 0) {
        // Update existing
        await db.update(drillDetails).set({
          description: descriptionArray,
          updatedAt: new Date(),
        }).where(eq(drillDetails.drillId, drillId));
      } else {
        // Insert new
        await db.insert(drillDetails).values({
          drillId,
          skillSet: "Hitting",
          difficulty: "Intermediate",
          athletes: "1",
          time: "10 min",
          equipment: "Bat, Ball",
          goal: "",
          description: descriptionArray,
          createdBy: 1,
        });
      }
      success++;
    } catch (error) {
      failed++;
      errors.push(`Failed to import "${drill.drillName}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { success, failed, errors };
}

// Bulk import drill goals
export async function bulkImportDrillGoals(
  goalsData: Array<{ drillName: string; goal: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const drill of goalsData) {
    try {
      const { drillDetails } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Find drill by name to get drillId
      const drillId = drill.drillName.toLowerCase().replace(/\s+/g, "-");
      
      // Check if detail already exists
      const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
      
      if (existing.length > 0) {
        // Update existing
        await db.update(drillDetails).set({
          goal: drill.goal,
          updatedAt: new Date(),
        }).where(eq(drillDetails.drillId, drillId));
      } else {
        // Insert new
        await db.insert(drillDetails).values({
          drillId,
          skillSet: "Hitting",
          difficulty: "Intermediate",
          athletes: "1",
          time: "10 min",
          equipment: "Bat, Ball",
          goal: drill.goal,
          description: [],
          createdBy: 1,
        });
      }
      success++;
    } catch (error) {
      failed++;
      errors.push(`Failed to import goal for "${drill.drillName}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { success, failed, errors };
}


// Update drill goal by drill name
export async function updateDrillGoal(drillName: string, goal: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { drillDetails } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Convert drill name to drillId format
  const drillId = drillName.toLowerCase().replace(/\s+/g, "-");
  
  // Check if detail already exists
  const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
  
  if (existing.length > 0) {
    // Update existing
    await db.update(drillDetails).set({
      goal: goal,
      updatedAt: new Date(),
    }).where(eq(drillDetails.drillId, drillId));
  } else {
    // Insert new
    await db.insert(drillDetails).values({
      drillId,
      skillSet: "Custom",
      difficulty: "Medium",
      athletes: "Varies",
      time: "Varies",
      equipment: "Varies",
      goal: goal,
      description: [],
      createdBy: 1,
    });
  }
  return true;
}

// Update drill instructions by drill name
export async function updateDrillInstructions(drillName: string, instructions: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { drillDetails } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Convert drill name to drillId format
  const drillId = drillName.toLowerCase().replace(/\s+/g, "-");
  
  // Check if detail already exists
  const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
  
  if (existing.length > 0) {
    // Update existing
    await db.update(drillDetails).set({
      instructions: instructions,
      updatedAt: new Date(),
    }).where(eq(drillDetails.drillId, drillId));
  } else {
    // Insert new
    await db.insert(drillDetails).values({
      drillId,
      skillSet: "Custom",
      difficulty: "Medium",
      athletes: "Varies",
      time: "Varies",
      equipment: "Varies",
      goal: "Custom Drill",
      description: [],
      instructions: instructions,
      createdBy: 1,
    });
  }
  return true;
}


// Create a completely new drill
export async function createNewDrill(
  drillData: {
    name: string;
    difficulty: string;
    category: string;
    duration: string;
    goal?: string;
    instructions?: string;
    videoUrl?: string;
  },
  userId: number
): Promise<{ success: boolean; drillId: string; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, drillId: "", error: "Database not available" };
  }

  try {
    const { drillDetails, drillVideos } = await import("../drizzle/schema");
    
    // Generate drillId from name
    const drillId = drillData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Check if drill already exists
    const existing = await db.select().from(drillDetails).where(eq(drillDetails.drillId, drillId));
    if (existing.length > 0) {
      return { success: false, drillId, error: "A drill with this name already exists" };
    }
    
    // Insert drill details
    await db.insert(drillDetails).values({
      drillId,
      skillSet: drillData.category,
      difficulty: drillData.difficulty,
      athletes: "Varies",
      time: drillData.duration,
      equipment: "Varies",
      goal: drillData.goal || "",
      description: [],
      instructions: drillData.instructions || "",
      createdBy: userId,
    });
    
    // If video URL provided, save it too
    if (drillData.videoUrl) {
      const existingVideo = await db.select().from(drillVideos).where(eq(drillVideos.drillId, drillId));
      if (existingVideo.length > 0) {
        await db.update(drillVideos).set({
          videoUrl: drillData.videoUrl,
          updatedAt: new Date(),
        }).where(eq(drillVideos.drillId, drillId));
      } else {
        await db.insert(drillVideos).values({
          drillId,
          videoUrl: drillData.videoUrl,
          uploadedBy: userId,
        });
      }
    }
    
    // Also add to the drills.json file by writing to a custom drills table
    // For now, we'll store custom drills in the database and merge them at runtime
    const { customDrills } = await import("../drizzle/schema");
    await db.insert(customDrills).values({
      drillId,
      name: drillData.name,
      difficulty: drillData.difficulty,
      category: drillData.category,
      duration: drillData.duration,
      createdBy: userId,
    });
    
    return { success: true, drillId };
  } catch (error) {
    console.error("[Database] Failed to create new drill:", error);
    return { success: false, drillId: "", error: String(error) };
  }
}

// Get all custom drills
export async function getCustomDrills() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const { customDrills } = await import("../drizzle/schema");
    return await db.select().from(customDrills);
  } catch (error) {
    console.error("[Database] Failed to get custom drills:", error);
    return [];
  }
}

