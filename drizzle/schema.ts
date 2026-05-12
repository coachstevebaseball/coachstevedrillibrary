import { boolean, int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["admin", "athlete"]).default("athlete").notNull(),
  /** Whether this user is an active client with access to drills */
  isActiveClient: int("isActiveClient").default(0).notNull(), // 0 = inactive, 1 = active
  /** Email verification status */
  emailVerified: int("emailVerified").default(0).notNull(), // 0 = not verified, 1 = verified
  /** Email verification token */
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  /** Whether welcome email has been sent */
  sentWelcomeEmail: int("sentWelcomeEmail").default(0).notNull(), // 0 = not sent, 1 = sent
  /** Parent user ID for child accounts (null for parent/adult accounts) */
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Set to true when Resend reports a hard bounce for this address */
  emailBounced: boolean("emailBounced").default(false).notNull(),
  /** Set to true when Resend reports a spam complaint for this address */
  emailComplained: boolean("emailComplained").default(false).notNull(),
  /** Incremented on each email.failed webhook event; auto-sets emailBounced at 3 */
  emailFailureCount: int("emailFailureCount").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const drillAssignments = mysqlTable("drillAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Nullable - set when user accepts invite
  inviteId: int("inviteId"), // For pre-assigning drills to invited athletes
  drillId: varchar("drillId", { length: 255 }).notNull(),
  drillName: varchar("drillName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["assigned", "in-progress", "completed"]).default("assigned").notNull(),
  notes: text("notes"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  /** Optional due date for the assignment (for deadline reminders) */
  dueDate: timestamp("dueDate"),
  /** Whether a 24h reminder has already been sent for this assignment */
  reminderSent: int("reminderSent").default(0).notNull(),
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
  role: mysqlEnum("role", ["admin", "athlete"]).default("athlete").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedByUserId: int("acceptedByUserId"),
  /** Track if expiration reminder has been sent */
  reminderSent: int("reminderSent").default(0).notNull(),
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
  // Metadata / tagging fields
  drillType: varchar("drillType", { length: 100 }), // e.g. "Tee", "Soft Toss", "Live BP"
  ageLevel: json("ageLevel").$type<string[]>(), // e.g. ["beginner-drills","intermediate-drills"]
  focusTags: json("focusTags").$type<string[]>(), // e.g. ["bat speed","hip rotation"]
  problemsFix: json("problemsFix").$type<string[]>(), // maps to drills.ts problem[]
  pillars: json("pillars").$type<string[]>(), // coaching pillars/goals
  isHidden: boolean("isHidden").notNull().default(false), // true = hidden from public, preserved for restoration
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


export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Recipient user ID
  recipientEmail: varchar("recipientEmail", { length: 320 }), // Email address for delivery
  type: mysqlEnum("type", [
    "drill_assigned",
    "notes_added",
    "recap_posted",
    "swing_analysis_ready",
    "new_feature_available",
    "feedback_received",
    "submission_received",
    "badge_earned",
    "practice_plan_shared",
    "welcome",
    "system",
    "coach_message",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: varchar("relatedId", { length: 255 }), // ID of related entity
  relatedType: varchar("relatedType", { length: 50 }), // Type: "drill", "assignment", "submission", "session_note", "video_analysis"
  linkUrl: varchar("linkUrl", { length: 500 }), // Direct CTA link to the item in the portal
  // Email delivery tracking
  emailStatus: mysqlEnum("emailStatus", [
    "pending", "queued", "sent", "failed", "delivered", "opened", "clicked"
  ]).default("pending").notNull(),
  // Portal read status
  portalStatus: mysqlEnum("portalStatus", ["unread", "read"]).default("unread").notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  queuedAt: timestamp("queuedAt"),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  failedAt: timestamp("failedAt"),
  // Retry tracking
  retryCount: int("retryCount").default(0).notNull(),
  lastError: text("lastError"),
  // Deduplication key: prevents duplicate notifications for the same event
  dedupeKey: varchar("dedupeKey", { length: 255 }),
  // Flexible metadata JSON
  metadata: json("metadata"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Master toggle
  emailNotifications: int("emailNotifications").default(1).notNull(), // 0 = all emails off, 1 = on
  // Per-type toggles
  drillAssignments: int("drillAssignments").default(1).notNull(),
  notesUpdates: int("notesUpdates").default(1).notNull(),
  recapUpdates: int("recapUpdates").default(1).notNull(),
  swingAnalysis: int("swingAnalysis").default(1).notNull(),
  featureAnnouncements: int("featureAnnouncements").default(1).notNull(),
  feedbackUpdates: int("feedbackUpdates").default(1).notNull(),
  submissionUpdates: int("submissionUpdates").default(1).notNull(),
  badgeUpdates: int("badgeUpdates").default(1).notNull(),
  practicePlanUpdates: int("practicePlanUpdates").default(1).notNull(),
  systemUpdates: int("systemUpdates").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;


export const drillQuestions = mysqlTable("drillQuestions", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId").notNull(),
  drillId: varchar("drillId", { length: 255 }).notNull(),
  question: text("question").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrillQuestion = typeof drillQuestions.$inferSelect;
export type InsertDrillQuestion = typeof drillQuestions.$inferInsert;

export const drillAnswers = mysqlTable("drillAnswers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  coachId: int("coachId").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrillAnswer = typeof drillAnswers.$inferSelect;
export type InsertDrillAnswer = typeof drillAnswers.$inferInsert;


// Custom drills created by admin/coach (not from the original drills.json)
export const customDrills = mysqlTable("customDrills", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  drillType: varchar("drillType", { length: 100 }),
  ageLevel: text("ageLevel"), // JSON stringified array
  focusTags: text("focusTags"), // JSON stringified array
  problemsFix: text("problemsFix"), // JSON stringified array
  pillars: text("pillars"), // JSON stringified array
  isHidden: boolean("isHidden").notNull().default(false), // true = hidden from public, preserved for restoration
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomDrill = typeof customDrills.$inferSelect;
export type InsertCustomDrill = typeof customDrills.$inferInsert;

// Drill card customizations - image, description, difficulty overrides
export const drillCustomizations = mysqlTable("drillCustomizations", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  thumbnailUrl: text("thumbnailUrl"), // S3 URL for custom thumbnail image (legacy)
  imageBase64: longtext("imageBase64"), // Base64 encoded image data for direct storage
  imageMimeType: varchar("imageMimeType", { length: 50 }), // MIME type of the stored image
  briefDescription: text("briefDescription"), // Custom brief description for card
  difficulty: varchar("difficulty", { length: 50 }), // Override difficulty: Easy, Medium, Hard
  category: varchar("category", { length: 100 }), // Override category
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillCustomization = typeof drillCustomizations.$inferSelect;
export type InsertDrillCustomization = typeof drillCustomizations.$inferInsert;


// Coach notes for athlete progress tracking during in-person meetings
export const coachNotes = mysqlTable("coachNotes", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId").notNull(),
  coachId: int("coachId").notNull(),
  note: text("note").notNull(),
  meetingDate: timestamp("meetingDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachNote = typeof coachNotes.$inferSelect;
export type InsertCoachNote = typeof coachNotes.$inferInsert;

// Weekly goals for athlete drill targets
export const weeklyGoals = mysqlTable("weeklyGoals", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId").notNull(),
  coachId: int("coachId").notNull(),
  weekStartDate: timestamp("weekStartDate").notNull(),
  weekEndDate: timestamp("weekEndDate").notNull(),
  targetDrillCount: int("targetDrillCount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyGoal = typeof weeklyGoals.$inferSelect;
export type InsertWeeklyGoal = typeof weeklyGoals.$inferInsert;

// Drill page layouts - modular block-based drill pages
export const drillPageLayouts = mysqlTable("drillPageLayouts", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  // JSON array of content blocks: [{ type: "text", content: "...", style: {...} }, { type: "video", url: "...", ...}, ...]
  blocks: json("blocks").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillPageLayout = typeof drillPageLayouts.$inferSelect;
export type InsertDrillPageLayout = typeof drillPageLayouts.$inferInsert;

// Drill page templates - reusable block layouts
export const drillPageTemplates = mysqlTable("drillPageTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // JSON array of content blocks that can be reused
  blocks: json("blocks").notNull(),
  createdBy: int("createdBy").notNull(),
  isSystem: int("isSystem").default(0).notNull(), // 0 = user template, 1 = system template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DrillPageTemplate = typeof drillPageTemplates.$inferSelect;
export type InsertDrillPageTemplate = typeof drillPageTemplates.$inferInsert;

// Athlete activity tracking for coach alerts
export const athleteActivity = mysqlTable("athleteActivity", {
  id: int("id").autoincrement().primaryKey(),
  athleteId: int("athleteId").notNull(),
  athleteName: varchar("athleteName", { length: 255 }), // Athlete's name for easy identification
  activityType: mysqlEnum("activityType", [
    "portal_login",      // Athlete logged into their portal
    "drill_view",        // Athlete viewed a drill detail page
    "assignment_view",   // Athlete viewed their assignments list
    "drill_start",       // Athlete started working on a drill (marked in-progress)
    "drill_complete",    // Athlete completed a drill
    "video_submit",      // Athlete submitted a video for a drill
    "message_sent",      // Athlete sent a message to coach
    "profile_update",    // Athlete updated their profile
  ]).notNull(),
  // Optional reference to related entity (drillId, assignmentId, submissionId, etc.)
  relatedId: varchar("relatedId", { length: 255 }),
  relatedType: varchar("relatedType", { length: 50 }), // "drill", "assignment", "submission", "message"
  // Additional metadata as JSON (drill name, message preview, etc.)
  metadata: json("metadata"),
  // IP address and user agent for security/analytics
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AthleteActivity = typeof athleteActivity.$inferSelect;
export type InsertAthleteActivity = typeof athleteActivity.$inferInsert;

// Coach alert preferences - which activities trigger notifications
export const coachAlertPreferences = mysqlTable("coachAlertPreferences", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull().unique(),
  // Toggle for each activity type
  alertOnPortalLogin: int("alertOnPortalLogin").default(1).notNull(), // 0 = off, 1 = on
  alertOnDrillView: int("alertOnDrillView").default(1).notNull(),
  alertOnAssignmentView: int("alertOnAssignmentView").default(1).notNull(),
  alertOnDrillStart: int("alertOnDrillStart").default(1).notNull(),
  alertOnDrillComplete: int("alertOnDrillComplete").default(1).notNull(),
  alertOnVideoSubmit: int("alertOnVideoSubmit").default(1).notNull(),
  alertOnMessageSent: int("alertOnMessageSent").default(1).notNull(),
  // Inactivity alerts
  alertOnInactivity: int("alertOnInactivity").default(1).notNull(),
  inactivityDays: int("inactivityDays").default(3).notNull(), // Days before inactivity alert
  // Delivery preferences
  inAppAlerts: int("inAppAlerts").default(1).notNull(),
  emailAlerts: int("emailAlerts").default(1).notNull(), // 0 = off, 1 = on (instant email alerts)
  emailDigest: int("emailDigest").default(0).notNull(), // 0 = off, 1 = daily, 2 = weekly
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachAlertPreference = typeof coachAlertPreferences.$inferSelect;
export type InsertCoachAlertPreference = typeof coachAlertPreferences.$inferInsert;


// Pending email alerts for batching/rate limiting
export const pendingEmailAlerts = mysqlTable("pendingEmailAlerts", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  athleteId: int("athleteId").notNull(),
  athleteName: varchar("athleteName", { length: 255 }),
  activityType: varchar("activityType", { length: 50 }).notNull(),
  activityMessage: text("activityMessage").notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  metadata: json("metadata"),
  // Batch window tracking
  batchKey: varchar("batchKey", { length: 100 }).notNull(), // e.g., "coach_1_athlete_5" for grouping
  scheduledSendAt: timestamp("scheduledSendAt").notNull(), // When this batch should be sent
  isSent: int("isSent").default(0).notNull(), // 0 = pending, 1 = sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PendingEmailAlert = typeof pendingEmailAlerts.$inferSelect;
export type InsertPendingEmailAlert = typeof pendingEmailAlerts.$inferInsert;


// Drill favorites - athletes can star drills for quick access
export const drillFavorites = mysqlTable("drillFavorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: int("drillId").notNull(), // References the drill ID from drills.json
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrillFavorite = typeof drillFavorites.$inferSelect;
export type InsertDrillFavorite = typeof drillFavorites.$inferInsert;


// Smart Baseball Quiz - Questions table
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  scenario: text("scenario").notNull(),
  answers: json("answers").notNull(), // JSON array of 4 answer strings
  correctIndex: int("correctIndex").notNull(), // 0-3 index of correct answer
  explanation: text("explanation").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "count_leverage", "pitch_recognition"
  subcategory: varchar("subcategory", { length: 100 }), // e.g., "0-2 count", "curveball"
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate").notNull(),
  isAiGenerated: int("isAiGenerated").default(0).notNull(), // 0 = manual, 1 = AI generated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// Smart Baseball Quiz - Attempts table (tracks each quiz session)
export const quizAttempts = mysqlTable("quizAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  percentage: int("percentage").notNull(),
  quizType: mysqlEnum("quizType", ["standard", "adaptive"]).default("standard").notNull(),
  targetCategory: varchar("targetCategory", { length: 100 }), // For adaptive quizzes, the weak category targeted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

// Smart Baseball Quiz - Individual question results (for tracking weaknesses)
export const quizQuestionResults = mysqlTable("quizQuestionResults", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  selectedAnswerIndex: int("selectedAnswerIndex").notNull(),
  isCorrect: int("isCorrect").notNull(), // 0 = wrong, 1 = correct
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestionResult = typeof quizQuestionResults.$inferSelect;
export type InsertQuizQuestionResult = typeof quizQuestionResults.$inferInsert;


// Practice Plans - Session planning for coach-athlete sessions
export const practicePlans = mysqlTable("practicePlans", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  athleteId: int("athleteId"), // Nullable - can be a general plan
  inviteId: int("inviteId"), // For pre-assigning to invited athletes
  title: varchar("title", { length: 255 }).notNull(),
  sessionDate: timestamp("sessionDate"), // When the session is scheduled
  duration: int("duration").notNull(), // Total planned duration in minutes
  sessionNotes: text("sessionNotes"), // Coach notes for the session
  focusAreas: json("focusAreas"), // JSON array of focus areas like ["Hitting", "Throwing"]
  status: mysqlEnum("status", ["draft", "scheduled", "completed", "cancelled"]).default("draft").notNull(),
  isShared: int("isShared").default(0).notNull(), // 0 = coach only, 1 = shared with athlete
  isTemplate: int("isTemplate").default(0).notNull(), // 0 = regular plan, 1 = reusable template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PracticePlan = typeof practicePlans.$inferSelect;
export type InsertPracticePlan = typeof practicePlans.$inferInsert;

// Practice Plan Blocks - Individual activities within a practice plan
export const practicePlanBlocks = mysqlTable("practicePlanBlocks", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  sortOrder: int("sortOrder").notNull(),
  blockType: mysqlEnum("blockType", ["drill", "warmup", "cooldown", "break", "custom"]).notNull(),
  drillId: varchar("drillId", { length: 255 }), // Reference to drill from library (nullable for custom blocks)
  title: varchar("title", { length: 255 }).notNull(),
  duration: int("duration").notNull(), // Duration in minutes
  sets: int("sets"), // Optional sets count
  reps: int("reps"), // Optional reps count
  notes: text("notes"), // Block-specific notes
  coachingCues: text("coachingCues"), // Key coaching cues to remember during this block
  keyPoints: text("keyPoints"), // Key teaching points / what to watch for
  equipment: varchar("equipment", { length: 500 }), // Equipment needed for this block
  intensity: mysqlEnum("intensity", ["low", "medium", "high"]), // Intensity level
  goal: varchar("goal", { length: 500 }), // Block-specific goal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PracticePlanBlock = typeof practicePlanBlocks.$inferSelect;
export type InsertPracticePlanBlock = typeof practicePlanBlocks.$inferInsert;


// ============================================================
// Session Notes — Structured post-lesson notes for progress reports
// ============================================================
export const sessionNotes = mysqlTable("sessionNotes", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  athleteId: int("athleteId").notNull(),
  /** Auto-incremented per athlete (Session #1, #2, #3…) */
  sessionNumber: int("sessionNumber").notNull(),
  /** Custom label for the session (defaults to "Session #N", editable by coach) */
  sessionLabel: varchar("sessionLabel", { length: 200 }),
  sessionDate: timestamp("sessionDate").notNull(),
  /** Duration in minutes */
  duration: int("duration"),
  /** JSON array of skill category strings */
  skillsWorked: json("skillsWorked").notNull(), // e.g. ["Swing Mechanics", "Pitch Recognition"]
  /** What improved this session — free text */
  whatImproved: text("whatImproved").notNull(),
  /** What still needs work — free text */
  whatNeedsWork: text("whatNeedsWork").notNull(),
  /** JSON array of homework drill objects [{drillId, drillName}] */
  homeworkDrills: json("homeworkDrills"), // e.g. [{ drillId: "123", drillName: "Front Toss" }]
  /** Coach's internal rating 1-5 (not shown to parents) */
  overallRating: int("overallRating"),
  /** Private coach notes — never included in parent reports */
  privateNotes: text("privateNotes"),
  /** Optional link to a practice plan used during this session */
  practicePlanId: int("practicePlanId"),
  /** Optional link to a Blast Motion session (UUID from blastSessions) */
  blastSessionId: varchar("blastSessionId", { length: 36 }),
  /** Whether this note is shared with the athlete (visible on their portal) */
  sharedWithAthlete: boolean("sharedWithAthlete").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = typeof sessionNotes.$inferInsert;

// ============================================================
// Progress Reports — AI-generated, parent-facing reports
// ============================================================
export const progressReports = mysqlTable("progressReports", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  athleteId: int("athleteId").notNull(),
  /** The session note this report was generated from */
  sessionNoteId: int("sessionNoteId"),
  /** Report title (e.g. "Session #5 Progress Report — Feb 16, 2026") */
  title: varchar("title", { length: 500 }).notNull(),
  /** Full report content as JSON with structured sections */
  reportContent: json("reportContent").notNull(),
  /** The final rendered report text (for email body / display) */
  reportHtml: longtext("reportHtml"),
  /** Status of the report */
  status: mysqlEnum("reportStatus", ["draft", "reviewed", "sent"]).default("draft").notNull(),
  /** When the report was sent to the parent */
  sentAt: timestamp("sentAt"),
  /** Parent email the report was sent to */
  sentToEmail: varchar("sentToEmail", { length: 320 }),
  /** Parent name for personalization */
  sentToName: varchar("sentToName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = typeof progressReports.$inferInsert;

// ============================================================
// Athlete Profiles — Extended player info for coaches & reports
// ============================================================
export const athleteProfiles = mysqlTable("athleteProfiles", {
  id: int("id").autoincrement().primaryKey(),
  /** The user ID this profile belongs to */
  userId: int("userId").notNull().unique(),
  /** Player's date of birth */
  birthDate: timestamp("birthDate"),
  /** Primary position (e.g., SS, CF, RHP) */
  position: varchar("position", { length: 50 }),
  /** Secondary position */
  secondaryPosition: varchar("secondaryPosition", { length: 50 }),
  /** Bats: L, R, S (switch) */
  bats: mysqlEnum("bats", ["L", "R", "S"]),
  /** Throws: L, R */
  throws: mysqlEnum("throws", ["L", "R"]),
  /** Team / organization name */
  teamName: varchar("teamName", { length: 255 }),
  /** JSON array of focus area strings */
  focusAreas: json("focusAreas").$type<string[]>(),
  /** Parent / guardian name */
  parentName: varchar("parentName", { length: 255 }),
  /** Parent / guardian email */
  parentEmail: varchar("parentEmail", { length: 320 }),
  /** Parent / guardian phone */
  parentPhone: varchar("parentPhone", { length: 30 }),
  /** Any notes the coach wants to keep about this player */
  coachProfileNotes: text("coachProfileNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = typeof athleteProfiles.$inferInsert;


// ============================================================
// Video Analysis — AI-powered feedback on athlete video submissions
// ============================================================
export const videoAnalysis = mysqlTable("videoAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  /** The drill submission this analysis belongs to (null for standalone swings) */
  submissionId: int("submissionId"),
  /** Athlete who submitted the video */
  athleteId: int("athleteId").notNull(),
  /** Coach who owns this review (admin) */
  coachId: int("coachId"),
  /** The drill this video is for (null for standalone swings) */
  drillId: varchar("drillId", { length: 255 }),
  /** Type of swing submission */
  swingType: varchar("swingType", { length: 100 }),
  /** Athlete's notes about the swing */
  athleteNotes: text("athleteNotes"),
  /** Whether this is a standalone swing (not tied to a drill) */
  isStandalone: int("isStandalone").default(0).notNull(),
  /** S3 URL of the submitted video */
  videoUrl: text("videoUrl").notNull(),
  /** Pipeline status */
  status: mysqlEnum("analysisStatus", [
    "pending",      // Queued for AI analysis
    "analyzing",    // Gemini is processing
    "analyzed",     // AI feedback ready for coach review
    "reviewed",     // Coach has reviewed/edited
    "approved",     // Coach approved — ready to send
    "sent",         // Feedback emailed to athlete
    "failed",       // AI analysis failed
  ]).default("pending").notNull(),
  /** Raw AI-generated structured feedback as JSON */
  aiFeedback: json("aiFeedback").$type<{
    overallAssessment: string;
    mechanicsBreakdown: {
      phase: string;
      observation: string;
      rating: number; // 1-5
    }[];
    strengths: string[];
    areasForImprovement: string[];
    drillRecommendations: string[];
    coachingCues: string[];
    confidenceScore: number; // 0-100
  }>(),
  /** Coach-edited version of the feedback (what gets sent to athlete) */
  coachEditedFeedback: text("coachEditedFeedback"),
  /** Coach's private notes about this analysis (not sent to athlete) */
  coachNotes: text("coachNotes"),
  /** Error message if analysis failed */
  errorMessage: text("errorMessage"),
  /** When AI analysis completed */
  analyzedAt: timestamp("analyzedAt"),
  /** When coach reviewed */
  reviewedAt: timestamp("reviewedAt"),
  /** When feedback was approved */
  approvedAt: timestamp("approvedAt"),
  /** When feedback email was sent */
  sentAt: timestamp("sentAt"),
  /** Email the feedback was sent to */
  sentToEmail: varchar("sentToEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalysis.$inferInsert;


// ============================================================
// Blast Motion — Normalized 3-tier: Players → Sessions → Metrics
// ============================================================

/** Blast Motion players (may or may not map to a platform user) */
export const blastPlayers = mysqlTable("blastPlayers", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID from Blast export
  fullName: varchar("fullName", { length: 255 }).notNull(),
  /** Optional link to a platform user account */
  userId: int("userId"),
  /** Email from Blast Connect (may differ from portal email) */
  blastEmail: varchar("blastEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlastPlayer = typeof blastPlayers.$inferSelect;
export type InsertBlastPlayer = typeof blastPlayers.$inferInsert;

/** Blast Motion sessions — one per player per date/type */
export const blastSessions = mysqlTable("blastSessions", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  playerId: varchar("playerId", { length: 36 }).notNull(),
  sessionDate: timestamp("sessionDate").notNull(),
  sessionType: varchar("sessionType", { length: 255 }),
  /** Whether this session is visible to the linked athlete on their portal (default true so existing linked sessions are immediately visible) */
  isSharedWithAthlete: boolean("isSharedWithAthlete").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlastSession = typeof blastSessions.$inferSelect;
export type InsertBlastSession = typeof blastSessions.$inferInsert;

/** Blast Motion swing metrics — one row per session (aggregated) */
export const blastMetrics = mysqlTable("blastMetrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 36 }).notNull(),
  // Core metrics
  batSpeedMph: varchar("batSpeedMph", { length: 10 }),
  onPlaneEfficiencyPercent: varchar("onPlaneEfficiencyPercent", { length: 10 }),
  attackAngleDeg: varchar("attackAngleDeg", { length: 10 }),
  exitVelocityMph: varchar("exitVelocityMph", { length: 10 }),
  // Extended Blast Motion metrics
  peakHandSpeedMph: varchar("peakHandSpeedMph", { length: 10 }),
  rotationalAccelerationG: varchar("rotationalAccelerationG", { length: 10 }),
  connectionAtImpactDeg: varchar("connectionAtImpactDeg", { length: 10 }),
  earlyConnectionDeg: varchar("earlyConnectionDeg", { length: 10 }),
  powerKpi: varchar("powerKpi", { length: 10 }),
  timeToContactSec: varchar("timeToContactSec", { length: 10 }),
});
export type BlastMetric = typeof blastMetrics.$inferSelect;
export type InsertBlastMetric = typeof blastMetrics.$inferInsert;


// ============================================================
// Site Content — Inline-editable text overrides for the entire site
// ============================================================
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique key identifying the text element, e.g. "home.hero.badge" or "coach.tab.blastMetrics" */
  contentKey: varchar("contentKey", { length: 500 }).notNull().unique(),
  /** The overridden text value */
  value: text("value").notNull(),
  /** Who last edited this content */
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;


// ============================================================
// Email Notification Log — Track all outbound athlete/parent emails
// ============================================================
export const emailNotificationLog = mysqlTable("emailNotificationLog", {
  id: int("id").autoincrement().primaryKey(),
  /** Recipient user ID (athlete) */
  recipientId: int("recipientId"),
  /** Recipient email address */
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  /** Recipient name */
  recipientName: varchar("recipientName", { length: 255 }),
  /** Email type for categorization */
  emailType: varchar("emailType", { length: 100 }).notNull(), // e.g. "drill_assignment", "metrics_update", "drill_reminder", "milestone", "custom_note"
  /** Email subject line */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Brief description of what triggered this email */
  description: text("description"),
  /** Additional metadata (drill name, metric values, etc.) */
  metadata: json("metadata"),
  /** Whether the email was sent successfully */
  success: int("success").default(1).notNull(), // 0 = failed, 1 = success
  /** Error message if sending failed */
  errorMessage: text("errorMessage"),
  /** Resend email ID for tracking */
  resendId: varchar("resendId", { length: 255 }),
  /** When Resend confirmed delivery (from webhook) */
  deliveredAt: timestamp("deliveredAt"),
  /** When the recipient opened the email (from webhook) */
  openedAt: timestamp("openedAt"),
  /** When the recipient clicked a link in the email (from webhook) */
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailNotificationLog = typeof emailNotificationLog.$inferSelect;
export type InsertEmailNotificationLog = typeof emailNotificationLog.$inferInsert;


// ============================================================
// Coach Activity Log — System-generated events for the coach's Activity Feed
// (Separate from athleteActivity which tracks athlete-initiated actions)
// ============================================================
export const coachActivityLog = mysqlTable("coachActivityLog", {
  id: int("id").autoincrement().primaryKey(),
  /** Event type */
  eventType: varchar("eventType", { length: 100 }).notNull(),
  // e.g. "inactivity_flag", "milestone_reached", "email_sent", "metrics_updated", "assignment_reminder_sent"
  /** Human-readable title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Detailed message */
  message: text("message").notNull(),
  /** Related athlete ID (if applicable) */
  athleteId: int("athleteId"),
  /** Related athlete name */
  athleteName: varchar("athleteName", { length: 255 }),
  /** Additional metadata */
  metadata: json("metadata"),
  /** Severity: info, warning, success */
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  /** Whether the coach has seen/acknowledged this event */
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CoachActivityLog = typeof coachActivityLog.$inferSelect;
export type InsertCoachActivityLog = typeof coachActivityLog.$inferInsert;

export const drillStatCards = mysqlTable("drillStatCards", {
  id: int("id").autoincrement().primaryKey(),
  drillId: varchar("drillId", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("info").notNull(),
  position: int("position").default(0).notNull(),
  isVisible: int("isVisible").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DrillStatCard = typeof drillStatCards.$inferSelect;
export type InsertDrillStatCard = typeof drillStatCards.$inferInsert;

// ============================================================
// Unified Drills Table — single source of truth for all drills
// Replaces the static drills.ts file and the customDrills table
// as the canonical list of drills shown in the directory.
// ============================================================
export const drills = mysqlTable("drills", {
  id: int("id").autoincrement().primaryKey(),
  /** Slug-style unique identifier, e.g. "1-2-3-drill" */
  drillId: varchar("drillId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Constrained to Easy, Medium, Hard. NULL allowed for drills awaiting classification. */
  difficulty: mysqlEnum("difficulty", ["Easy", "Medium", "Hard"]),
  /** JSON array of category strings, e.g. ["Hitting"] */
  categories: json("categories").$type<string[]>().notNull(),
  /** Human-readable duration, e.g. "10m" */
  duration: varchar("duration", { length: 50 }),
  /** External source URL (usabdevelops.com) */
  url: text("url"),
  /** Whether the URL is a direct deep-link to the drill page */
  isDirectLink: boolean("isDirectLink").notNull().default(false),
  /** JSON array of age/level slugs, e.g. ["beginner-drills","intermediate-drills"] */
  ageLevel: json("ageLevel").$type<string[]>(),
  /** JSON array of free-form focus tags */
  tags: json("tags").$type<string[]>(),
  /** JSON array of problem slug strings (legacy filter keys) */
  problem: json("problem").$type<string[]>(),
  /** JSON array of goal slug strings (legacy filter keys) */
  goal: json("goal").$type<string[]>(),
  /** Drill type category, e.g. "Tee Work", "Front Toss" */
  drillType: varchar("drillType", { length: 100 }),
  /** JSON array of canonical problem display labels, e.g. ["Timing Issues","Bat Path Issues"] */
  problems: json("problems").$type<string[]>(),
  /** JSON array of canonical outcome display labels, e.g. ["Improve Barrel Path"] */
  outcomes: json("outcomes").$type<string[]>(),
  /** "static" = seeded from drills.ts, "custom" = coach-created */
  source: varchar("source", { length: 20 }).notNull().default("static"),
  /** Soft-delete: hidden from public listing but preserved in DB */
  isHidden: boolean("isHidden").notNull().default(false),
  /** Admin/coach who created or last modified this drill (null for seeded static drills) */
  createdBy: int("createdBy"),
  /** The primary goal of this drill in plain language */
  goalOfDrill: text("goalOfDrill"),
  /** Who benefits most from this drill */
  whoThisDrillIsBestFor: text("whoThisDrillIsBestFor"),
  /** JSON array of coaching notes (strings) */
  coachingNotes: json("coachingNotes").$type<string[]>(),
  /** JSON array of what this drill helps fix (strings) */
  whatThisDrillHelpsFix: json("whatThisDrillHelpsFix").$type<string[]>(),
  /** JSON array of step-by-step instructions (strings) */
  howToRunTheDrill: json("howToRunTheDrill").$type<string[]>(),
  /** JSON array of common mistakes and corrections (strings) */
  commonMistakes: json("commonMistakes").$type<string[]>(),
  /** Coach Steve's memorable cue phrase */
  coachSteveCue: text("coachSteveCue"),
  /** Explanation of how this drill transfers to game situations */
  gameTransferExplanation: text("gameTransferExplanation"),
  /** Required equipment, e.g. ["tee","bat","balls"]. Null = not authored yet. */
  equipment: json("equipment").$type<string[]>(),
  /** Reps / sets prescription, free text, e.g. "3 sets of 10" or "5 minutes". Null = not authored yet. */
  repsSets: varchar("repsSets", { length: 100 }),
  /** Curated 'try these next' drillIds for the bottom-of-page chip row. Null = derive from tag overlap. */
  nextStepDrillIds: json("nextStepDrillIds").$type<string[]>(),
  /** Drill-of-the-week / Coach's Pick badge for the ★ ribbon. */
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Drill = typeof drills.$inferSelect;
export type InsertDrill = typeof drills.$inferInsert;

// ============================================================
// Player Reports — Coach-authored rich-text reports saved to DB
// and optionally published to the athlete's portal
// ============================================================
export const playerReports = mysqlTable("playerReports", {
  id: int("id").autoincrement().primaryKey(),
  /** The athlete this report is about */
  athleteId: int("athleteId").notNull(),
  /** The coach who authored the report */
  coachId: int("coachId").notNull(),
  /** Report title, e.g. "Spring 2026 Development Report" */
  title: varchar("title", { length: 500 }).notNull(),
  /** Full rendered HTML from the rich-text editor */
  bodyHtml: longtext("bodyHtml"),
  /** Whether this report is visible to the athlete on their portal */
  isSharedWithAthlete: boolean("isSharedWithAthlete").default(false).notNull(),
  /** When the report was first published (set on first Save & Publish) */
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlayerReport = typeof playerReports.$inferSelect;
export type InsertPlayerReport = typeof playerReports.$inferInsert;

// ============================================================
// Email Events — Persisted Resend webhook payloads
// One row per webhook event received from Resend
// ============================================================
export const emailEvents = mysqlTable("emailEvents", {
  id: int("id").autoincrement().primaryKey(),
  /** Resend's unique email ID (e.g. re_abc123) */
  emailId: varchar("emailId", { length: 255 }).notNull(),
  /** Svix delivery ID — used for idempotency dedup */
  svixId: varchar("svixId", { length: 255 }).notNull().unique(),
  /** Resend event type: email.sent, email.delivered, email.bounced, etc. */
  eventType: varchar("eventType", { length: 100 }).notNull(),
  /** Recipient email address */
  recipient: varchar("recipient", { length: 320 }).notNull(),
  /** Full Resend webhook payload for replay/debugging */
  payloadJson: json("payloadJson").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});
export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;

// ============================================================
// Hitting Coach AI Usage — Per-user daily rate limiting
// ============================================================
export const hittingCoachUsage = mysqlTable("hittingCoachUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Date string YYYY-MM-DD for grouping daily usage */
  usageDate: varchar("usageDate", { length: 10 }).notNull(),
  /** Number of messages sent on this date */
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type HittingCoachUsage = typeof hittingCoachUsage.$inferSelect;
export type InsertHittingCoachUsage = typeof hittingCoachUsage.$inferInsert;
