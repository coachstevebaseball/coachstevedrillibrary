# Full System Audit Report — Coach Steve Drill Library

**Date:** April 22, 2026  
**Site:** coachstevemobilecoach.com  
**TypeScript errors:** 0  
**Dev server:** Running  

---

## Executive Summary

The site is **not too far gone**. The backend compiles cleanly, the auth system works, and there is real data in the database. The core problem is **data fragmentation** — your 265 drills are scattered across 4 disconnected tables, and only 86 are visible to the frontend. The notification system is functional but has 1,787 unread portal notifications piling up. Email delivery works (1,789 sent) with only 26 failures.

---

## 1. DRILL COUNT: Why Only 86 Show Instead of 265

This is the **#1 issue**. Your drills are fragmented across 4 tables that don't talk to each other:

| Table | Rows | Unique DrillIds | In `drills` table? |
|---|---|---|---|
| `drills` | 86 | 86 | Yes (this is the source) |
| `customDrills` | 37 | 37 | **0 of 37** — none merged |
| `drillDetails` | 232 | 232 | **69 of 232** — 163 orphaned |
| `drillVideos` | 221 | 221 | **85 of 221** — 136 orphaned |

**Total unique drillIds across all tables: 265**

**Root cause:** The `drills` table was seeded from the static `drills.ts` file (86 hitting drills). But `drillDetails` and `drillVideos` were populated separately via Supabase/bulk import and contain drills from ALL categories (Hitting, Pitching, Infield, Outfield, Bunting, Baserunning). The 37 `customDrills` were created by you but never merged into the main `drills` table.

**Result:** 179 drills have details, videos, and metadata — but NO entry in the main `drills` table, so the frontend never shows them.

### Fix Plan
Write a consolidation script that:
1. Scans `customDrills`, `drillDetails`, and `drillVideos` for drillIds not in `drills`
2. Creates a `drills` row for each orphan, pulling name/difficulty/category from whichever table has it
3. After consolidation, all 265 drills will be visible and filterable

---

## 2. USER AUTH: Working Correctly

| Check | Status |
|---|---|
| Users in DB | 14 (1 admin + 12 athletes + 1 basic user) |
| All users have openId | Yes — 0 null openIds |
| Auth context reads JWT cookie | Yes — `sdk.authenticateRequest(opts.req)` |
| `protectedProcedure` injects `ctx.user` | Yes |
| Role-based access (admin checks) | Yes — `ctx.user.role !== 'admin'` guards on all admin procedures |
| Frontend `useAuth()` hook | Working — reads from `trpc.auth.me.useQuery()` |
| Athlete portal auth | Working — uses `useAuth()` + `trpc.drillAssignments.*` |

**Auth is NOT broken.** All 14 users have valid openIds linked to Manus OAuth. The `protectedProcedure` correctly injects `ctx.user` from the JWT cookie. The frontend `useAuth()` hook correctly reads auth state.

### What might feel broken
- If athletes log in and see only 86 drills instead of 265, that's the drill fragmentation issue (#1), not an auth issue
- The "GuncNel5on" user (id: 106590046) has `role: "user"` and `isActiveClient: 0` — this is correct (inactive basic user)

---

## 3. NOTIFICATION SYSTEM: Functional But Noisy

| Metric | Value |
|---|---|
| Total notifications | 1,815 |
| Email status: sent | 1,789 (98.6%) |
| Email status: failed | 26 (1.4%) |
| Portal status: unread | 1,787 (98.5%) |
| Portal status: read | 28 (1.5%) |
| Pending email alerts | 2,139 |
| Email log entries | 132 (62 success, 70 failed) |
| Notification preferences configured | 0 users |

### What's working
- **Notification engine** (`notificationEngine.ts`, 497 lines) is fully built: DB persistence, preference checks, Resend email delivery, retry logic, deduplication
- **Resend API key** is configured and working (`coach@coachstevemobilecoach.com`)
- **Portal login alerts** are firing correctly (pendingEmailAlerts shows athlete login tracking)
- **Inactivity alerts** are being generated (recent notifications show "Athlete Inactive" for Emmet Reilly, Nathan Ocampo, Liam Mack)

### What's broken
- **1,787 unread portal notifications** — the notification bell shows "99+" because almost no notifications are being marked as read. The `markAllRead` function exists but users aren't clicking it
- **70 failed emails in emailNotificationLog** — recent failures show `"API key is invalid"` errors, but these are all from test emails to fake addresses (`my-blast@test.com`, `retro-athlete@test.com`) from April 18. Real athlete emails are delivering fine
- **0 notification preferences** — no user has configured their preferences, so everything uses defaults (all notifications enabled)

### Fix Plan
- Clear the 1,787 stale unread notifications (or mark them all read)
- The "API key is invalid" errors are from test data, not a real Resend issue
- Consider auto-marking old notifications as read after 30 days

---

## 4. DATA INVENTORY: What You Have

| Content Type | Count | Status |
|---|---|---|
| Drills (main table) | 86 | Visible on frontend |
| Custom drills | 37 | **Orphaned** — not in main table |
| Drill details | 232 | 163 orphaned, 69 linked |
| Drill videos | 221 | 136 orphaned, 85 linked |
| Drill assignments | 116 | Working |
| Drill favorites | 14 | Working |
| Drill customizations | 144 | Working |
| Session notes | 52 | Working |
| Progress reports | 42 | Working |
| Practice plans | 160 | Working |
| Practice plan blocks | 480 | Working |
| Athlete activity logs | 1,181 | Working |
| Video analyses | 22 | Working |
| Blast sessions | 32 | Working |
| Blast players | 12 | Working |
| Blast metrics | 5 | Working |
| Site content | 100 | Working |
| Quiz questions | 14 | Working |
| Badges | 7 | Working |

---

## 5. CODEBASE HEALTH

| Metric | Value |
|---|---|
| TypeScript errors | **0** |
| Router files | 17 (1 main + 16 feature routers) |
| Total procedures | ~180+ |
| Page files | 31 |
| Registered routes | 28 |
| Main routers.ts | 1,393 lines (large but functional) |
| Main db.ts | ~1,650 lines (large but functional) |
| drillAssignments.ts | 775 lines (separate module, clean) |
| notificationEngine.ts | 497 lines (clean, well-structured) |

### Architecture
The codebase is **large but well-organized**. Feature routers are properly split into separate files. The main `routers.ts` is bloated at 1,393 lines but compiles cleanly. The `db.ts` file at ~1,650 lines should ideally be split into domain-specific modules.

---

## 6. RECOMMENDED FIX PRIORITY

### Priority 1: Consolidate All 265 Drills (fixes the "missing drills" problem)
- Write a one-time script to merge `customDrills` + orphaned `drillDetails` + orphaned `drillVideos` into the `drills` table
- After this, all 265 drills will be visible, filterable, and editable from `/admin/drills`
- Estimated effort: 1 task

### Priority 2: Clear Notification Backlog
- Mark all 1,787 stale unread notifications as read
- Clean up the 2,139 pending email alerts that have already been sent
- Estimated effort: 5 minutes (SQL commands)

### Priority 3: Wire Hero Drill Count to Live DB
- Replace the hardcoded "125+ DRILLS" with actual count from `trpc.drillsDirectory.list`
- Estimated effort: 10 minutes

### Priority 4 (Optional): Split Large Files
- Break `routers.ts` (1,393 lines) into more feature routers
- Break `db.ts` (~1,650 lines) into domain-specific query modules
- This is cleanup, not a fix — everything works as-is

---

## Conclusion

**Do not rebuild.** The system has:
- 14 real users with working auth
- 265 drills with rich metadata (details, videos, customizations)
- 52 session notes, 42 progress reports, 160 practice plans
- 1,181 athlete activity logs
- A working notification engine with Resend email delivery
- 0 TypeScript errors

The single biggest fix is **consolidating the 4 drill tables into 1**. That alone will make all 265 drills visible and restore the full library. Everything else is working — it just needs cleanup, not a rewrite.
