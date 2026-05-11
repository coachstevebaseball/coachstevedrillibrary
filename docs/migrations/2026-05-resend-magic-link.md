# Resend Magic Link Migration — 2-Week Plan

**Status:** planned
**Drafted:** 2026-05-11
**Target completion:** 2026-05-25
**Owner:** Coach Steve (`coachstevebaseball`)

## Goal

Replace Manus OAuth (`server/_core/oauth.ts`) with passwordless email auth using Resend, keeping all existing users signed in by linking on email.

## Current state

- **Auth today:** Manus OAuth — `GET /api/oauth/callback` exchanges code → user info → upserts user by `openId` and issues a 1-year session cookie via `sdk.createSessionToken`.
- **Resend already wired:** transactional sends go through `server/email.ts` / `server/emailService.ts`.
- **Schema is half-ready:** `users` already has `emailVerified`, `emailVerificationToken`, `emailBounced`, `emailComplained`, `emailFailureCount`.

## Week 1 — build alongside existing auth

| Day | Work |
|---|---|
| 1 | Add `loginTokens` table (id, userId, tokenHash, expiresAt, usedAt, createdAt). Drizzle migration. |
| 2 | New tRPC route `auth.requestMagicLink({ email })`. Looks up or creates user by email (role=`athlete` default), generates random 32-byte token, stores SHA-256 hash, emails magic link via Resend. Rate-limit per email using existing `express-rate-limit`. |
| 3 | New Express route `GET /api/auth/magic-callback?token=...`. Verifies token (not expired, not used, single-use), upserts session cookie using the same `COOKIE_NAME` + `sdk.createSessionToken` flow we have today. |
| 4 | New `LoginPage` state machine: email input → "Check your email" panel → user clicks link in email → lands on `/api/auth/magic-callback` → session cookie set → redirect to role-based home (existing `RootRedirect` already handles this). |
| 5 | Tests for token issuance, single-use, expiry, rate limit, hard-bounce path (`emailBounced=true` should refuse to send). |
| 6 | Wire Resend webhook event handling for `email.bounced` / `email.complained` to magic-link emails (we already track these for other sends). |
| 7 | Feature flag `ENABLE_MAGIC_LINK=true` defaulting off. Internal test on Coach Steve's account. |

## Week 2 — cutover & retire Manus OAuth

| Day | Work |
|---|---|
| 8 | Toggle flag on in production. Both flows live — login page shows email field plus a "Sign in another way" link to Manus OAuth. |
| 9 | Watch metrics (sign-ins, magic-link conversion, bounces, Resend dashboard). |
| 10 | Move the "Sign in another way" link below the fold; magic link becomes the default call to action. |
| 11 | Notify users via in-app banner: "We're moving to email-only sign-in next week." |
| 12 | Remove `registerOAuthRoutes` from server bootstrap. Keep the `users.openId` column — existing users link via email, openId stays as a unique key for backward compatibility on already-issued session cookies. |
| 13 | Remove `@manus/...` SDK calls that only OAuth used; keep session signing helpers. |
| 14 | Buffer for any straggler bugs. Write a one-page runbook for "user can't get the magic link" (check bounced flag, check spam, resend, manual user lookup). |

## Risks

1. **Deliverability** — verify the sending domain in Resend (DKIM/SPF). The `emailBounced` / `emailComplained` flags must actually suppress sends, not just record state.
2. **Single-device assumption** — magic links assume the user opens the email on the same device they typed their address. Some won't. Decide whether the verification page is allowed cross-device.
3. **Token security** — store only the SHA-256 hash, expire in ≤ 15 min, single-use, invalidate prior tokens for the same user on new request.
4. **Existing sessions** — current `sdk.createSessionToken` cookies last `ONE_YEAR_MS`. Cutover should not invalidate them; users only re-authenticate when their cookie expires.
5. **Admin accounts** — Coach Steve's account must link cleanly by email before cutover; do a manual dry run on day 7.

## Acceptance criteria

- [ ] New users can sign up via magic link end-to-end.
- [ ] Existing users keep their session and get a magic link on next login.
- [ ] Bounced / complained addresses can't be re-spammed.
- [ ] Magic-link emails arrive in < 30 s for ≥ 99% of requests.
- [ ] Removing OAuth routes does not break any currently-logged-in user.

## Rollback plan

If anything goes wrong after day 8: flip `ENABLE_MAGIC_LINK=false`, leave Manus OAuth wired up. Day 12+ removals are reversible via git revert until the SDK is uninstalled.
