# Notification System Audit — Build Plan

## Existing Infrastructure

### Email
- `server/email.ts` — Resend integration with branded templates:
  - `sendDrillAssignmentEmail` (drill assigned to athlete)
  - `sendWelcomeEmail` (new athlete welcome)
  - `sendInviteEmail` (invite to join)
  - `sendActivityAlertEmail` (coach alerts for athlete activity)
  - `sendDrillFollowUpReminder` (follow-up on incomplete drills)
  - `sendPracticePlanShareEmail` (practice plan shared)
  - `sendVideoAnalysisFeedbackEmail` (video feedback)
- `server/emailService.ts` — Additional email helpers (streak reminders, verification, expiration)
- `server/emailBatching.ts` — Batch processor (5-min window, checks every 60s), started in `_core/index.ts`
- From address: `coach@coachstevemobilecoach.com`

### Activity Tracking
- `athleteActivity` table — tracks portal_login, drill_view, assignment_view, drill_start, drill_complete, video_submit, message_sent, profile_update
- `server/activityTracking.ts` — logActivity(), getRecentActivities(), getActivitySummary(), getInactiveAthletes(), getAthletesLastSeen()
- `server/routers-activity.ts` — tRPC procedures for activity feed, inactive athletes, alert preferences
- `client/src/pages/ActivityFeed.tsx` — Existing coach activity feed page with 3 tabs: Live Feed, Inactive Athletes (3+ days), Alert Settings

### Coach Alert Preferences
- `coachAlertPreferences` table — per-activity-type toggles + inAppAlerts + emailAlerts + emailDigest
- Default inactivityDays = 3

### Scheduled Jobs
- `startBatchProcessor()` — runs every 60s, processes pending email batches
- `runStreakReminderJob()` — manual trigger from admin dashboard (not auto-scheduled)

### Blast Metrics (for Use Case B)
- `blastMetrics` table — batSpeedMph, exitVelocityMph, onPlaneEfficiencyPercent, attackAngleDeg
- `blastSessions` table — sessionDate, sessionType, playerId
- `blastPlayers` table — linked to users via userId
- `addSession` and `updateSession` procedures in `routers-blast-metrics.ts`
- `bulkImportSessions` procedure
- Athlete-facing: `getMyBlastData` procedure

### Drill Assignments
- `drillAssignments` table — userId, drillId, drillName, status (assigned/in-progress/completed), assignedAt, completedAt
- Assignment procedures in routers.ts under `drillAssignments` router
- Existing `sendFollowUpReminder` mutation (manual, coach-triggered)

### Notifications
- `notifications` table — userId, type, title, message, isRead, actionUrl
- `notificationPreferences` table — per-user toggles

## What Needs to Be Built

### 1. New DB Tables
- `emailNotificationLog` — track all outbound athlete emails (type, recipient, sentAt, metadata)
  - Used for: deduplication, coach activity feed, click tracking
- `scheduledJobLog` — track when scheduled jobs run and their results

### 2. New Email Templates (athlete-facing)
- **Use Case A**: Pre-Lesson Prep — "New video assigned for review before your next session"
- **Use Case B**: Metrics Update — "New swing metrics have been posted to your dashboard"
- **Use Case D**: Drill Reminder (24h deadline) — "Your drill assignment is due within 24 hours"
- **Use Case E**: Milestone Congratulation — "You've completed your 10th drill this month!"

### 3. Scheduled Jobs (add to server startup alongside batch processor)
- **Inactivity Checker (Use Case C)**: Every 6 hours, check athletes inactive 7+ days, log to activity feed
- **Drill Deadline Reminder (Use Case D)**: Every hour, find assignments due within 24h, send reminder email
- **Milestone Checker (Use Case E)**: After each drill_complete, check if 10th of month, send congrats email

### 4. Hook Points for Auto-Emails
- **Use Case A**: When coach assigns a drill/video → already has `assignDrill` mutation → add email trigger there
  - Also need to log when athlete clicks/watches → already tracked via `drill_view` activity
- **Use Case B**: When `addSession` or `updateSession` is called in blast metrics router → send email to linked athlete
- **Use Case C**: Scheduled job checks `getInactiveAthletes(7)` → logs "Inactive for 7 days" to activity feed (NO email to athlete)
- **Use Case D**: Scheduled job checks assignments with deadline approaching → send reminder email
  - Need: deadline field on drillAssignments (currently missing — add `dueDate` column)
- **Use Case E**: After `drill_complete` activity → count completions this month → if 10th, send congrats

### 5. Enhanced Activity Feed
- Current feed already exists at `/activity-feed` with Live Feed, Inactive Athletes, Alert Settings
- Enhancements needed:
  - Add "system" events: inactivity flags, email sent logs, milestone events
  - Add new activity types: `metrics_update`, `inactivity_flag`, `milestone_reached`, `email_sent`
  - Show email delivery status in feed
  - Change inactivity threshold from 3 days to 7 days (per user request)

### 6. Manual Coach Actions
- "Send custom note" — coach types a message, system emails it to athlete
  - New tRPC mutation: `notifications.sendCustomNote`
  - New email template: custom note from coach

## Implementation Order
1. Schema changes (emailNotificationLog, dueDate on assignments, new activity types)
2. Email templates (5 new templates)
3. Hook blast metrics update → auto-email (Use Case B)
4. Hook drill assignment → email with tracking (Use Case A — mostly exists)
5. Scheduled jobs: inactivity checker, drill reminder, milestone checker
6. Enhanced activity feed UI
7. Manual "send custom note" feature
8. Tests
