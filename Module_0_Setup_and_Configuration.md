# Module 0: Setup & Configuration

**Priority:** High | **Phase:** Foundation (Phase 1)  
**Build Order:** 0 (First — before all other modules)

---

## Module Overview

The Setup & Configuration module is the very first step in building the HR Recruitment Management System (ATS). This module establishes the complete development environment from scratch — initializing the React frontend with a feature-based architecture, bootstrapping the Node.js/Express backend with a modular monolith structure, provisioning the PostgreSQL database with the full ER schema, containerizing the stack with Docker, and configuring all third-party integrations (JDoodle for code execution, Monaco for the code editor, Jitsi for video calls). No business logic is implemented here — this module purely sets up the scaffold, tooling, configurations, and connectivity so that every subsequent module (Auth, Company, Job, etc.) can be built on a solid, tested, and running foundation.

---

## Responsibilities

1. **Frontend Initialization** — Scaffold a Vite + React + TypeScript project following the feature-based architecture defined in `react-guidelines 1.md` (shadcn/ui, Tailwind CSS, Redux Toolkit, React Query, React Hook Form + Zod, Axios, react-router-dom, lucide-react, Sonner, next-themes, react-error-boundary).
2. **Backend Initialization** — Scaffold a Node.js + Express + TypeScript project following the feature + layer hybrid structure from `Backend-Guide.md` (modules/, shared/, config/, loaders/).
3. **Database Setup** — Provision PostgreSQL, create all tables from the ER diagram (companies, users, roles, memberships, jobs, candidates, applications, interviews, feedbacks, active_storage_blobs, active_storage_attachments), seed initial data (roles).
4. **Docker Configuration** — Create `docker-compose.yml` with services for frontend, backend, and PostgreSQL. Create Dockerfiles for frontend and backend.
5. **Third-Party Integration Configuration** — Configure JDoodle API proxy, Monaco Editor setup, Jitsi Meet embed configuration.
6. **Environment Management** — Set up `.env` files for dev/prod with all required variables.
7. **Base Testing** — Verify the app starts, API health endpoint responds, DB connection works, frontend renders.

---

## Feature Extraction

### Feature 1: Frontend Project Initialization (React + Vite + TypeScript)

**Functional Description:**  
Create the React frontend application using Vite as the build tool, TypeScript in strict mode, and configure the complete tech stack defined in the React guidelines. The project must follow a feature-based folder structure where each feature (auth, landing, candidate, company, etc.) owns its own pages, components, containers, hooks, services, schemas, types, and tests.

**Technical Elaboration:**
- **Scaffold:** Run `npx -y create-vite@latest ./ --template react-ts` to initialize in current directory.
- **Install Dependencies:**
  - Runtime: `@reduxjs/toolkit react-redux @tanstack/react-query react-router-dom react-hook-form @hookform/resolvers zod axios lucide-react sonner next-themes react-error-boundary`
  - UI: `tailwindcss @tailwindcss/vite` + shadcn/ui CLI init
  - Dev: `eslint prettier vitest @testing-library/react @testing-library/jest-dom msw`
- **Folder Structure:**
  ```
  src/
  ├── app/
  │   ├── router.tsx          # Central route registration
  │   ├── store.ts            # Redux store
  │   └── providers.tsx       # QueryClient, Theme, ErrorBoundary
  ├── shared/
  │   ├── components/         # Reusable UI (Button, Input, Modal, etc.)
  │   ├── hooks/              # useAuth, useDebounce, etc.
  │   ├── lib/                # axios instance, cn() helper
  │   ├── types/              # Global TypeScript types
  │   └── utils/              # Formatters, validators
  ├── features/
  │   ├── auth/
  │   ├── landing/
  │   ├── candidate/
  │   ├── company/
  │   ├── jobs/
  │   ├── applications/
  │   ├── interviews/
  │   ├── analytics/
  │   └── admin/
  ```
- **Axios Instance:** Create `src/shared/lib/api.ts` with `axios.create({ baseURL: '/api' })` and interceptors for JWT token attachment and 401 handling.
- **Router:** Configure `react-router-dom` with lazy-loaded routes for each feature's pages.

**Database Schema Reference:** N/A (no DB tables — frontend only).

---

### Feature 2: Backend Project Initialization (Node.js + Express + TypeScript)

**Functional Description:**  
Create the backend application using Node.js, Express, and TypeScript following the modular monolith architecture. The project structure must use the feature + layer hybrid pattern where each module (auth, company, job, candidate, application, interview, notification, analytics) contains its own controller, service, repository, routes, validator, and types files.

**Technical Elaboration:**
- **Initialize:** `npm init -y`, install `express typescript ts-node-dev @types/express @types/node`
- **Install Core Dependencies:**
  - `bcryptjs jsonwebtoken passport passport-google-oauth20 cors helmet express-rate-limit`
  - `pg knex` (PostgreSQL client + query builder) OR `prisma @prisma/client`
  - `zod multer nodemailer winston dotenv`
  - Dev: `jest ts-jest supertest @types/jest @types/supertest`
- **Folder Structure:**
  ```
  src/
  ├── modules/
  │   ├── auth/
  │   │   ├── auth.controller.ts
  │   │   ├── auth.service.ts
  │   │   ├── auth.repository.ts
  │   │   ├── auth.routes.ts
  │   │   ├── auth.validator.ts
  │   │   └── auth.types.ts
  │   ├── company/
  │   ├── job/
  │   ├── candidate/
  │   ├── application/
  │   ├── interview/
  │   ├── notification/
  │   └── analytics/
  ├── shared/
  │   ├── middlewares/
  │   │   ├── auth.middleware.ts
  │   │   ├── role.middleware.ts
  │   │   └── error.middleware.ts
  │   ├── utils/
  │   │   ├── logger.ts          # Winston/Pino
  │   │   ├── response.ts        # Standard { success, data, message }
  │   │   └── email.ts           # Nodemailer wrapper
  │   ├── constants/
  │   │   └── roles.ts
  │   └── errors/
  │       └── AppError.ts
  ├── config/
  │   ├── db.ts                  # PostgreSQL connection
  │   └── env.ts                 # Environment variable loader
  ├── loaders/
  │   ├── express.ts             # Middleware setup
  │   └── routes.ts              # Route aggregation
  ├── app.ts
  └── server.ts
  ```
- **Standard Response Format:**
  ```json
  { "success": true, "data": {}, "message": "Fetched successfully" }
  { "success": false, "error": "Unauthorized" }
  ```
- **Health Endpoint:** `GET /api/health` returns `{ success: true, message: "API is running", timestamp: ... }`
- **Request Flow:** Route → Controller → Service → Repository → DB

**Database Schema Reference:** N/A (scaffold only — no tables created here).

---

### Feature 3: PostgreSQL Database Setup (Full ER Schema)

**Functional Description:**  
Provision a PostgreSQL database and create all tables defined in the ER diagram from Application_Docs.md. This includes companies, users, roles, memberships, jobs, candidates, applications, interviews, feedbacks, and active_storage tables. Seed the roles table with the five predefined roles. Set up all foreign keys, indexes, unique constraints, and default values.

**Technical Elaboration:**
- **Database Creation:** Create database `hr_recruitment_dev` and `hr_recruitment_test`.
- **Migration Tool:** Use Knex migrations or Prisma migrate.
- **Tables to Create (in order due to FK dependencies):**

  1. **`roles`** — `id (bigint PK)`, `name (string UNIQUE NOT NULL)`, `created_at`, `updated_at`  
     Seed: `Super Admin`, `Admin`, `Recruiter`, `Hiring Manager`, `Interviewer`

  2. **`companies`** — `id (bigint PK)`, `name (string NOT NULL)`, `domain (string UNIQUE)`, `company_size (string)`, `industry (string)`, `address_line1 (string)`, `address_line2 (string)`, `city (string)`, `state (string)`, `country (string)`, `postal_code (string)`, `contact_email (string)`, `contact_phone (string)`, `status (string DEFAULT 'pending')`, `active (boolean DEFAULT true NOT NULL)`, `admin_user_id (bigint FK → users, nullable initially)`, `created_at`, `updated_at`  
     **Indexes:** `active`, `status`, `domain (unique)`, `admin_user_id`

  3. **`users`** — `id (bigint PK)`, `email (string NOT NULL UNIQUE)`, `password_digest (string NOT NULL)`, `name (string)`, `company_id (bigint FK → companies, nullable)`, `created_at`, `updated_at`  
     **Indexes:** `email (unique)`, `company_id`

  4. **`memberships`** — `id (bigint PK)`, `user_id (bigint FK → users NOT NULL)`, `role_id (bigint FK → roles NOT NULL)`, `created_at`, `updated_at`  
     **Unique Composite:** `(user_id, role_id)`

  5. **`jobs`** — `id (bigint PK)`, `title (string NOT NULL)`, `description (text NOT NULL)`, `status (string DEFAULT 'draft')`, `department (string)`, `location (string)`, `experience_level (string)`, `required_skills (string[] DEFAULT '{}')`, `company_id (bigint FK → companies NOT NULL)`, `created_by_id (bigint FK → users)`, `created_at`, `updated_at`  
     **Indexes:** `company_id`, `created_by_id`

  6. **`candidates`** — `id (bigint PK)`, `name (string NOT NULL)`, `email (string NOT NULL)`, `phone (string)`, `password_digest (string)`, `location (string)`, `resume_url (string)`, `linkedin_url (string)`, `github_url (string)`, `portfolio_url (string)`, `status (string DEFAULT 'new')`, `resume_text (text)`, `skills (string[] DEFAULT '{}')`, `ai_match_score (decimal(5,2))`, `summary (text)`, `resume_data (jsonb DEFAULT '{}')`, `experience (jsonb DEFAULT '[]')`, `preferences (jsonb DEFAULT '{}')`, `current_step (integer DEFAULT 1)`, `onboarding_completed (boolean DEFAULT false)`, `profile_completion (integer DEFAULT 0)`, `profile_strength_score (decimal(5,2) DEFAULT 0.0)`, `company_id (bigint FK → companies, nullable)`, `created_at`, `updated_at`  
     **Indexes:** `(company_id, email)`, `company_id`, `email (partial unique WHERE company_id IS NULL)`, `onboarding_completed`

  7. **`applications`** — `id (bigint PK)`, `job_id (bigint FK → jobs NOT NULL)`, `candidate_id (bigint FK → candidates NOT NULL)`, `user_id (bigint FK → users, nullable)`, `status (string DEFAULT 'applied')`, `applied_at (datetime NOT NULL)`, `resume_url (string)`, `cover_note (text)`, `ai_score (decimal(5,2))`, `parsed_skills (string[] DEFAULT '{}')`, `created_at`, `updated_at`  
     **Unique Index:** `(job_id, candidate_id)`

  8. **`interviews`** — `id (bigint PK)`, `application_id (bigint FK → applications NOT NULL)`, `round_type (string NOT NULL)`, `interviewer_id (bigint FK → users)`, `scheduled_at (datetime NOT NULL)`, `status (string DEFAULT 'scheduled')`, `meeting_link (string)`, `created_at`, `updated_at`

  9. **`feedbacks`** — `id (bigint PK)`, `interview_id (bigint FK → interviews NOT NULL)`, `rating (integer NOT NULL)`, `strengths (text)`, `weaknesses (text)`, `recommendation (string NOT NULL)`, `created_at`, `updated_at`

  10. **`active_storage_blobs`** — `id (bigint PK)`, `key (string NOT NULL)`, `filename (string NOT NULL)`, `content_type (string)`, `metadata (text)`, `service_name (string NOT NULL)`, `byte_size (bigint NOT NULL)`, `checksum (string NOT NULL)`, `created_at`

  11. **`active_storage_attachments`** — `id (bigint PK)`, `name (string NOT NULL)`, `record_type (string NOT NULL)`, `record_id (bigint NOT NULL)`, `blob_id (bigint FK → active_storage_blobs NOT NULL)`, `created_at`

**ER Relationships:**
- `COMPANIES ||--o{ USERS` (employs), `COMPANIES ||--o| USERS` (admin_user)
- `COMPANIES ||--o{ JOBS`, `COMPANIES ||--o{ CANDIDATES`
- `USERS ||--o{ MEMBERSHIPS`, `ROLES ||--o{ MEMBERSHIPS`
- `USERS ||--o{ JOBS` (created_by), `USERS ||--o{ APPLICATIONS` (created_by), `USERS ||--o{ INTERVIEWS` (interviewer)
- `JOBS ||--o{ APPLICATIONS`, `CANDIDATES ||--o{ APPLICATIONS`
- `APPLICATIONS ||--o{ INTERVIEWS`, `INTERVIEWS ||--o| FEEDBACKS`
- `CANDIDATES ||--o{ ACTIVE_STORAGE_ATTACHMENTS`, `ACTIVE_STORAGE_ATTACHMENTS }o--|| ACTIVE_STORAGE_BLOBS`

---

### Feature 4: Docker Configuration

**Functional Description:**  
Containerize the entire application stack using Docker and Docker Compose. The development environment should spin up with a single `docker-compose up` command, launching the React frontend, Node.js backend, and PostgreSQL database as separate, connected services.

**Technical Elaboration:**
- **`docker-compose.yml`** with three services:
  - `db` — PostgreSQL 15 image, port 5432, persistent volume, env vars for `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
  - `backend` — Custom Dockerfile, port 5000, depends_on `db`, mounts source code for hot-reload, env vars for DB connection, JWT secrets, SMTP, JDoodle API keys
  - `frontend` — Custom Dockerfile, port 5173, depends_on `backend`, Vite dev server with proxy to backend
- **Backend Dockerfile:** Node 20 alpine, copy package.json, `npm install`, copy source, `CMD ["npm", "run", "dev"]`
- **Frontend Dockerfile:** Node 20 alpine, copy package.json, `npm install`, copy source, `CMD ["npm", "run", "dev"]`
- **`.env.example`** with all required environment variables documented

**Database Schema Reference:** N/A (infrastructure only).

---

### Feature 5: Third-Party API Integration Configuration

**Functional Description:**  
Set up the configuration and proxy layers for three third-party integrations: JDoodle (code execution in live interviews), Monaco Editor (browser-based code editor), and Jitsi Meet (video calling for interviews). No full implementation here — only configuration, API key setup, and basic connectivity tests.

**Technical Elaboration:**
- **JDoodle API:**
  - Store `JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET` in `.env`
  - Create backend proxy endpoint: `POST /api/code/execute` — accepts `{ language, versionIndex, script, stdin }`, forwards to `https://api.jdoodle.com/v1/execute`, returns `{ output, statusCode, memory, cpuTime }`
  - Rate limit: 10 executions/minute per session, max execution time 15s, memory limit 256MB
- **Monaco Editor:**
  - Install `@monaco-editor/react` in frontend
  - Configure in `src/shared/lib/monaco.ts`: default settings (line numbers, minimap, theme toggle, 50+ language support)
  - Verify editor renders in a test component
- **Jitsi Meet:**
  - Install `@jitsi/react-sdk` or configure iframe embed
  - Room naming convention: `interview_{interview_id}`
  - Configure: auto-join (no lobby), audio/video on by default, hide unnecessary toolbar items, hide branding
  - Store `JITSI_DOMAIN` in `.env` (default: `meet.jit.si` for dev)

**Database Schema Reference:** N/A (configuration only).

---

### Feature 6: Base Testing & Verification

**Functional Description:**  
Verify that the entire development stack is correctly wired — frontend starts and renders, backend starts and responds to health check, database is connected and all tables exist, Docker containers communicate correctly.

**Technical Elaboration:**
- **Backend Health Test:** `GET /api/health` → `{ success: true, message: "API is running" }` (Supertest)
- **DB Connection Test:** Verify Knex/Prisma can connect and query `SELECT 1`
- **Table Existence Test:** Verify all 11 tables exist in the database
- **Role Seed Test:** Verify 5 roles are seeded correctly
- **Frontend Render Test:** Verify App component renders without crashing (React Testing Library)
- **Proxy Test:** Verify frontend can reach backend via `/api/health` through Vite proxy
- **Docker Test:** `docker-compose up` spins all 3 services, health check passes

**Database Schema Reference:** All tables (verification only).

---

## Sprint Plan

**Sprint Duration:** 1 Sprint (5-7 days)  
**Total Features:** 6  
**Sprint Goal:** A fully running, empty scaffold of the HR Recruitment Platform with all infrastructure in place.

---

### Task List

- [ ] Task 1: Initialize frontend project (Vite + React + TS), install all dependencies, set up folder structure
- [ ] Task 2: Initialize backend project (Express + TS), install all dependencies, set up modular folder structure
- [ ] Task 3: Set up PostgreSQL database, write all migrations, create all 11 tables with indexes/constraints, seed roles
- [ ] Task 4: Create Docker configuration (docker-compose.yml + Dockerfiles)
- [ ] Task 5: Configure third-party integrations (JDoodle proxy, Monaco editor, Jitsi embed)
- [ ] Task 6: Write and run base tests (health endpoint, DB connection, table verification, frontend render)

---

### Prompt 1: Frontend & Backend Scaffold + Docker Setup

> Initialize the complete project scaffold from scratch. For the **frontend**, create a Vite + React + TypeScript project. Install all runtime dependencies: `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`, `react-router-dom`, `react-hook-form`, `@hookform/resolvers`, `zod`, `axios`, `lucide-react`, `sonner`, `next-themes`, `react-error-boundary`. Install Tailwind CSS and initialize shadcn/ui. Set up the feature-based folder structure under `src/` with directories: `app/` (router.tsx, store.ts, providers.tsx), `shared/` (components/, hooks/, lib/, types/, utils/), and `features/` (auth/, landing/, candidate/, company/, jobs/, applications/, interviews/, analytics/, admin/). Create the Axios instance at `src/shared/lib/api.ts` with `baseURL: '/api'` and placeholder interceptors for JWT token attachment and 401 redirect. Configure `vite.config.ts` with proxy to `http://localhost:5000/api`.

> For the **backend**, create a Node.js + Express + TypeScript project. Install: `express`, `typescript`, `ts-node-dev`, `bcryptjs`, `jsonwebtoken`, `cors`, `helmet`, `express-rate-limit`, `knex`, `pg`, `zod`, `multer`, `nodemailer`, `winston`, `dotenv`. Set up the modular folder structure: `src/modules/` (auth/, company/, job/, candidate/, application/, interview/, notification/, analytics/ — each with placeholder controller, service, repository, routes, validator, types files), `src/shared/` (middlewares/auth.middleware.ts, middlewares/role.middleware.ts, middlewares/error.middleware.ts, utils/logger.ts using Winston, utils/response.ts with standard `{ success, data, message }` format, errors/AppError.ts), `src/config/` (db.ts for Knex/PostgreSQL connection, env.ts for dotenv loader), `src/loaders/` (express.ts for middleware setup with cors, helmet, express.json, morgan; routes.ts for route aggregation). Create `app.ts` that loads all middleware and routes, and `server.ts` that starts the server. Implement `GET /api/health` returning `{ success: true, message: "API is running", timestamp: Date.now() }`.

> For **Docker**, create `docker-compose.yml` with three services: `db` (PostgreSQL 15, port 5432, volume `pgdata`, env: POSTGRES_DB=hr_recruitment_dev, POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres), `backend` (custom Dockerfile, port 5000, depends_on db, volume mount for hot reload), `frontend` (custom Dockerfile, port 5173, depends_on backend). Create individual Dockerfiles for frontend and backend using Node 20 alpine. Create `.env.example` documenting all required variables: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JDOODLE_CLIENT_ID`, `JDOODLE_CLIENT_SECRET`, `JITSI_DOMAIN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

---

### Prompt 2: Database Schema — Full Migration & Seed

> Set up the complete PostgreSQL database schema for the HR Recruitment Platform. Create Knex migration files (or Prisma schema) to build all 11 tables in dependency order. **Migration 1 — roles:** Create `roles` table with `id (bigint PK auto-increment)`, `name (string NOT NULL UNIQUE)`, `created_at (timestamp DEFAULT NOW())`, `updated_at (timestamp DEFAULT NOW())`. **Migration 2 — companies:** Create `companies` table with `id (bigint PK)`, `name (string NOT NULL)`, `domain (string UNIQUE)`, `company_size (string)`, `industry (string)`, `address_line1`, `address_line2`, `city`, `state`, `country`, `postal_code`, `contact_email`, `contact_phone`, `status (string DEFAULT 'pending')` with CHECK constraint for values `pending/active/rejected`, `active (boolean DEFAULT true NOT NULL)`, `admin_user_id (bigint, nullable — FK added after users table)`, `created_at`, `updated_at`. Add indexes on `active`, `status`, `domain`. **Migration 3 — users:** Create `users` table with `id (bigint PK)`, `email (string NOT NULL UNIQUE)`, `password_digest (string NOT NULL)`, `name (string)`, `company_id (bigint FK → companies ON DELETE SET NULL)`, `created_at`, `updated_at`. Add index on `company_id`. Now add FK from `companies.admin_user_id` → `users.id`. **Migration 4 — memberships:** Create `memberships` with `id`, `user_id (FK → users NOT NULL ON DELETE CASCADE)`, `role_id (FK → roles NOT NULL ON DELETE CASCADE)`, `created_at`, `updated_at`. Add unique composite index on `(user_id, role_id)`.

> **Migration 5 — jobs:** Create `jobs` with `id (bigint PK)`, `title (string NOT NULL)`, `description (text NOT NULL)`, `status (string DEFAULT 'draft')` CHECK `draft/published/closed`, `department`, `location`, `experience_level` CHECK `entry/mid/senior`, `required_skills (text[] DEFAULT '{}')`, `company_id (bigint FK → companies NOT NULL)`, `created_by_id (bigint FK → users)`, `created_at`, `updated_at`. Indexes on `company_id`, `created_by_id`. **Migration 6 — candidates:** Create `candidates` with all 22 fields as defined in the ER diagram, including `resume_data (jsonb DEFAULT '{}')`, `experience (jsonb DEFAULT '[]')`, `preferences (jsonb DEFAULT '{}')`, `current_step (integer DEFAULT 1)`, `onboarding_completed (boolean DEFAULT false)`, `profile_completion (integer DEFAULT 0)`, `profile_strength_score (decimal(5,2) DEFAULT 0.0)`, `company_id (bigint FK → companies)`. Indexes on `(company_id, email)`, `company_id`, partial unique on `email WHERE company_id IS NULL`, `onboarding_completed`. **Migration 7 — applications:** `id`, `job_id (FK NOT NULL)`, `candidate_id (FK NOT NULL)`, `user_id (FK nullable)`, `status (string DEFAULT 'applied')`, `applied_at (datetime NOT NULL)`, `resume_url`, `cover_note (text)`, `ai_score (decimal(5,2))`, `parsed_skills (text[] DEFAULT '{}')`, `created_at`, `updated_at`. Unique index on `(job_id, candidate_id)`.

> **Migration 8 — interviews:** `id`, `application_id (FK NOT NULL)`, `round_type (string NOT NULL)` CHECK `phone/screening/technical/behavioral/hr/final`, `interviewer_id (FK → users)`, `scheduled_at (datetime NOT NULL)`, `status (string DEFAULT 'scheduled')` CHECK `scheduled/completed/cancelled`, `meeting_link (string)`, timestamps. **Migration 9 — feedbacks:** `id`, `interview_id (FK NOT NULL)`, `rating (integer NOT NULL)` CHECK `1-5`, `strengths (text)`, `weaknesses (text)`, `recommendation (string NOT NULL)` CHECK `strong_hire/hire/no_hire/strong_no_hire`, timestamps. **Migration 10 — active_storage:** Create `active_storage_blobs` and `active_storage_attachments` tables as per ER diagram. **Seed file:** Insert 5 roles: `Super Admin`, `Admin`, `Recruiter`, `Hiring Manager`, `Interviewer`. Run all migrations and seeds, verify all 11 tables exist.

---

### Prompt 3: Third-Party Integrations + Base Tests

> Configure all third-party API integrations and write base verification tests. **JDoodle Integration:** Create `src/modules/interview/code-execution.service.ts` on the backend. Implement a proxy function that accepts `{ language, versionIndex, script, stdin }`, sends a POST request to `https://api.jdoodle.com/v1/execute` with `clientId` and `clientSecret` from env vars, and returns `{ output, statusCode, memory, cpuTime }`. Create route `POST /api/code/execute` in a shared or interview route file. Add rate limiting middleware (10 requests/minute per IP). Add execution timeout of 15 seconds.

> **Monaco Editor:** On the frontend, install `@monaco-editor/react`. Create a reusable component `src/shared/components/CodeEditor.tsx` that wraps the Monaco editor with props: `language (string)`, `value (string)`, `onChange (callback)`, `theme ('vs-dark' | 'light')`, `readOnly (boolean)`. Support 50+ languages via the language selector dropdown. Enable line numbers and minimap. Create a test page at route `/test/editor` that renders the CodeEditor component to verify it loads. **Jitsi Meet:** On the frontend, create `src/shared/components/VideoCall.tsx` that embeds a Jitsi Meet iframe. Props: `roomName (string)`, `displayName (string)`, `onClose (callback)`. Configure: domain from `VITE_JITSI_DOMAIN` env var (default `meet.jit.si`), `startWithAudioMuted: false`, `startWithVideoMuted: false`, disable lobby, hide Jitsi branding and filmstrip overflow. Create a test page at `/test/video` to verify the embed works.

> **Base Tests:** Write backend tests using Jest + Supertest: (1) `GET /api/health` returns 200 with `{ success: true }`, (2) Database connection test — Knex raw query `SELECT 1` succeeds, (3) Table existence test — query `information_schema.tables` and assert all 11 table names exist, (4) Role seed test — query `roles` table and verify 5 rows with correct names. Write frontend tests using Vitest + React Testing Library: (1) App component renders without crashing, (2) Router initializes without errors, (3) Axios instance is configured with correct baseURL. Run all tests and verify they pass. Ensure `npm run test` works for both frontend and backend.

---
