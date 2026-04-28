# Step 1 Audit Report — coachstevemobilecoach.com

## 1. Route Protection Status

| Route | Component | Protection | Notes |
|-------|-----------|------------|-------|
| `/` | Home (Drill Library) | **PUBLIC** | Anyone can browse all drills without login |
| `/drills` | Redirect → `/` | **PUBLIC** | Redirects to public Home |
| `/drill/:id` | DrillDetail | **PUBLIC** | Anyone can view drill details without login |
| `/accept-invite/:token` | AcceptInvite | **PUBLIC** | Expected — invite flow |
| `/verify-email/:token` | VerifyEmail | **PUBLIC** | Expected — email verification |
| `/athlete-portal` | AthletePortal | **PUBLIC** | Anyone can access athlete portal URL |
| `/athlete-messaging` | AthleteMessaging | **PUBLIC** | Anyone can access messaging |
| `/my-profile` | MyProfile | **PUBLIC** | Anyone can access profile page |
| `/notifications` | NotificationsInbox | **PUBLIC** | Anyone can access notifications |
| `/notifications/preferences` | NotificationPreferences | **PUBLIC** | Anyone can access preferences |
| `/hitting-coach` | HittingCoach | **PUBLIC** | Anyone can access AI hitting coach |
| `/parent-dashboard` | ParentDashboard | **PUBLIC** | Anyone can access parent dashboard |
| `/admin` | AdminDashboard | **PROTECTED** (admin) | Correctly gated |
| `/admin/drills` | AdminDrillEditor | **PROTECTED** (admin) | Correctly gated |
| `/coach-dashboard` | CoachDashboard | **PROTECTED** (admin) | Correctly gated |
| `/drill-generator` | DrillGeneratorPage | **PROTECTED** (admin) | Correctly gated |
| `/manage-drill-videos` | ManageDrillVideos | **PROTECTED** (admin) | Correctly gated |
| `/create-drill-details` | CreateDrillDetails | **PROTECTED** (admin) | Correctly gated |
| `/submissions` | SubmissionsDashboard | **PROTECTED** (admin) | Correctly gated |
| `/user-management` | UserManagement | **PROTECTED** (admin) | Correctly gated |
| `/admin/notifications` | AdminNotifications | **PROTECTED** (admin) | Correctly gated |
| `/coach-messaging` | CoachMessaging | **PROTECTED** (admin) | Correctly gated |
| `/activity-feed` | ActivityFeed | **PROTECTED** (admin) | Correctly gated |
| `/drill-comparison` | DrillComparison | **PROTECTED** (admin) | Correctly gated |
| `/athlete-assessment` | AthleteAssessment | **PROTECTED** (admin) | Correctly gated |
| `/manage-drill-content` | ManageDrillContent | **PROTECTED** (admin) | Correctly gated |
| `/embed` | EmbedHome | **PUBLIC** | Iframe embed — intentionally public? |
| `/embed/drills` | EmbedDrillLibrary | **PUBLIC** | Iframe embed — intentionally public? |
| `/embed/drill/:id` | EmbedDrillDetail | **PUBLIC** | Iframe embed — intentionally public? |
| `/404` | NotFound | **PUBLIC** | Expected |

**Summary:** 12 routes are PUBLIC that should be PROTECTED. 14 admin routes are correctly gated. 3 embed routes and 3 utility routes (invite, verify, 404) are public by design.

## 2. Database Users

| ID | Name | Email | Role | Login Method | Last Signed In |
|----|------|-------|------|-------------|----------------|
| 1 | Coach Steve | coach@coachstevebaseball.com | **admin** | google | Apr 28, 2026 |
| 3390140 | Steven Goldstein | coachstevengoldstein@gmail.com | athlete | google | Apr 27, 2026 |
| 3570024 | Sean Jaeger | seanjae4@gmail.com | athlete | google | Apr 25, 2026 |
| 3690071 | Emmet Reilly | edingers625@gmail.com | athlete | google | Apr 27, 2026 |
| 4950001 | Nathan Ocampo | nathanocampo2011@gmail.com | athlete | email | Feb 25, 2026 |
| 5130618 | Sean Mack | mack_s1@icloud.com | athlete | apple | Apr 21, 2026 |
| 7080335 | Liam Mack | liamgmack51@gmail.com | athlete | email | Feb 19, 2026 |
| 7230001 | Michael Sonsay | powdersoz@yahoo.com | athlete | email | Mar 20, 2026 |
| 101190489 | Jaden Belone | jadenbelone10@gmail.com | athlete | google | Apr 27, 2026 |
| 101370046 | Melissa Caputo | capmel27@gmail.com | athlete | google | Mar 16, 2026 |
| 101400188 | Shannon Caputo | caputomegan@yahoo.com | athlete | google | Mar 17, 2026 |
| 106170046 | Stephen Loewenthal | steve.loewenthal@gmail.com | athlete | google | Apr 16, 2026 |
| 106590046 | Gunnar Nelson | guncnel5on@gmail.com | athlete | email | Apr 23, 2026 |

**Role distribution:** 1 admin, 12 athletes. No users with `coach` or `user` roles. Already clean.

## 3. Active Sessions

Sessions are JWT-based (signed with `JWT_SECRET`, stored in `app_session_id` cookie). There is **no server-side sessions table**. JWTs are signed with 1-year expiration and contain `openId`, `appId`, and `name`. To invalidate all sessions, the simplest approach is to rotate `JWT_SECRET` — all existing JWTs will fail verification and users must re-authenticate.

**Pending invite:** 1 invite with role `athlete`, status `pending`.

## 4. Silently Broken / Orphaned Items Found

- **12 public routes that should be protected:** `/`, `/drill/:id`, `/athlete-portal`, `/athlete-messaging`, `/my-profile`, `/notifications`, `/notifications/preferences`, `/hitting-coach`, `/parent-dashboard`
- **Schema still has 4-role enum:** `["user", "admin", "athlete", "coach"]` — `user` and `coach` are dead roles but still in the enum
- **Invite schema also has 4-role enum:** same dead `user` and `coach` values
- **ProtectedRoute still has `coach` and `user` role-checking logic** that should be removed
- **Embed routes** (`/embed`, `/embed/drills`, `/embed/drill/:id`) are public — need your decision: keep public for iframe embedding, or gate them too?
- **Stale Vite error in dev server log** referencing deleted `PWAInstallBanner.tsx` (cosmetic, clears on restart)
- **EmailBatch ECONNRESET errors** in console — intermittent DB connection resets during batch email processing
