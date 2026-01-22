import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "athlete", "coach"]).default("user").notNull(),
  /** Whether this user is an active client with access to drills */
  isActiveClient: int("isActiveClient").default(0).notNull(), // 0 = inactive, 1 = active
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const drillAssignments = mysqlTable("drillAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 255 }).notNull(),
  drillName: varchar("drillName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["assigned", "in-progress", "completed"]).default("assigned").notNull(),
  notes: text("notes"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillAssignment = typeof drillAssignments.$inferSelect;
export type InsertDrillAssignment = typeof drillAssignments.$inferInsert;

export const assignmentProgress = mysqlTable("assignmentProgress", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  userId: int("userId").notNull(),
  repsCompleted: int("repsCompleted").default(0).notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type AssignmentProgress = typeof assignmentProgress.$inferSelect;
export type InsertAssignmentProgress = typeof assignmentProgress.$inferInsert;
export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  inviteToken: varchar("inviteToken", { length: 255 }).notNull().unique(),
  role: mysqlEnum("role", ["user", "admin", "athlete", "coach"]).default("user").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedByUserId: int("acceptedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

export const drillVideos = mysqlTable("drillVideos", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  videoUrl: text("videoUrl").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillVideo = typeof drillVideos.$inferSelect;
export type InsertDrillVideo = typeof drillVideos.$inferInsert;

export const drillDetails = mysqlTable("drillDetails", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  skillSet: varchar("skillSet", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(),
  athletes: varchar("athletes", { length: 255 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  equipment: varchar("equipment", { length: 255 }).notNull(),
  goal: text("goal").notNull(),
  description: json("description").$type<string[]>().notNull(), // Array of step descriptions
  commonMistakes: json("commonMistakes").$type<string[]>(), // Array of common mistakes
  progressions: json("progressions").$type<string[]>(), // Array of progression steps
  instructions: text("instructions"), // Custom instructions entered by coach
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillDetail = typeof drillDetails.$inferSelect;
export type InsertDrillDetail = typeof drillDetails.$inferInsert;

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: varchar("badgeType", { length: 100 }).notNull(), // "first_drill", "five_day_streak", "master_hitting", etc.
  badgeName: varchar("badgeName", { length: 255 }).notNull(), // "First Drill Completed", "5-Day Streak", etc.
  badgeDescription: text("badgeDescription"),
  badgeIcon: varchar("badgeIcon", { length: 50 }), // emoji or icon name
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const drillSubmissions = mysqlTable("drillSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 255 }).notNull(),
  notes: text("notes"), // Athlete's text notes
  videoUrl: text("videoUrl"), // S3 URL to uploaded video
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillSubmission = typeof drillSubmissions.$inferSelect;
export type InsertDrillSubmission = typeof drillSubmissions.$inferInsert;

export const coachFeedback = mysqlTable("coachFeedback", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  coachId: int("coachId").notNull(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 255 }).notNull(),
  feedback: text("feedback").notNull(), // Coach's written feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachFeedback = typeof coachFeedback.$inferSelect;
export type InsertCoachFeedback = typeof coachFeedback.$inferInsert;
