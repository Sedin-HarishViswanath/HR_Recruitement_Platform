# Module 3: Job Management

**Priority:** High | **Phase:** Phase 4  
**Build Order:** 3 (After Company & User Management)  
**Estimated Requirements:** ~30 Functional Requirements

---

## Module Overview

The Job Management module enables recruiters and company admins to create, publish, edit, close, and manage job postings within their company. Jobs are the central entity around which the entire hiring pipeline revolves — candidates apply to jobs, applications track progress per job, and interviews are scheduled per application per job. This module covers the full job lifecycle from draft creation through publication to the candidate-facing job board, through closing and reopening. It includes job search, filtering, pagination, skill tagging, and status management. The candidate-facing job board displays only published jobs with rich filtering capabilities. Recruiters manage jobs from the company-side view with full CRUD operations and applicant tracking visibility.

---

## Responsibilities

1. **Job CRUD** — Create, read, update, and delete job postings (Recruiter/Admin only).
2. **Job Status Management** — Manage job lifecycle: Draft → Published → Closed, with reopen capability.
3. **Job Board (Candidate-Facing)** — Public listing of published jobs with search, filter, and pagination.
4. **Job Detail View** — Full job description page with "Apply Now" functionality for candidates.
5. **Skill Tagging** — Add/remove required skills as tags on job postings.
6. **Job Search & Filtering** — Search by keyword, filter by location, type, experience level, skills, salary, date posted.
7. **Applicant Tracking per Job** — Display number of applicants per job, link to applications.
8. **Job Ownership** — Jobs are scoped to company_id, created_by_id tracks the recruiter who created each job.
9. **Pagination & Sorting** — Server-side pagination and sorting by date, applicant count.

---

## Feature Extraction

### Feature 1: Job Creation & Editing

**Functional Description:**  
Recruiters create job postings by filling out a form with title, description, department, location, employment type, experience level, required skills, salary range, application deadline, and status. Jobs can be saved as drafts or published immediately. Published jobs appear on the candidate job board instantly.

**Technical Elaboration:**
- **Create Job:** `POST /jobs` (auth: Recruiter/Admin) — Accepts `{ title (required), description (required, rich text), department (string), location (string), remote (boolean toggle), employment_type (Full-Time/Part-Time/Contract/Internship), experience_level (entry/mid/senior), required_skills (string array — tag input), salary_min (number), salary_max (number), deadline (date), status (draft/published) }`. Validates: title not empty, description not empty, salary_min <= salary_max if both provided, deadline is future date. Sets `company_id` from `req.user.companyId`, `created_by_id` from `req.user.userId`. Returns created job with ID.
- **Edit Job:** `PATCH /jobs/:id` — Same fields, partial update. Validates job belongs to same company. Only Recruiter who created it or Admin can edit.
- **Frontend:** "Create Job" button on Company Jobs page opens a full form. Rich text editor for description (react-quill or tiptap). Tag input for skills with suggestion dropdown. Location text input with "Remote" toggle. Salary range with two number inputs. Date picker for deadline. Status selector (Draft/Published). "Save as Draft" and "Publish" buttons.

**Database Schema Reference:**
- `jobs` table: `id (bigint PK)`, `title (string NOT NULL)`, `description (text NOT NULL)`, `status (string DEFAULT 'draft')`, `department (string)`, `location (string)`, `experience_level (string)`, `required_skills (string[] DEFAULT '{}')`, `company_id (bigint FK → companies NOT NULL)`, `created_by_id (bigint FK → users)`, `created_at`, `updated_at`
- Note: `salary_min`, `salary_max`, `deadline`, `employment_type`, `remote` are not in current schema — extend `jobs` table with these columns.

---

### Feature 2: Job Status Lifecycle & Deletion

**Functional Description:**  
Jobs follow a status lifecycle: Draft (created but not visible) → Published (visible on candidate job board, accepting applications) → Closed (no longer accepting applications, removed from job board). Closed jobs can be reopened (status set back to Published). Jobs can be deleted entirely (soft or hard delete).

**Technical Elaboration:**
- **Change Status:** `PATCH /jobs/:id/status` — Accepts `{ status: 'published' | 'closed' | 'draft' }`. Validates: only Recruiter/Admin of same company, valid status transition. Publishing sets `published_at` timestamp. Closing disables the "Apply" button on candidate view.
- **Reopen:** Same endpoint with `status: 'published'`. Validates: only closed jobs can be reopened.
- **Delete:** `DELETE /jobs/:id` — Validates: job belongs to same company. Soft delete recommended (add `deleted_at` column) to preserve application/interview history.
- **Business Rules:** Cannot close a job with active interviews in progress (optional guard). Cannot delete a job with existing applications (return error suggesting close instead).

**Database Schema Reference:**
- `jobs` table: `status (string)` — values: `draft`, `published`, `closed`
- `applications` table: linked via `job_id` — prevent deletion if applications exist

---

### Feature 3: Company Jobs Page (Recruiter View)

**Functional Description:**  
The Company Jobs page displays all jobs posted by the company in a grid of cards. Each card shows key job info with status badges and action icons. Recruiters can search, filter by status/department, and access CRUD operations.

**Technical Elaboration:**
- **List Jobs (Company):** `GET /jobs` with auth — Returns jobs where `company_id = req.user.companyId`. Supports: `?status=published&department=Engineering&search=frontend&page=1&limit=12&sort=created_at:desc`. Includes `applicant_count` via subquery: `SELECT COUNT(*) FROM applications WHERE job_id = jobs.id`.
- **Frontend:** Grid layout at `/company/jobs` — 3 cards per row (desktop), 2 (tablet), 1 (mobile). Each card: Job Title (bold), Department, Location, Employment Type, Status Badge (Draft=grey, Published=green, Closed=red), Number of Applicants badge, Date Created (relative), Action icons (Edit pencil, View eye, Delete trash). Search bar at top. Status filter dropdown. Department filter dropdown. "Create Job" button (top right).

**Database Schema Reference:**
- `jobs` table: All fields — filtered by `company_id`, searched by `title`, filtered by `status`/`department`
- `applications` table: `job_id` — COUNT for applicant count display
- `users` table: `id` = `created_by_id` — to show creator name

---

### Feature 4: Candidate Job Board (Browse & Search)

**Functional Description:**  
Candidates browse open job listings on a dedicated jobs page. Only published jobs with future deadlines are displayed. Rich filtering by keyword, location, job type, experience level, skills, and salary range. Each job card shows essential details with an "Apply Now" button or "Already Applied" badge.

**Technical Elaboration:**
- **List Jobs (Public/Candidate):** `GET /api/jobs` — Returns jobs where `status = 'published'` and `deadline > NOW()` (or no deadline). Supports: `?search=react&location=chennai&type=Full-Time&experience=mid&skills=react,nodejs&salary_min=50000&salary_max=100000&posted=past_week&page=1&limit=12`. Each result includes company info (name, logo) via JOIN with `companies`.
- **Job Detail:** `GET /api/jobs/:id` — Returns full job detail: title, description (formatted), required_skills (tags), department, location, experience_level, salary range, deadline, company name/logo. If candidate is authenticated, includes `already_applied: boolean` by checking `applications` table for `job_id + candidate_id`.
- **Frontend:** Grid of job cards at `/candidate/jobs` — 2-3 per row. Each card: Job Title, Company Name + Logo/Avatar, Location (or "Remote"), Employment Type, Required Skills (tags, max 4 + "+N more"), Date Posted (relative), "Apply Now" button or "Already Applied" badge. Left sidebar or top filter bar with: keyword search, location filter, job type multi-select (Full-Time/Part-Time/Contract/Remote), experience level filter, skills tag filter, date posted filter, salary range slider. Pagination at bottom. Job Detail: side drawer or full page with formatted description, all skills, department, salary range, deadline, "Apply Now" button → opens Apply modal (resume selection, cover note textarea, submit button).

**Database Schema Reference:**
- `jobs` table: `id`, `title`, `description`, `status` (filtered: `published`), `department`, `location`, `experience_level`, `required_skills`, `company_id`
- `companies` table: `id`, `name`, `domain` — joined for company info on cards
- `applications` table: `job_id`, `candidate_id` — checked to show "Already Applied" badge
- `candidates` table: `id` — to identify the current candidate

---

### Feature 5: Job Application from Candidate View

**Functional Description:**  
Candidates apply to jobs through an Apply modal that appears on the job detail view. The application captures the candidate's resume (pre-filled from profile or re-upload) and an optional cover note. The system prevents duplicate applications to the same job.

**Technical Elaboration:**
- **Apply:** `POST /api/applications` — Accepts `{ job_id, resume_url (optional — defaults to profile resume), cover_note (text, max 500 chars) }`. Validates: job exists and status is 'published', candidate has not already applied (unique constraint on `job_id + candidate_id`), candidate profile is complete enough (`onboarding_completed = true` or `profile_completion >= 60`). Creates `applications` record with `status: 'applied'`, `applied_at: NOW()`, `resume_url` snapshot, `candidate_id` from auth, `parsed_skills` from candidate's skills at time of application. Triggers notification email: "Application submitted for [Job Title] at [Company Name]."
- **Frontend:** Apply modal: shows uploaded resume name with option to re-upload, Cover Note textarea (optional, 500 char max), "Confirm & Submit" button. Loading spinner during submission. Success toast on completion.

**Database Schema Reference:**
- `applications` table: `id`, `job_id (FK → jobs NOT NULL)`, `candidate_id (FK → candidates NOT NULL)`, `user_id (NULL — self-applied)`, `status (DEFAULT 'applied')`, `applied_at`, `resume_url`, `cover_note`, `ai_score`, `parsed_skills`
- **Unique Index:** `(job_id, candidate_id)` — prevents duplicates
- `candidates` table: `resume_url`, `skills`, `onboarding_completed`, `profile_completion` — for pre-fill and validation

---

## Sprint Plan

**Sprint Duration:** 1.5 Sprints (7-10 days)  
**Sprint 1:** Job CRUD backend + Company Jobs page + Job Detail — 5 days  
**Sprint 1.5:** Candidate Job Board + Search/Filter + Apply flow — 5 days

---

### Task List

- [ ] Build Job CRUD APIs (create, read, update, delete) with Zod validation
- [ ] Build Job status change endpoint (publish, close, reopen)
- [ ] Build Company Jobs page (grid cards, search, filter, CRUD actions)
- [ ] Build Job creation form (rich text editor, tag input, date picker, salary range)
- [ ] Build Job detail page (company view — full details + applicant count)
- [ ] Build Candidate Job Board (public listing with search and filter panel)
- [ ] Build Candidate Job Detail view (side drawer or full page)
- [ ] Build Apply modal (resume selection, cover note, submit)
- [ ] Build `POST /api/applications` endpoint (duplicate prevention, validation)
- [ ] Implement pagination for both company and candidate job listings
- [ ] Write tests for job CRUD, status transitions, job search/filter, application creation

---

### Prompt 1: Job CRUD Backend, Status Management & Company Jobs Page

> Build the complete Job Management backend and the company-side Jobs page. **Backend — Job CRUD:** Extend the `jobs` table with additional columns if not present: `salary_min (integer)`, `salary_max (integer)`, `employment_type (string DEFAULT 'full_time')` CHECK `full_time/part_time/contract/internship`, `deadline (date, nullable)`, `remote (boolean DEFAULT false)`, `published_at (timestamp, nullable)`, `deleted_at (timestamp, nullable — for soft delete)`. Create `src/modules/job/` with controller, service, repository, routes, validator, types. **Create Job:** `POST /jobs` — auth middleware + role middleware (Admin, Recruiter). Zod schema validates: `title (string, min 3, max 200, required)`, `description (string, min 50, required)`, `department (string, optional)`, `location (string, optional)`, `employment_type (enum, optional)`, `experience_level (enum: entry/mid/senior, optional)`, `required_skills (array of strings, optional)`, `salary_min (number, positive, optional)`, `salary_max (number, positive, optional, must be >= salary_min)`, `deadline (date string, must be future, optional)`, `status (enum: draft/published, default: draft)`. Service sets `company_id = req.user.companyId`, `created_by_id = req.user.userId`. If status is 'published', set `published_at = NOW()`. Repository inserts into `jobs` table.

> **Get Jobs (Company):** `GET /jobs` with company scoping — `WHERE company_id = req.user.companyId`. Include `applicant_count` via subquery `(SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id)`. Support query params: `search` (ILIKE on title), `status` filter, `department` filter, `page` (default 1), `limit` (default 12), `sort` (default `created_at:desc`). Return `{ success: true, data: { jobs: [...], pagination: { total, page, limit, totalPages } } }`. **Get Job Detail:** `GET /jobs/:id` — return full job with company info and applicant count. Validate job belongs to user's company. **Update Job:** `PATCH /jobs/:id` — partial update with same Zod schema (all fields optional). Validate ownership (same company, creator or admin). **Status Change:** `PATCH /jobs/:id/status` — accepts `{ status }`. Validate transitions: draft→published (set published_at), published→closed, closed→published (reopen). **Delete:** `DELETE /jobs/:id` — soft delete (set deleted_at). Return error if applications exist.

> **Frontend — Company Jobs Page:** Build at `/company/jobs`. Grid layout — each job as a card component `JobCard.tsx`. Card shows: title (bold, truncated), department badge, location with MapPin icon, employment type chip, status badge (Draft=grey, Published=green, Closed=red), applicant count with Users icon, created date (relative, formatDistanceToNow), action icons (Edit→pencil, View→eye, Delete→trash with confirmation modal). Top bar: search input (debounced 300ms), status filter dropdown (All/Draft/Published/Closed), "Create Job" button. Create Job form: modal or full page with all fields, rich text editor for description, tag input for skills, salary range inputs, date picker for deadline, status toggle. Use React Hook Form + Zod resolver. On submit → call POST /jobs → refresh list → success toast.

---

### Prompt 2: Candidate Job Board, Job Detail, Search/Filter & Apply Flow

> Build the candidate-facing job browsing experience with search, filtering, and the complete application submission flow. **Backend — Public Job Listing:** Modify `GET /api/jobs` to support public access (no auth required) with query: `WHERE status = 'published' AND (deadline IS NULL OR deadline > NOW()) AND deleted_at IS NULL`. JOIN with `companies` to include `company_name`, `company_domain`. Support filter params: `search (ILIKE on title + description)`, `location (ILIKE)`, `type (employment_type filter)`, `experience (experience_level filter)`, `skills (ANY overlap with required_skills array — use PostgreSQL array overlap operator &&)`, `salary_min / salary_max (range filter)`, `posted (enum: today/past_week/past_month — filter created_at)`, `page`, `limit (default 12)`. For authenticated candidates, add a subquery to check if the candidate has already applied: `EXISTS (SELECT 1 FROM applications WHERE applications.job_id = jobs.id AND applications.candidate_id = ?)` as `already_applied` boolean field. **Job Detail:** `GET /api/jobs/:id` — return complete job with formatted description, all required_skills, department, location, experience_level, salary_min/max, deadline, employment_type, company name/logo, applicant_count, and `already_applied` (if candidate authenticated).

> **Apply Endpoint:** `POST /api/applications` — auth required (Candidate role). Accepts `{ job_id (required), cover_note (string, max 500, optional) }`. Validate: job exists with `status = 'published'`, deadline not passed, candidate not already applied (check unique index), candidate `onboarding_completed = true` or `profile_completion >= 60`. Create application record: `job_id`, `candidate_id = req.user.userId`, `status = 'applied'`, `applied_at = NOW()`, `resume_url = candidate.resume_url` (snapshot), `cover_note`, `parsed_skills = candidate.skills` (snapshot at application time). Return created application. Trigger notification: application confirmation email to candidate.

> **Frontend — Candidate Jobs Page:** Build at `/candidate/jobs`. Layout: responsive grid (3 per row desktop, 2 tablet, 1 mobile). Each `JobCard.tsx`: title (bold), company name + avatar (first letter circle if no logo), location with MapPin icon (or "Remote" badge), employment type chip, required skills as tag chips (max 4, "+N more" overflow), date posted (relative), "Apply Now" button (primary) or "Already Applied" badge (green, disabled). **Filter Panel** (left sidebar on desktop, top collapsible on mobile): keyword search input, location text input, job type multi-select checkboxes (Full-Time/Part-Time/Contract/Internship/Remote), experience level dropdown (Entry/Mid/Senior), skills tag input with suggestions, salary range slider (min-max), date posted quick select (Today/Past Week/Past Month). "Clear Filters" link. **Pagination:** page-based navigation at bottom. **Job Detail View:** opens as side drawer (right slide-in, 50% width) or full page on mobile. Shows: full title, company name + logo, full description (HTML rendered), all skills as tags, department, location, experience level, salary range, deadline (with countdown if within 7 days), applicant count. If not applied: "Apply Now" button opens Apply modal — shows candidate's current resume filename with download preview, "Re-upload" option (PDF, max 5MB), Cover Note textarea (optional, 500 char max with counter), "Confirm & Submit" button with loading spinner. If already applied: shows "Applied on [date]" with current status badge. On submit → call `POST /api/applications` → close modal → show success toast "Application submitted successfully!" → update card to show "Already Applied" badge.

---

### Prompt 3: Job Management Testing, Validation & Edge Cases

> Write comprehensive tests and handle all edge cases for the Job Management module. **Backend Tests (Jest + Supertest):** (1) Create job with valid data → 201, returns job with id and all fields. (2) Create job with empty title → 400, validation error. (3) Create job with salary_min > salary_max → 400, validation error. (4) Create job as candidate role → 403, forbidden. (5) Get company jobs → returns only jobs belonging to user's company, not other companies. (6) Get company jobs with search → returns filtered results matching title ILIKE. (7) Get company jobs with status filter → returns only jobs with matching status. (8) Get company jobs with pagination → returns correct page, total count, totalPages. (9) Get job detail → returns full job with applicant_count. (10) Update job → 200, returns updated fields. (11) Update job belonging to different company → 403.

> (12) Change status draft→published → 200, published_at is set. (13) Change status published→closed → 200. (14) Change status closed→published (reopen) → 200. (15) Delete job with no applications → 200, soft deleted. (16) Delete job with applications → 400, error "Cannot delete job with existing applications". (17) Get public job listing → returns only published jobs with future deadlines. (18) Get public job listing with skills filter → uses PostgreSQL array overlap. (19) Apply to job → 201, creates application. (20) Apply to same job twice → 409, duplicate prevented. (21) Apply with incomplete profile → 400, profile completion required. (22) Apply to closed job → 400, job not accepting applications.

> **Frontend Tests (Vitest + RTL):** (1) JobCard renders title, company, location, status badge correctly. (2) Job creation form validates required fields. (3) Filter panel updates URL query params and triggers refetch. (4) Apply modal shows resume and cover note fields. (5) "Already Applied" badge renders when already_applied is true. **Edge Cases to Handle:** Deadline timezone handling (store UTC, display local), empty job description validation, skills array with duplicates (deduplicate on save), very long job descriptions (truncate on card, full on detail), jobs with 0 applicants (show "No applicants yet"), pagination on last page with partial results, search with special characters (SQL injection prevention via parameterized queries).

---
