# Module 1: Authentication & Authorization

**Priority:** Medium | **Phase:** Phase 2  
**Build Order:** 1 (After Setup & Configuration)  
**Estimated Requirements:** ~32 Functional Requirements

---

## Module Overview

The Authentication & Authorization module is the security backbone of the entire HR Recruitment Platform. It governs how every user — candidates, company admins, recruiters, interviewers, and the super admin — enters the system, proves their identity, and is granted access to the resources appropriate to their role. This module implements email/password registration and login, Google OAuth integration, JWT-based session management (access + refresh tokens), email verification, password recovery flows, role-based middleware, company-scoped data isolation, login attempt throttling, and secure token storage. It also differentiates between two distinct registration/login personas: Internal Users (company admin, recruiter, interviewer) and Candidates, each with their own signup fields, validation rules, and post-login redirect behavior.

---

## Responsibilities

1. **User Registration** — Email/password signup for candidates and company admins with validation, duplicate checks, and password hashing.
2. **User Login** — Credential validation, JWT access token (15-min) and refresh token (7-day) generation, role-based redirect.
3. **Google OAuth** — Social login/signup via Google for both candidates and internal users, account linking.
4. **Email Verification** — Token-based email verification flow, enforce `isVerified` before access.
5. **Password Recovery** — Forgot password (email reset link), reset password (token validation + new password).
6. **Token Management** — JWT generation, refresh, expiration, secure storage (httpOnly cookies / localStorage).
7. **Route Protection** — Auth middleware validating JWT on every protected request, attaching user to request context.
8. **Role-Based Access Control** — Role middleware accepting allowed roles array, enforcing role hierarchy (Admin > Recruiter > Interviewer).
9. **Company Data Isolation** — Ensure users can only access data belonging to their company (companyId scoping).
10. **Security Hardening** — CORS, Helmet, CSRF protection, rate limiting on auth endpoints, login attempt throttling.
11. **Invite-Based Registration** — Token-based invite flow for recruiters/interviewers (tied to Company module but auth handles the registration endpoint).

---

## Feature Extraction

### Feature 1: Email/Password Registration & Login

**Functional Description:**  
Users register with email and password. Passwords are hashed with bcrypt. Login returns a JWT access token (short-lived) and a refresh token (long-lived). The system differentiates between candidate registration and company user registration.

**Technical Elaboration:**
- **Registration:** `POST /api/auth/signup` — Accepts `name`, `email`, `password`, `role` (`candidate` or `company`). Validates email format (RFC 5322), checks for duplicate email (unique constraint on `users.email` or `candidates.email`), enforces password strength (min 8 chars, 1 uppercase, 1 number, 1 special char). Hashes password with bcrypt (salt rounds: 12). For candidates: creates record in `candidates` table with `password_digest`, `current_step: 1`, `onboarding_completed: false`. For company admin: creates record in `users` table with `password_digest`, creates `memberships` entry linking user to `Admin` role, creates `companies` record with `status: 'pending'`.
- **Login:** `POST /api/auth/login` — Accepts `email`, `password`. Checks both `users` and `candidates` tables. Validates credentials against bcrypt hash. Checks `isVerified` flag (if implemented). For company users: checks `company.status === 'active'` (pending companies cannot login). Checks lockout status (`failedLoginAttempts >= 5` → locked for 30 min). Generates JWT access token (15-min expiry) with payload: `{ userId, role, companyId, email }`. Generates refresh token (7-day expiry) stored in DB or httpOnly cookie. Returns tokens + user profile data.
- **Candidate vs Company Login:** Login flow checks `role` field in token payload. Candidates redirect to `/candidate/dashboard`. Company users redirect to `/company/dashboard`. Super admin redirects to `/superadmin/dashboard`.

**Database Schema Reference:**
- `users` table: `id`, `email (UNIQUE)`, `password_digest`, `name`, `company_id (FK → companies)`
- `candidates` table: `id`, `email`, `password_digest`, `name`, `phone`
- `memberships` table: `user_id (FK → users)`, `role_id (FK → roles)` — determines the user's role
- `roles` table: `id`, `name` — seeded with `Super Admin`, `Admin`, `Recruiter`, `Hiring Manager`, `Interviewer`

---

### Feature 2: Google OAuth Integration

**Functional Description:**  
Users can register and login using their Google account. The system uses Passport.js with the Google OAuth 2.0 strategy. If a Google account's email matches an existing account, the accounts are linked. If no account exists, a new one is created.

**Technical Elaboration:**
- **Endpoint:** `POST /api/auth/google` — Accepts Google `idToken` from frontend. Verifies token with Google's OAuth2 library. Extracts `email`, `name`, `googleId`, `picture`.
- **New User Flow:** If no matching email exists → create user/candidate record with `authProvider: 'google'`, `googleId` stored, `isVerified: true` (Google-verified emails). For candidates → redirect to onboarding wizard. For company users → redirect to company registration wizard.
- **Existing User Flow:** If email matches existing account → link Google ID to account, update `authProvider` to include google, generate JWT tokens as normal.
- **Frontend:** Google Sign-In button using `@react-oauth/google`. On success, sends ID token to backend via `POST /api/auth/google`.

**Database Schema Reference:**
- `users` table: `email`, `name` — matched against Google profile
- `candidates` table: `email`, `name` — matched against Google profile
- Note: The current schema doesn't have `googleId` or `authProvider` columns — these would need to be added as an extension or stored in a separate `oauth_accounts` table.

---

### Feature 3: Email Verification & Password Recovery

**Functional Description:**  
After registration, the system sends a verification email with a unique token link. Users must verify their email before accessing the platform. The forgot password flow allows users to request a password reset link sent to their email, then set a new password using a time-bound token.

**Technical Elaboration:**
- **Email Verification:**
  - On signup → generate a unique verification token (crypto.randomBytes(32).toString('hex')), store with expiry (24 hours), send email with link: `{FRONTEND_URL}/verify-email?token={token}`
  - `GET /api/auth/verify-email?token=` — Validates token, checks expiry, sets user as verified, redirects to login with success message
  - Unverified users attempting login receive: `{ success: false, error: "Please verify your email first" }`
- **Forgot Password:**
  - `POST /api/auth/forgot-password` — Accepts `email`. If email exists, generates reset token (1-hour expiry), sends email with link: `{FRONTEND_URL}/reset-password?token={token}`. Always returns success (prevent email enumeration).
  - `POST /api/auth/reset-password` — Accepts `token`, `newPassword`, `confirmPassword`. Validates token, checks expiry, enforces password strength, hashes new password, updates `password_digest`, invalidates token.
- **Frontend:** Forgot password page with email input → success message. Reset password page with new password + confirm password fields → redirect to login.

**Database Schema Reference:**
- `users` table: `password_digest` — updated on password reset
- `candidates` table: `password_digest` — updated on password reset
- Note: Token storage needs a `verification_tokens` or `password_reset_tokens` table (not in current ER diagram — extend with: `id`, `user_id/candidate_id`, `token`, `type (email_verify/password_reset)`, `expires_at`, `used_at`).

---

### Feature 4: JWT Token Management & Refresh Mechanism

**Functional Description:**  
The system uses short-lived access tokens and long-lived refresh tokens. When the access token expires, the frontend silently refreshes it using the refresh token. Logout invalidates the refresh token.

**Technical Elaboration:**
- **Access Token:** JWT, 15-minute expiry, payload: `{ userId, role, companyId, email, type: 'access' }`. Signed with `JWT_SECRET` from env.
- **Refresh Token:** JWT or opaque token, 7-day expiry, stored in httpOnly cookie (secure, sameSite: strict) or in database. Payload: `{ userId, type: 'refresh' }`. Signed with `JWT_REFRESH_SECRET`.
- **Refresh Endpoint:** `POST /api/auth/refresh` — Accepts refresh token (from cookie or body). Validates token, checks if revoked (DB lookup). Generates new access token. Optionally rotates refresh token (new refresh token, old one invalidated).
- **Logout:** `POST /api/auth/logout` — Invalidates refresh token (delete from DB or add to blocklist). Clears httpOnly cookie.
- **Frontend:** Axios interceptor detects 401 responses → calls `/api/auth/refresh` → retries original request with new access token. If refresh also fails → redirect to login.

**Database Schema Reference:**
- Note: Needs a `refresh_tokens` table: `id`, `user_id/candidate_id`, `token (hashed)`, `expires_at`, `revoked_at`, `created_at`. Not in current ER diagram — extend schema.
- `users` / `candidates` tables: `id`, `email` — used in JWT payload construction

---

### Feature 5: Auth Middleware & Role-Based Access Control

**Functional Description:**  
Every protected API route passes through an auth middleware that validates the JWT and a role middleware that checks if the user's role is authorized for that endpoint. The system enforces role hierarchy and company-scoped data isolation.

**Technical Elaboration:**
- **Auth Middleware (`auth.middleware.ts`):**
  - Extracts token from `Authorization: Bearer <token>` header
  - Verifies JWT using `jwt.verify(token, JWT_SECRET)`
  - Handles: missing token (401), invalid token (401), expired token (401)
  - Attaches decoded payload to `req.user = { userId, role, companyId, email }`
  - Applied to all routes except: `/api/auth/signup`, `/api/auth/login`, `/api/auth/google`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/health`

- **Role Middleware (`role.middleware.ts`):**
  - Factory function: `authorize(...allowedRoles: string[])` returns middleware
  - Checks `req.user.role` against `allowedRoles` array
  - Returns 403 if role not in allowed list
  - Role hierarchy: `Super Admin > Admin > Recruiter > Interviewer > Candidate`
  - Example usage: `router.post('/jobs', authenticate, authorize('Admin', 'Recruiter'), jobController.create)`

- **Company Scoping Middleware:**
  - For company-scoped resources (jobs, applications, interviews): middleware verifies `req.user.companyId` matches the resource's `company_id`
  - Prevents cross-company data access: User from Company A cannot read Company B's jobs
  - Super Admin bypasses company scoping

**Database Schema Reference:**
- `memberships` table: `user_id`, `role_id` — queried to resolve user's role(s)
- `roles` table: `name` — compared against allowed roles in middleware
- `users` table: `company_id` — used for company scoping
- `companies` table: `id`, `status` — checked during login (must be 'active')

---

### Feature 6: Login Security — Throttling, Rate Limiting & CORS

**Functional Description:**  
The system implements security measures to prevent brute-force attacks, abuse of auth endpoints, and cross-origin exploits. Login attempts are throttled per account, auth endpoints are rate-limited per IP, and CORS/CSRF protections are configured.

**Technical Elaboration:**
- **Login Attempt Throttling:**
  - Track `failedLoginAttempts` counter per user (in DB or cache)
  - After 5 consecutive failed attempts → lock account for 30 minutes (`lockUntil` timestamp)
  - On successful login → reset counter to 0
  - Locked account returns: `{ success: false, error: "Account temporarily locked. Try again in X minutes" }`

- **Rate Limiting:**
  - Use `express-rate-limit` middleware on auth routes: `/api/auth/*`
  - Config: 20 requests per 15 minutes per IP for login/register
  - Config: 5 requests per 15 minutes per IP for forgot-password (prevent email spam)
  - Returns 429 Too Many Requests with retry-after header

- **CORS Configuration:**
  - Allow origins: `http://localhost:5173` (dev), production domain
  - Allow methods: `GET, POST, PATCH, DELETE`
  - Allow headers: `Content-Type, Authorization`
  - Credentials: `true` (for httpOnly cookies)

- **Secure Headers:**
  - Helmet middleware: sets X-Content-Type-Options, X-Frame-Options, CSP, HSTS
  - CSRF protection if using cookies for token storage

**Database Schema Reference:**
- `users` table: Would need `failed_login_attempts (integer DEFAULT 0)` and `lock_until (timestamp, nullable)` columns — extend schema
- `candidates` table: Same extensions needed

---

### Feature 7: Invite-Based Registration (Recruiters & Interviewers)

**Functional Description:**  
Company admins invite recruiters and interviewers by email. The system generates a time-bound invite token, sends an invite email with credentials and a login link. The invited user can then log in directly — no self-registration needed for internal users (only admin registers, then invites others).

**Technical Elaboration:**
- **Send Invite:** `POST /api/companies/me/invitations` — Admin provides `name`, `email`, `role` (Recruiter/Interviewer), `password` (temporary). Backend creates `users` record with `company_id = admin's companyId`, hashes password, creates `memberships` entry with selected role. Generates invite token. Sends email with: login URL, email, temporary password, company name.
- **Accept Invite:** `POST /api/auth/register/invite?token=` — Validates invite token, checks expiry, marks user as active, optionally allows password change on first login.
- **Frontend:** Invite modal in Company Users page. Invited users use the standard Internal Login page with the credentials they received.

**Database Schema Reference:**
- `users` table: `id`, `email`, `password_digest`, `name`, `company_id (FK → companies)` — new user record created on invite
- `memberships` table: `user_id`, `role_id` — role assignment during invite
- `roles` table: `Recruiter` or `Interviewer` role selected
- `companies` table: `id` — admin's company context
- Note: Needs an `invitations` table: `id`, `company_id`, `email`, `role_id`, `token`, `status (pending/accepted/expired)`, `expires_at`, `created_at`

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Core auth (registration, login, JWT, middleware) — 7 days  
**Sprint 2:** OAuth, email verification, password recovery, security hardening — 7 days

---

### Task List

**Sprint 1:**
- [ ] Create `users` table migration (if not done in Module 0, add auth-specific columns: failed_login_attempts, lock_until)
- [ ] Build `POST /api/auth/signup` — candidate and company admin registration with validation
- [ ] Build `POST /api/auth/login` — credential validation, JWT generation, role-based response
- [ ] Build JWT utility functions (generate access token, generate refresh token, verify token)
- [ ] Build auth middleware (token extraction, verification, req.user attachment)
- [ ] Build role middleware (factory function with allowed roles)
- [ ] Build `POST /api/auth/refresh` — refresh token validation and access token regeneration
- [ ] Build `POST /api/auth/logout` — refresh token invalidation
- [ ] Build frontend login page (split-screen, Internal/Candidate toggle, form validation)
- [ ] Build frontend signup pages (candidate signup, company admin signup)
- [ ] Integrate Axios interceptors for token management (auto-refresh on 401)

**Sprint 2:**
- [ ] Build Google OAuth flow (backend + frontend)
- [ ] Build email verification (send verification email, verify endpoint)
- [ ] Build forgot password (send reset email, reset endpoint)
- [ ] Build login attempt throttling logic
- [ ] Configure rate limiting on auth endpoints
- [ ] Configure CORS, Helmet, CSRF
- [ ] Build invite-based registration endpoint
- [ ] Build protected route wrapper component on frontend
- [ ] Write unit tests for auth service (registration, login, token generation)
- [ ] Write integration tests for auth endpoints

---

### Prompt 1: Core Authentication — Registration, Login & JWT Token System

> Set up the authentication foundation. Create (or extend) the `users` database table with fields: `id (bigint PK auto-increment)`, `email (string NOT NULL UNIQUE)`, `password_digest (string NOT NULL)`, `name (string)`, `company_id (bigint FK → companies, nullable)`, `failed_login_attempts (integer DEFAULT 0)`, `lock_until (timestamp nullable)`, `created_at`, `updated_at`. Ensure the `candidates` table also has `password_digest` for candidate auth. Create a `refresh_tokens` table: `id (bigint PK)`, `user_id (bigint FK → users, nullable)`, `candidate_id (bigint FK → candidates, nullable)`, `token_hash (string NOT NULL)`, `expires_at (timestamp NOT NULL)`, `revoked_at (timestamp nullable)`, `created_at`.

> Build `POST /api/auth/signup` accepting `{ name, email, password, role }` — validate email format using Zod, check duplicate email against both `users` and `candidates` tables, enforce password strength (min 8 chars, 1 uppercase, 1 number, 1 special char), hash with bcrypt (12 salt rounds). If `role === 'candidate'`: create record in `candidates` with `password_digest`, `current_step: 1`, `onboarding_completed: false`, `profile_completion: 0`. If `role === 'company'`: create record in `users` with `password_digest`, query `roles` table for `Admin` role id, create `memberships` entry, create `companies` record with `status: 'pending'` and `admin_user_id` pointing to the new user.

> Build `POST /api/auth/login` — accept `{ email, password }`, search both `users` and `candidates` tables by email, validate password against bcrypt hash, check lockout status (if `failed_login_attempts >= 5` and `lock_until > NOW()` return 423 Locked), for company users check `companies.status === 'active'` via join, on success reset `failed_login_attempts` to 0, generate JWT access token (15-min, payload: `{ userId, role, companyId, email, type: 'access' }`) and refresh token (7-day, store hash in `refresh_tokens`), return `{ success: true, data: { accessToken, refreshToken, user: { id, name, email, role, companyId } } }`. On failure increment `failed_login_attempts`, if reaches 5 set `lock_until = NOW() + 30 minutes`.

---

### Prompt 2: Auth Middleware, Role Guards & Token Refresh

> Build auth middleware at `src/shared/middlewares/auth.middleware.ts`: extract Bearer token from Authorization header, verify with `jwt.verify`, attach decoded payload to `req.user`, handle missing/invalid/expired tokens with 401. Build role middleware at `src/shared/middlewares/role.middleware.ts`: factory function `authorize(...roles)` that checks `req.user.role` against allowed roles, returns 403 if unauthorized. Example usage: `router.post('/jobs', authenticate, authorize('Admin', 'Recruiter'), jobController.create)`.

> Build `POST /api/auth/refresh` — accepts refresh token (from cookie or request body), validates token hash against `refresh_tokens` table, checks if revoked (`revoked_at IS NOT NULL`), checks expiry. On success: generates new access token (15-min), optionally rotates refresh token (new refresh token issued, old one revoked). Returns `{ success: true, data: { accessToken, refreshToken } }`. Build `POST /api/auth/logout` — invalidates refresh token by setting `revoked_at = NOW()` in `refresh_tokens` table, clears httpOnly cookie if used.

> On the frontend, integrate Axios interceptors for automatic token management in `src/shared/lib/api.ts`. The request interceptor attaches the access token from Redux store to every outgoing request as `Authorization: Bearer <token>`. The response interceptor detects 401 responses, calls `/api/auth/refresh` to get a new access token, stores the new token in Redux, and retries the original failed request. If the refresh also fails, clear the auth state and redirect to `/` (login page).

---

### Prompt 3: Google OAuth, Email Verification & Password Recovery

> Implement Google OAuth login, email verification, and password recovery flows. **Google OAuth:** Install `@react-oauth/google` on frontend, `google-auth-library` on backend. Create `POST /api/auth/google` endpoint — accepts `{ idToken, role }` from frontend. Use `OAuth2Client.verifyIdToken()` to validate the Google token and extract `{ email, name, sub (googleId), picture }`. Check if email exists in `users` or `candidates` table. If exists: generate JWT tokens and return user data (same as login response). If new user with `role === 'candidate'`: create `candidates` record with Google profile data, `password_digest` set to a random hash (Google users don't need password), return tokens and redirect flag for onboarding wizard. If new user with `role === 'company'`: create `users` + `companies` (pending) + `memberships` (Admin) records, return tokens. On frontend, render Google Sign-In button on both Internal and Candidate login forms, on success send idToken to backend.

> **Email Verification:** Create a `verification_tokens` table: `id (bigint PK)`, `user_id (bigint FK nullable)`, `candidate_id (bigint FK nullable)`, `token (string NOT NULL UNIQUE)`, `type (string NOT NULL)` CHECK `email_verify/password_reset`, `expires_at (timestamp NOT NULL)`, `used_at (timestamp nullable)`, `created_at`. After signup, generate token via `crypto.randomBytes(32).toString('hex')`, store in `verification_tokens` with `type: 'email_verify'`, `expires_at: NOW() + 24 hours`. Send HTML email using Nodemailer with link: `{FRONTEND_URL}/verify-email?token={token}`. Build `GET /api/auth/verify-email?token=` — find token in DB, check not expired, check not used, mark as used (`used_at = NOW()`), set user as verified (add `is_verified` boolean column to `users` and `candidates` tables, default false). On frontend, create `/verify-email` page that reads token from URL, calls API, shows success/error message, redirects to login.

> **Password Recovery:** Build `POST /api/auth/forgot-password` — accepts `{ email }`, finds user/candidate, generates reset token (`type: 'password_reset'`, expires 1 hour), sends email with reset link: `{FRONTEND_URL}/reset-password?token={token}`. Always returns 200 (prevents email enumeration). Build `POST /api/auth/reset-password` — accepts `{ token, password, confirmPassword }`, validates token (exists, not expired, not used), enforces password strength, hashes new password, updates `password_digest` in users/candidates, marks token as used, invalidates all existing refresh tokens for this user. On frontend, create `/forgot-password` page (email input form), `/reset-password` page (new password + confirm + strength indicator).

---

### Prompt 4: Landing Page UI, Protected Routes & Security Hardening

> Build the landing page at route `/` with a split-screen layout (60/40). Left side: pain point messaging about traditional HR — fragmented spreadsheets, lost candidate data, missed interviews, zero pipeline visibility — 3-4 short punchy sentences with a subtle animated Kanban board preview or hiring pipeline visualization. Right side: login modal with a prominent pill/tab switcher at the top toggling between "Internal" (Company Admin/Recruiter/Interviewer) and "Candidate" personas. Internal login form: email input, password input with show/hide toggle, "Forgot Password?" link, "Login with Google" button, "Don't have an account? Sign up" link. Candidate login form: same fields. The signup forms slide in when "Sign up" is clicked — Internal signup collects company details (Company Name, Domain, Company Size dropdown, Industry dropdown, Address, Contact Email) and admin user details (Full Name, Email, Password with strength indicator, Confirm Password). Candidate signup collects Full Name, Email, Phone, Location, Skills (tag input), Password with strength indicator, Confirm Password. Background: subtle gradient, no pure white. Logo top-left, minimal footer. Animated transitions between Internal/Candidate toggle.

> Create `ProtectedRoute` component that wraps routes requiring authentication — reads JWT from storage, validates expiry client-side, redirects to `/` if invalid. Create `RoleGuard` component that checks user role from Redux store against allowed roles, renders 403 page if unauthorized. Configure router: public routes (`/`, `/verify-email`, `/reset-password`, `/forgot-password`), candidate routes (`/candidate/*`), company routes (`/company/*`), admin routes (`/superadmin/*`). Store decoded JWT payload in Redux slice (`authSlice`: `user`, `accessToken`, `isAuthenticated`).

> Configure `express-rate-limit` on `/api/auth/*` routes: 20 requests/15 min for login/register, 5 requests/15 min for forgot-password. Configure CORS: allow `http://localhost:5173`, credentials true. Apply Helmet middleware globally. Add input sanitization. Configure Zod validators for all auth endpoints (email format, password strength, required fields). Log all auth events (login success/failure, registration, password reset) using Winston logger with structured JSON format. Write integration tests: test registration with valid/invalid data, test login with correct/wrong credentials, test token refresh, test protected route access with/without token, test role-based access.

---

