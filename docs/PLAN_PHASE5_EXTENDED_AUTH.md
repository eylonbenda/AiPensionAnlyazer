# Plan: Phase 5 Extended Auth (no implementation yet)

Scope: add **Google OAuth**, **refresh tokens**, **password reset**, **email verification**, and **roles/admin** on top of the existing email/password + JWT auth.

---

## Current state

- **Auth:** Email/password register + login; access JWT (7d); `JwtAuthGuard` on document/analysis/tasks/jobs.
- **User model:** `id`, `email` (unique), `passwordHash`, `name?`, `createdAt`, `updatedAt`. No `role`, no `emailVerified`, no OAuth fields.

---

## 1. Schema & data model changes

**Prisma (`packages/database/prisma/schema.prisma`)**

- **User**
  - `passwordHash` → optional (nullable), for OAuth-only users who never set a password.
  - `emailVerified Boolean @default(false)` – set `true` after verification or when user signs in via Google (if we trust Google’s email).
  - `googleId String? @unique` – Google subject id for “Sign in with Google”; one account per Google id.
  - `role String @default("USER")` – e.g. `"USER"` | `"ADMIN"` (or an enum `UserRole`).
- **RefreshToken** (new model, or store in existing table)
  - Option A – new model: `id`, `userId`, `token` (hashed or random), `expiresAt`, `revokedAt?`, `createdAt`. Index on `token` (or hash) for lookup.
  - Option B – store only in DB with same shape; token sent to client is opaque id or signed JWT (refresh JWT with short expiry and jti).
- **PasswordResetToken** (or generic “verification token” table)
  - `id`, `userId`, `token` (random), `expiresAt`, `usedAt?`, `type` (e.g. `PASSWORD_RESET` | `EMAIL_VERIFY`). Optional: single table for both reset and verify.

**Domain (`packages/domain`)**

- Add `UserRole` type and extend `User` with `role`, `emailVerified`, and optionally `googleId` (only if exposed in API).

**Migrations**

- One migration for User changes + RefreshToken (+ optional PasswordResetToken/VerificationToken). Backfill: existing users get `emailVerified: false`, `role: "USER"`, `passwordHash` stays required for them.

---

## 2. Google OAuth

**Dependencies**

- `passport-google-oauth20` (or `passport-google-oauth2`), `@nestjs/passport` already in use.

**Config**

- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (e.g. `http://localhost:3000/auth/google/callback` for dev). Document in `.env.example`.

**Flow**

1. **GET /auth/google** – redirect to Google consent (Passport Google strategy).
2. **GET /auth/google/callback** – Google redirects with code; exchange for profile; receive `email`, `id` (sub), `name`, etc.
3. **Logic**
   - Find user by `googleId`. If found → login (issue access + refresh tokens).
   - Else find by `email`. If found → link Google: set `googleId`, optionally set `emailVerified = true`, then login.
   - Else → create new user: `email`, `googleId`, `name`, `passwordHash: null`, `emailVerified: true`, `role: USER`, then login.
4. **Response**
   - Either redirect to a frontend URL with tokens in query/fragment (e.g. `?accessToken=...&refreshToken=...`) or return JSON (if callback is API-style). Plan should pick one (e.g. redirect to SPA with tokens).

**Guards / strategies**

- Add `GoogleStrategy` (Passport). Keep existing `JwtStrategy` and `JwtAuthGuard`; Google flow ends with issuing the same JWT format so existing guarded routes work.

---

## 3. Refresh tokens

**Design**

- Access token: short-lived (e.g. 15–60 min). Refresh token: long-lived (e.g. 7–30 days), stored in DB, one-time use or family (optional rotation).
- Client sends refresh token to **POST /auth/refresh** (body: `{ refreshToken }`); server validates, optionally rotates, returns new `accessToken` (+ optionally new `refreshToken`).

**Schema**

- `RefreshToken` model: `id`, `userId`, `tokenHash` (or store token and hash on verify), `expiresAt`, `revokedAt?`, `createdAt`. Index on token (or tokenHash) and `userId`.

**API**

- **POST /auth/refresh** – body `{ refreshToken: string }`. Validate, check not revoked and not expired, optionally revoke and create new refresh token, issue new access token (and optionally new refresh token). Return `{ accessToken, refreshToken?, expiresIn }`.

**AuthService**

- `createRefreshToken(userId)`, `validateRefreshToken(token)`, `revokeRefreshToken(token)` (or by id). Call `createRefreshToken` from login and Google callback; call `validateRefreshToken` in refresh endpoint.

**Config**

- Env: `JWT_ACCESS_EXPIRY` (e.g. `15m`), `JWT_REFRESH_EXPIRY` (e.g. `7d`). Keep `JWT_SECRET` for signing (same or separate secret for refresh).

---

## 4. Password reset

**Flow**

1. **POST /auth/forgot-password** – body `{ email }`. If user exists and has `passwordHash` (local account), create a short-lived token (e.g. 1h), store in DB (PasswordResetToken or generic verification table), send email with link containing token (e.g. `https://app.example.com/reset-password?token=...`). Response: always 200 with generic message “If an account exists, you will receive an email” (no email enumeration).
2. **POST /auth/reset-password** – body `{ token, newPassword }`. Validate token (exists, not expired, not used), set `user.passwordHash`, mark token used. Return 200 or 401.

**Schema**

- Tokens: e.g. `VerificationToken` with `userId`, `token`, `expiresAt`, `usedAt?`, `type: PASSWORD_RESET | EMAIL_VERIFY`.

**Email**

- Need a minimal email sender (e.g. Nodemailer, SendGrid, or SES). Config: `SMTP_*` or `SENDGRID_API_KEY` etc. For dev, optional “log to console” or Mailhog. Plan should assume one transport and document env vars.

---

## 5. Email verification

**Flow**

1. On **register** (email/password): create user with `emailVerified: false`, create verification token (e.g. 24h), send email with link (e.g. `https://app.example.com/verify-email?token=...`). Optionally still return access token so user is “logged in” but with limited access until verified (or require verification before login – plan should pick one; “logged in, limited until verified” is common).
2. **GET or POST /auth/verify-email** – query or body `token`. Validate token, set `user.emailVerified = true`, mark token used. Redirect to frontend or return JSON.
3. **Optional:** Middleware or guard that checks `emailVerified` for sensitive operations; or only require it for certain actions (e.g. export). Document the rule.

**Schema**

- Same `VerificationToken` (or equivalent) with `type: EMAIL_VERIFY`.

**Google**

- When user signs in with Google, set `emailVerified: true` for that user (trust Google’s email).

---

## 6. Roles / admin

**Schema**

- `User.role` enum or string: `USER`, `ADMIN` (and optionally more later). Default `USER`. Migration: backfill existing users to `USER`.

**Authorization**

- **Guard:** e.g. `RolesGuard` that reads `req.user.role` (set by JwtStrategy) and checks allowed roles per route (e.g. `@Roles('ADMIN')`).
- **Admin-only endpoints (examples):**
  - List all users (e.g. `GET /admin/users`).
  - Optional: impersonate or act on behalf of user (advanced; can be later).
- **Registration:** New signups get `role: USER`. Admin creation: either seed script, or an admin-only `POST /admin/users` (or invite flow later).

**Domain**

- Export `UserRole` and extend `User` with `role` in domain and DTOs where needed.

---

## 7. Implementation order (recommended)

1. **Schema + migration** – User (optional `passwordHash`, `emailVerified`, `googleId`, `role`), RefreshToken, VerificationToken (or equivalent). Migrate; backfill.
2. **Roles** – Add `role` to User, `RolesGuard`, `@Roles()` decorator, one admin-only route (e.g. list users). Keeps later work consistent.
3. **Refresh tokens** – Create/validate/revoke in DB, shorten access token expiry, add **POST /auth/refresh**, return refresh token from login and register (and later Google).
4. **Google OAuth** – Strategy, GET /auth/google, GET /auth/google/callback, link or create user, issue access + refresh tokens.
5. **Password reset** – Token creation + storage, POST /auth/forgot-password, POST /auth/reset-password, email sending (with chosen transport).
6. **Email verification** – Token on register, send email, GET or POST /auth/verify-email; set `emailVerified`; optionally guard or soft limit until verified.

---

## 8. Config / env summary

- Existing: `JWT_SECRET`, `DATABASE_URL`, etc.
- New: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`; `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` (optional, with defaults); email transport (e.g. `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, or `SENDGRID_API_KEY`); optional `FRONTEND_URL` for reset/verify links.

---

## 9. Docs & rules to update (when implementing)

- `docs/ARCHITECTURE.md` – auth flows (Google, refresh, reset, verify), new endpoints, role checks.
- `docs/DATABASE-SCHEMA.md` – User fields, RefreshToken, VerificationToken, enums.
- `docs/FEATURE_LOG.md` – Phase 5 extended entry.
- `.cursor/rules/pension-architecture.mdc` – auth patterns (OAuth, refresh, roles).
- `.env.example` – all new variables.

---

## 10. Out of scope for this plan

- Other OAuth providers (e.g. GitHub, Microsoft) – same pattern, add later if needed.
- Rate limiting on auth endpoints (recommended in production; can be separate task).
- Captcha on register/forgot-password (recommended in production; separate task).
- Full admin CRUD for users (only “list users” and role assignment are in scope as a minimal set).
