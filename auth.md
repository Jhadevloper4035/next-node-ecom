# Authentication & Authorization System — Design Plan

Access Token + Refresh Token architecture with email verification (Nodemailer), password reset/forgot flows, and full session management.

---

## 1. Data Models

| Model | Key Fields |
|---|---|
| **User** | email, password (hashed), `isVerified`, `role`/`permissions`, `failedLoginAttempts`, `lockedUntil`, timestamps |
| **RefreshToken / Session** | hashed token, `userId`, `deviceInfo`, `ipAddress`, `expiresAt`, `isRevoked`, `replacedByToken` (rotation chain) |
| **EmailVerificationToken** | `userId`, hashed token, `expiresAt`, `purpose` |
| **PasswordResetToken** | `userId`, hashed token, `expiresAt` (kept separate from verification — different expiry/invalidation rules) |

> 🔴 **Critical:** Never store raw tokens (refresh, verification, reset) in the DB. Store a SHA-256 hash of them — same principle as password hashing. If the DB leaks, raw tokens = instant account takeover.

---

## 2. Registration & Email Verification

1. User submits email + password → validate email format, password strength
2. Hash password (bcrypt/argon2, tuned cost factor)
3. Create user with `isVerified: false`
4. Generate verification token (random 32-byte string, **not** JWT), hash it, store with short expiry (15–30 min)
5. Send email via Nodemailer: `https://app.com/verify?token=xxx&uid=xxx`
6. On click: hash incoming token, compare, mark `isVerified: true`, delete/invalidate token
7. Provide a **resend verification** endpoint

> 🔴 **Critical points people miss:**
> - Rate-limit the resend endpoint (attackers spam email queues otherwise)
> - Decide: can an unverified user log in at all? (Common pattern: allow login, block sensitive actions until verified)
> - Verification link must be **single-use** — invalidate immediately after success

---

## 3. Login & Token Issuance

1. Verify email/password
2. Check `lockedUntil` / failed attempt count **before** password check runs (avoids timing leaks)
3. On success: issue **access token** (JWT, short-lived: 10–15 min) + **refresh token** (opaque random string, long-lived: 7–30 days)
4. Store refresh token (hashed) in DB tied to a session/device record
5. Return access token in response body; refresh token as **httpOnly, Secure, SameSite=Strict cookie**

> 🔴 **Critical:** Never put the refresh token in localStorage or a JS-readable cookie. This is the #1 real-world mistake — XSS = instant token theft if it's JS-accessible.

---

## 4. Access Token Design

- Keep JWT payload minimal: `userId`, `role`, `iat`, `exp` — avoid embedding permission arrays that change often (stale token = stale permissions until expiry)
- Sign with a strong secret, or RS256 keypair if multiple services need to verify tokens independently
- Short expiry is your main defense — limits damage window if stolen

---

## 5. Refresh Token Rotation

*(The part most tutorials skip — get this right.)*

- Every refresh → issue a **brand-new** refresh token, invalidate the old one
- Store a `replacedByToken` chain to detect reuse
- **🔴 Critical — reuse detection:** if a dead (already-rotated) refresh token is used again, that's a theft signal. Immediately revoke the **entire token family** (all sessions descended from it) and force re-login
- Enforce max concurrent sessions per user, if relevant to the product

---

## 6. Logout & Session Management

- **Single-device logout:** revoke that specific refresh token record
- **Logout everywhere:** revoke all refresh tokens for `userId` — needed after password change, suspicious activity, or user request
- Consider an **"active sessions" list** UI (device, location, last active) — good security UX, painful to bolt on later if not planned now

---

## 7. Forgot Password / Reset Flow

1. User submits email → **always return a generic response** ("if that email exists, we sent a link") — never reveal whether the email is registered
2. Generate reset token (same pattern as verification), short expiry (15–30 min), hashed in DB
3. Email the reset link
4. On submit: validate token + expiry, set new password, **invalidate the reset token**
5. **🔴 Critical:** On successful reset, revoke **all** existing sessions/refresh tokens for that user
6. Send a confirmation email ("your password was changed") — lets the real user notice if it wasn't them

---

## 8. Change Password (while logged in)

- Require current password re-entry — don't rely on session alone
- Same rule: revoke other sessions on change (keep the current session alive)

---

## 9. Authorization Layer (separate from authentication)

- Middleware order: `verifyAccessToken` → `attachUser` → `checkRole/Permission`
- Prefer **permission-based** checks over hardcoded role strings if the system will grow (`canManageInventory` vs `role === 'admin'`)
- Decide early: role hierarchy vs flat permissions — retrofitting later is painful

---

## 10. Nodemailer / Email Infrastructure

- Use a transactional provider (SES, SendGrid, Postmark) via SMTP — not a personal Gmail account (gets rate-limited/flagged)
- Templates needed: verification, password reset, password-changed alert, new-device-login alert (optional)
- **🔴 Critical:** Email sending must be **async/non-blocking** — don't make the HTTP response wait on the SMTP round-trip. Use a queue (BullMQ/Redis or even a simple in-process one)
- Handle send failures gracefully — log and allow resend; don't let a failed email crash registration

---

## 11. Rate Limiting & Abuse Prevention

- Login: rate limit by **IP and by email** (prevents distributed brute-force on one account)
- Account lockout after N failed attempts, with exponential backoff or timed lock
- Reset/verification endpoints: rate limit hard — prime targets for email-bombing abuse
- Consider CAPTCHA on registration/login if automated abuse appears

---

## 12. Commonly Forgotten Pieces

- ⚠️ Password change/reset must invalidate all refresh tokens
- ⚠️ Timing-safe comparison for token/password checks (`crypto.timingSafeEqual` for token hashes)
- ⚠️ CORS config for cookie-based refresh tokens — needs `credentials: true` + exact origin match, not wildcard
- ⚠️ CSRF protection if using cookies for refresh tokens (double-submit cookie pattern, or rely on SameSite=Strict)
- ⚠️ Token cleanup — TTL index (MongoDB) or cron job for expired tokens
- ⚠️ Clock skew tolerance on JWT verification
- ⚠️ Consistent error messages on login failure ("invalid credentials" — not "wrong password" vs "user not found")
- ⚠️ Separate signing secrets for access vs refresh tokens, rotate-able independently
- ⚠️ Audit logging: login attempts, password changes, token revocations

---

## 13. Optional — Worth Deciding Now, Not Later

- 2FA/TOTP as a future add-on → add `isTwoFactorEnabled` flag to User model now to avoid a schema migration later
- "New device/location login" email alerts
- Soft delete vs hard delete, and what happens to sessions/tokens on account deletion

---

## 14. Implementation Rules

*Constraints to follow while building this — keep any AI assistant or contributor inside these guardrails.*

- **DRY (Don't Repeat Yourself)** — one function for token generation, one for token verification, one for email sending. No copy-pasted logic across login/register/reset flows; they should all call the same shared helpers.
- **Single Responsibility per function/module** — a controller handles request/response only; business logic lives in services; DB access lives in models/repositories. Don't mix all three in one function.
- **Human-readable over clever** — plain `if/else` and named variables beat one-line ternary chains or nested callbacks. Code should read like a description of the flow, not a puzzle.
- **No over-engineering** — don't build abstractions (factories, generic strategy patterns, config-driven pipelines) for things that only ever have one implementation. Add abstraction only when a second real use case actually shows up.
- **Prefer existing/available libraries over custom code** — use well-established packages for things like JWT (`jsonwebtoken`), hashing (`bcrypt`/`argon2`), validation (`zod`/`joi`), rate limiting (`express-rate-limit`), email (`nodemailer`). Don't hand-roll crypto, token parsing, or validation logic that a maintained library already does correctly.
- **No unnecessary new dependencies** — before adding a package, check if something already in the stack can do the job. Match this to Navroj's existing convention: minimize new npm packages, stay within what the repo already uses.
- **Follow existing repo conventions** — naming, folder structure, error-handling style, response format should match the rest of the codebase, not introduce a new pattern just for auth.
- **Flat, shallow logic** — avoid deep nesting; use early returns/guard clauses instead of wrapping the main logic in multiple `if` levels.
- **Small, focused files** — one concern per file (`token.service.js`, `email.service.js`, `auth.controller.js`) rather than one large `auth.js` doing everything.
- **Config over hardcoding** — token expiry times, cookie settings, rate-limit thresholds go in a config/env file, not scattered as magic numbers in the code.
- **Comment the "why," not the "what"** — code should be clear enough to not need comments explaining what it does; reserve comments for non-obvious security decisions (e.g., why a token is revoked, why a response is intentionally generic).
- **One feature complete before the next** — finish and test registration + verification fully before starting login; finish login + tokens before starting reset flow. No half-built parallel pieces.

---

### Suggested Build Order

1. User model + registration + email verification
2. Login + access/refresh token issuance
3. Refresh rotation + reuse detection
4. Logout (single + all devices) + session listing
5. Forgot/reset password flow
6. Change password flow
7. Authorization middleware + RBAC/permissions
8. Rate limiting + account lockout
9. Audit logging
10. Optional: 2FA, device alerts