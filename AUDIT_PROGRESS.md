# Platform Audit Progress

## Completed (Phase 1 - Identity Bug)
- Data repair: Nikole Kelly assignment 2970011 linked to userId 115140046, invite 1110001 marked accepted
- Code fix: `server/routers.ts` updateStatus (line ~554-583) - fallback for assignment.userId===null checks inviteId ownership
- Code fix: `server/invites.ts` acceptInvite (line ~98-126) - handles expired invites if email matches, idempotent re-acceptance

## Completed (Phase 3 - Invite Flow Hardening)
- Email normalization: `createInvite()` now lowercases+trims email before insert and email send
- Conflict detection: New `checkInviteConflicts` query procedure checks for existing user, pending/accepted/expired invites
- Guard on createInvite: blocks if active athlete exists or pending invite exists (unless force=true)

## In Progress (Phase 3 continued)
- Need to update UserManagement.tsx invite dialog to use checkInviteConflicts before sending
- Need to update AssignDrillsPanel.tsx to filter out expired/pending invites from athlete options

## Remaining Phases
- Phase 2: Assignment flow hardening (prevent assigning to expired/pending invites, deactivated users)
- Phase 3: Overview page (Needs Attention section, quick actions, recent activity)
- Phase 4: Athletes Table (warning badges, expanded actions, more columns)
- Phase 5: User Management (tabs, duplicate detection, merge/repair)
- Phase 6: Manage Videos (searchable manager replacing long form list)
- Phase 7: Athlete Portal (better error messages, View as Athlete banner, mobile)

## Key File Locations
- server/routers.ts: Main tRPC router (invites router at line ~1042, updateStatus at ~538)
- server/invites.ts: Invite logic (createInvite, acceptInvite, isInviteValid)
- server/drillAssignments.ts: Assignment helpers (linkInviteAssignmentsToUser, getUserAssignments)
- client/src/pages/UserManagement.tsx: Admin invite/user management UI
- client/src/components/dashboard/AssignDrillsPanel.tsx: Drill assignment UI (athleteOptions at line 55-75)
- client/src/components/AthleteTable.tsx: Athletes table component
- drizzle/schema.ts: DB schema (users, drillAssignments, invites tables)

## Architecture Notes
- Auth: Manus OAuth, JWT session cookies, role-based (admin/athlete)
- DB: MySQL (TiDB) via Drizzle ORM
- Email: Resend API, From: coach@longislandhittingcoach.com, Reply-To: coachstevengoldstein@gmail.com
- Domain: https://coachsteve.manus.space
- Color theme: Navy/Cream/Gold (oklch values)
- Tests: 383/385 passing (2 CSP env config failures - EMBED_ALLOWED_ORIGINS needs update)
