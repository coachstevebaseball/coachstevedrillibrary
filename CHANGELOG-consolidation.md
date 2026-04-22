# Consolidation Sprint Changelog — April 22, 2026

## Summary

Merged all drill content from 4 fragmented database tables into a single unified `drills` table. Cleaned up the notification system. Wired the hero drill count to the live database.

---

## Phase 1: Full DB Backup

- Exported 14 critical tables to `/backups/pre-consolidation-{timestamp}/`
- Tables backed up: drills, customDrills, drillDetails, drillVideos, drillAssignments, drillFavorites, drillCustomizations, notifications, pendingEmailAlerts, emailNotificationLog, notificationPreferences, users, sessionNotes, siteContent
- Total backup size: 17 MB

## Phase 2: Drill Consolidation

### Before
| Source | Count | Notes |
|---|---|---|
| `drills` table | 86 | Main table, all Hitting |
| `customDrills` table | 37 | Coach-created, orphaned |
| `drillDetails` table | 163 orphans | Had goal/description but no main entry |
| `drillVideos` table | 15 orphans | Had videos but no entry anywhere else |
| **Total unique drillIds** | **265** | Scattered across 4 tables |

### After
| Metric | Value |
|---|---|
| Total drills in unified `drills` table | **266** |
| Visible drills | **256** |
| Hidden drills | **10** (9 quarantined + 1 test placeholder) |
| Broken foreign keys | **0** |

### Category Distribution (256 visible)
| Category | Count |
|---|---|
| Hitting | 145 |
| Infield | 69 |
| Pitching | 15 |
| Throwing | 11 |
| Outfield | 10 |
| Bunting | 6 |

### What was merged
- 37 customDrills → inserted with `source: "custom"`, categories/difficulty preserved
- 90 drillDetails orphans → name derived from drillId slug, skillSet mapped to category
- 15 video-only orphans → name derived from drillId slug, category inferred from name keywords
- 72 "Custom" skillSet entries → recategorized using keyword analysis of drillId and goal text

### Schema changes
- `drills.difficulty` → made nullable (many imported drills have no difficulty assigned)
- `drills.duration` → made nullable (many imported drills have no duration)

## Phase 3: Post-Merge CSV

- Generated `drills-post-merge.csv` with all 266 drills and all fields
- Available for review at `/home/ubuntu/usab-drills-directory/drills-post-merge.csv`

## Phase 4: Notification Cleanup

| Action | Count |
|---|---|
| Stale unread notifications archived (>30 days) | 1,178 |
| Sent pending email alerts cleaned (>30 days) | 1,738 |
| Users seeded with notification preferences | 14 |

### Post-cleanup state
| Metric | Value |
|---|---|
| Total notifications | 1,815 |
| Unread notifications | 609 (recent, legitimate) |
| Pending email alerts | 401 |
| Email log entries | 132 |
| Users with preferences | 14 |

## Phase 5: Hero Drill Count

- Removed hardcoded "125+" override from `siteContent` table
- Hero stats now show live values:
  - **Drills**: `allDrills.length` (256 visible)
  - **Categories**: computed from unique categories in drill data (6)
  - **Levels**: computed from unique difficulty values (5: Easy, Medium, Hard, Unknown, null)

## Phase 6: TypeScript Fix

- Updated `UnifiedDrill` interface mapping to handle nullable `difficulty` and `duration`
- `difficulty ?? "Unknown"` and `duration ?? ""` fallbacks applied in useAllDrills.ts

---

## Files Modified

| File | Change |
|---|---|
| `drizzle/schema.ts` | Made `difficulty` and `duration` nullable in drills table |
| `client/src/hooks/useAllDrills.ts` | Added null-coalescing for nullable fields |
| `client/src/pages/Home.tsx` | Hero stats wired to live data instead of hardcoded values |
| `siteContent` DB table | Deleted "125+" override for `home.stat.drills.value` |

## Scripts Created (one-time, not part of app code)

| Script | Purpose |
|---|---|
| `backup-db.mjs` | Full DB backup before writes |
| `consolidate-drills.mjs` | Idempotent drill merge from 4 tables into 1 |
| `fix-categories.mjs` | Category correction pass 1 |
| `fix-categories-v2.mjs` | Category correction pass 2 (keyword-based) |
| `cleanup-notifications.mjs` | Archive stale notifications, seed preferences |
| `generate-csv.mjs` | Post-merge CSV export |
