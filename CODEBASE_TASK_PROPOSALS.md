# Codebase task proposals

This audit identifies four small, independently actionable maintenance tasks. The
findings are proposals only; the underlying production and test code has not been
changed as part of this audit.

## 1. Typo: hyphenate “pull-side” in drill instructions

**Finding:** The built-in “Two Tee Front Toss” equipment instructions use
“pullside field.” Elsewhere in baseball writing, and in the same sense as
“opposite field,” the compound modifier should be written “pull-side.”

**Location:** `client/src/pages/DrillDetail.tsx`, in the fallback drill data near
the “One tee set up…” instructions.

**Proposed task:** Change “pullside field” to “pull-side field,” then search the
stored/generated drill content for other instances so the UI does not present two
spellings of the term.

**Acceptance criteria:**

- The fallback instruction reads “pull-side field.”
- No user-facing source string contains “pullside.”
- Existing drill-detail tests and the TypeScript check pass.

## 2. Bug: preserve the requested role in invitation emails

**Finding:** `createInvite` accepts either an `admin` or `athlete` role and stores
that role on the invitation, but it always passes `inviteType: "athlete"` to
`sendInviteEmail`. An administrator invitation will therefore receive athlete
wording even though accepting it grants the administrator role.

**Location:** `server/invites.ts`, in `createInvite` immediately before the email
service call.

**Proposed task:** Derive the email's invite type from `role` (mapping `admin` to
the email service's `coach` type if that is the intended product terminology) and
add coverage for both supported roles.

**Acceptance criteria:**

- Athlete invitations call `sendInviteEmail` with `inviteType: "athlete"`.
- Administrator invitations call it with the product-approved non-athlete type.
- The stored role and email wording cannot diverge for any accepted input role.

## 3. Documentation: correct what `acceptInvite` does

**Finding:** The function comment says “Accept an invite and create user account,”
but the implementation explicitly queries an existing user and throws when the
account is absent. It then updates that user's role and activation state; it never
creates a user account.

**Location:** `server/invites.ts`, the documentation comment above `acceptInvite`
and the existing-user check inside that function.

**Proposed task:** Rewrite the comment to say that the function accepts an invite
for an existing account, applies the invited role/activation state, and links
preassigned drills. Document the missing-user error as a precondition or thrown
error.

**Acceptance criteria:**

- The comment no longer claims that `acceptInvite` creates an account.
- The documented preconditions and side effects match the implementation.
- No runtime behavior changes as part of this documentation-only task.

## 4. Test improvement: replace the placeholder invitation suite

**Finding:** All four cases in `server/invites.test.ts` finish with
`expect(true).toBe(true)`. They do not invoke `createInvite`, `isInviteValid`, or
`acceptInvite`, so they remain green if invitation behavior breaks. The imports
and mocks already suggest that this file was intended to contain unit tests.

**Location:** `server/invites.test.ts`.

**Proposed task:** Replace the placeholders with database-chain fakes and email
spies. Assert normalized email and stored role, the generated URL and email
payload for both roles, expiration/status validation, and the role/activation
updates performed during acceptance. This test work should include the regression
case from task 2.

**Acceptance criteria:**

- No unconditional truth assertion remains in `server/invites.test.ts`.
- Each named test invokes the production function named by its scenario.
- The tests fail if invitation email type is hard-coded to athlete.
- The invitation test file runs without a live database or network access.
