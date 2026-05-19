# Module 4: Candidate Management

**Priority:** High | **Phase:** Phase 5  
**Build Order:** 4 (After Job Management)  
**Estimated Requirements:** ~34 Functional Requirements

---

## Module Overview

The Candidate Management module covers the entire candidate experience — from the 4-step profile onboarding wizard through the candidate dashboard, job browsing, application tracking, and interview viewing. Candidates are the primary consumers of the platform; they build their profiles, discover jobs, apply, track their applications through the hiring pipeline, and attend scheduled interviews. The module also covers candidate data as viewed by company users — a consolidated table of all candidates who have applied to the company's jobs, with profile snapshots, skill matching, and AI scores. The candidate profile is a rich, structured data set encompassing personal details, resume, professional links, skills, and job preferences, all collected through a resumable wizard and editable at any time.

---

## Responsibilities

1. **4-Step Onboarding Wizard** — Guided profile creation: Personal Details → Resume & Summary → Professional Links → Job Preferences.
2. **Candidate Dashboard** — Overview hub with profile completion, recent applications, upcoming interviews, recommended jobs, quick stats.
3. **Candidate Profile** — Full profile view/edit page with all sections (header, contact, links, resume, summary, skills, preferences).
4. **Application Tracking** — List of all applied jobs with pipeline stage, history timeline, withdraw capability.
5. **Interview Schedule View** — List of all scheduled interviews with details, status, and "Join Interview" button.
6. **Profile Completeness** — Progress tracking, completion percentage, strength score calculation.
7. **Resume Management** — Upload (PDF, max 5MB), re-upload, delete, preview, drive link alternative.
8. **Company-Side Candidate View** — List of candidates who applied to company jobs, with profile detail drawer.

---

## Feature Extraction

### Feature 1: 4-Step Candidate Onboarding Wizard

**Functional Description:**  
After registration (email or Google), candidates are redirected to a 4-step wizard to build their profile. Each step saves independently via its own API endpoint. The wizard is resumable — progress is stored server-side in the `current_step` field. Steps: (1) Personal Details, (2) Resume & Summary, (3) Professional Links, (4) Job Preferences.

**Technical Elaboration:**
- **Step 1 — Personal Details:** `PATCH /api/candidate/profile/step/1` — Accepts `{ avatar (string — one of 6 predefined IDs), name (pre-filled, editable), phone (required if missing), location (text), date_of_birth (date, optional), about_me (text, max 300 chars, optional) }`. Updates `candidates` table fields: `name`, `phone`, `location`. Avatar stored in `active_storage_attachments` or as a simple string field. Sets `current_step = 2` on success.
- **Step 2 — Resume & Summary:** `PATCH /api/candidate/profile/step/2` — Accepts resume file (PDF, max 5MB) via `POST /api/candidate/me/resume` (multipart/form-data) OR `resume_drive_link (URL string)`. Also accepts `summary (text, max 1000 chars)`. Tab switcher on frontend: "Upload File" vs "Paste Link". File upload shows progress bar. Stores `resume_url`, `summary` in candidates table. Sets `current_step = 3`.
- **Step 3 — Professional Links:** `PATCH /api/candidate/profile/step/3` — Accepts `{ github_url, leetcode_url, linkedin_url, portfolio_url, other_url }`. All optional but step is not skippable without acknowledgement. URL validation on each field. Stores in candidates table. Sets `current_step = 4`.
- **Step 4 — Job Preferences:** `PATCH /api/candidate/profile/step/4` — Accepts `{ skills (string array — tag input), salary_min (number), salary_max (number), job_types (array — Full-Time/Part-Time/Contract/Internship/Remote), preferred_role (string), preferred_location (string), open_to_relocation (boolean) }`. Stores `skills` array in candidates table, salary/job type/role/location stored in `preferences (jsonb)`. Sets `onboarding_completed = true`, calculates `profile_completion` percentage, sets `current_step = 4`.
- **Resumability:** `GET /api/candidate/profile` returns `current_step` — frontend redirects to incomplete step on wizard load. All previously saved data is pre-filled.

**Database Schema Reference:**
- `candidates` table: `id`, `name`, `phone`, `location`, `resume_url`, `linkedin_url`, `github_url`, `portfolio_url`, `summary`, `skills (string[])`, `preferences (jsonb — { preferred_role, preferred_location, salary_min, salary_max, job_types, open_to_relocation })`, `current_step (integer DEFAULT 1)`, `onboarding_completed (boolean DEFAULT false)`, `profile_completion (integer DEFAULT 0)`, `profile_strength_score (decimal)`
- `active_storage_attachments` + `active_storage_blobs`: For resume file storage
- Note: `leetcode_url`, `other_url`, `date_of_birth`, `about_me`, `avatar` — may need to be added as columns or stored in `resume_data (jsonb)` field

---

### Feature 2: Candidate Dashboard

**Functional Description:**  
The main dashboard page after login serves as an overview hub. It shows profile completion status, recent applications with pipeline stages, upcoming interviews, recommended jobs, and quick statistics.

**Technical Elaboration:**
- **Endpoint:** `GET /api/candidate/dashboard` — Returns aggregated data for the authenticated candidate.
- **Profile Completion Bar:** Horizontal progress bar with percentage. If below 80%, show prompt card: "Complete your profile to increase visibility." Percentage calculated from: name (10%), phone (10%), location (5%), resume (20%), summary (10%), skills (15%), professional links (10%), preferences (20%).
- **Recent Applications:** Query `applications WHERE candidate_id = ?` ORDER BY `applied_at DESC LIMIT 3`. Each includes: job title (JOIN jobs), company name (JOIN companies), pipeline status badge, applied date.
- **Upcoming Interviews:** Query `interviews JOIN applications WHERE candidate_id = ? AND status = 'scheduled' AND scheduled_at > NOW()` ORDER BY `scheduled_at ASC LIMIT 2`. Each includes: job title, company, round type, date/time, "Join Interview" button (visible when within 30 min of scheduled time).
- **Recommended Jobs:** Query `jobs WHERE status = 'published'` matched against candidate's `skills` array (PostgreSQL array overlap `&&`). LIMIT 4. Each as a mini job card.
- **Quick Stats Row:** Total Applications Submitted (COUNT), Active Applications (WHERE status NOT IN 'rejected', 'withdrawn'), Interviews Scheduled (COUNT), Profile Strength Score.
- **Frontend:** Top navigation bar (horizontal, minimal) with links: Profile, Jobs, Applications, Interviews. Dashboard cards layout. Profile completion as animated progress bar.

**Database Schema Reference:**
- `candidates` table: `id`, `profile_completion`, `profile_strength_score`, `skills` — for completion bar and job matching
- `applications` table: `candidate_id`, `status`, `applied_at`, `job_id` — for applications list and stats
- `jobs` table: `id`, `title`, `company_id`, `required_skills` — for recommended jobs and application context
- `companies` table: `id`, `name` — for company name display
- `interviews` table: `application_id`, `scheduled_at`, `status`, `round_type` — for upcoming interviews

---

### Feature 3: Candidate Profile Page (View & Edit)

**Functional Description:**  
A comprehensive profile page that displays all candidate data collected during onboarding, plus additional fields. The page is divided into sections (Header, Contact, Links, Resume, Summary, Skills, Preferences) with inline edit or modal edit capability for each section.

**Technical Elaboration:**
- **Get Profile:** `GET /api/candidate/profile` — Returns complete candidate record with all fields.
- **Update Profile:** `PATCH /api/candidate/me/profile` — Accepts any subset of profile fields for update. Recalculates `profile_completion` on every update.
- **Resume Upload:** `POST /api/candidate/me/resume` — Multipart file upload, PDF only, max 5MB. Validates file type and size. Stores file in local storage or cloud (S3). Updates `resume_url` in candidates table.
- **Resume Delete:** `DELETE /api/candidate/me/resume` — Sets `resume_url = NULL`, deletes file.
- **Frontend Sections:**
  - **Header:** Avatar (selected from 6 pre-built), Full Name, Target Role (from preferences), Profile Completion ring, "Edit Profile" button.
  - **Contact Info:** Email, Phone, Location — inline edit or modal.
  - **Professional Links:** GitHub, LeetCode, LinkedIn, Portfolio, Other — each as clickable chip with platform icon.
  - **Resume:** File name + download icon, upload date, re-upload/delete buttons, Drive link, "Preview" button (opens PDF in modal).
  - **Summary:** Formatted paragraph with edit icon for inline editor.
  - **Skills:** Horizontal tag wrap with add/remove interface.
  - **Preferences:** Salary range, Job type chips, Preferred location display.

**Database Schema Reference:**
- `candidates` table: ALL fields — `id`, `name`, `email`, `phone`, `location`, `resume_url`, `linkedin_url`, `github_url`, `portfolio_url`, `status`, `skills`, `summary`, `preferences (jsonb)`, `profile_completion`, `profile_strength_score`, `onboarding_completed`
- `active_storage_blobs`: `filename`, `content_type`, `byte_size` — for resume file metadata
- `active_storage_attachments`: `name='resume_file'`, `record_type='Candidate'`, `record_id=candidate.id` — links resume to candidate

---

### Feature 4: Candidate Applications Page

**Functional Description:**  
A list view of all jobs the candidate has applied to, showing current pipeline status, application history, and actions (view detail, withdraw). Application detail shows the full pipeline stage timeline with timestamps.

**Technical Elaboration:**
- **List Applications:** `GET /api/candidate/applications` — Returns applications WHERE `candidate_id = req.user.candidateId`. JOIN with `jobs` and `companies` for job title and company name. Support filters: `?status=screening&search=frontend&page=1&limit=20`. Each record includes: job_id, job_title, company_name, applied_at, status (color-coded), last_updated.
- **Application Detail:** `GET /api/candidate/applications/:id` — Returns full application with: all fields, resume snapshot URL, pipeline stage history (query a `stage_history` table or derive from audit log: stage transitions with timestamps), linked interview schedule (JOIN interviews WHERE application_id = ?).
- **Withdraw:** `PATCH /api/candidate/applications/:id/withdraw` — Sets `status = 'withdrawn'`. Only allowed if current status is not 'hired' or 'rejected'. Triggers notification to recruiter.
- **Frontend:** Table-style list at `/candidate/applications`. Columns: Job Title (clickable), Company Name, Date Applied, Current Pipeline Stage (color-coded badge: Applied=blue, Screening=yellow, Shortlisted=orange, Interview=purple, Offer=green, Hired=green-bold, Rejected=red), Last Updated (relative), Actions (View Details | Withdraw). Pipeline stages: `applied → screening → shortlisted → interview_1 → interview_2 → offer → hired | rejected`. Application detail drawer: full details, pipeline timeline (stepper component showing transitions with dates), interview schedule, Withdraw button.

**Database Schema Reference:**
- `applications` table: `id`, `job_id`, `candidate_id`, `status`, `applied_at`, `resume_url`, `cover_note`, `ai_score`, `parsed_skills`, `created_at`, `updated_at`
- `jobs` table: `title`, `company_id` — for display
- `companies` table: `name` — for display
- `interviews` table: `application_id`, `round_type`, `scheduled_at`, `status` — for interview schedule
- Note: For stage history, consider adding a `stage_transitions` table: `id`, `application_id (FK)`, `from_stage`, `to_stage`, `changed_by (FK → users)`, `changed_at (timestamp)`

---

### Feature 5: Candidate Interviews Page

**Functional Description:**  
A timeline-style list of all interviews scheduled for the candidate, sorted by date. Each interview card shows the job, round type, date/time, interviewer name, status, and a "Join Interview" button that activates 30 minutes before the scheduled time.

**Technical Elaboration:**
- **List Interviews:** `GET /api/candidate/interviews` — Returns interviews linked to candidate's applications: `JOIN applications ON interviews.application_id = applications.id WHERE applications.candidate_id = ? ORDER BY scheduled_at ASC`. Includes: job title (JOIN jobs), company name (JOIN companies), round_type, scheduled_at, status, interviewer name (JOIN users on interviewer_id), meeting_link.
- **Frontend:** Vertical list at `/candidate/interviews` with interview cards sorted by date. Each card: Job Title, Company Name, Round Type badge (Phone/Technical/Behavioral/HR/Final), Scheduled Date & Time (formatted), Duration (e.g., "45 minutes"), Interviewer Name (if disclosed), Status badge (Scheduled=blue, Completed=green, Cancelled=red), "Join Interview" button (active when `NOW() >= scheduled_at - 30 min`), Meeting Link. Filters: status (Upcoming/Completed/Cancelled), round type.

**Database Schema Reference:**
- `interviews` table: `id`, `application_id`, `round_type`, `interviewer_id`, `scheduled_at`, `status`, `meeting_link`
- `applications` table: `id`, `candidate_id`, `job_id` — to link interview to candidate and job
- `jobs` table: `title` — for display
- `companies` table: `name` — for display
- `users` table: `id`, `name` — for interviewer name (via `interviewer_id`)

---

### Feature 6: Company-Side Candidates View

**Functional Description:**  
Company recruiters can view a consolidated list of all candidates who have applied to at least one job at their company. The list shows candidate info, applied jobs, skills, overall status, and AI match score. No "Add Candidate" button — candidates enter only through self-application.

**Technical Elaboration:**
- **List Candidates (Company):** Custom query joining `candidates → applications → jobs WHERE jobs.company_id = req.user.companyId`. Returns DISTINCT candidates with: name, email, phone, applied_jobs_count, top 3 skills, overall_status (most advanced pipeline stage), ai_match_score, first_applied_date. Support: `?search=john&status=interview&job_id=5&skill=react&page=1&limit=20`.
- **Candidate Detail (Company):** Returns: full profile card (avatar, name, contact, links), all applications from this candidate to this company (list with job title, stage, date), resume download link, skills list, AI match score.
- **Frontend:** Table at `/company/candidates`. Columns: Candidate Name, Email, Phone, Applied Jobs (count), Skills (top 3 tags + "+N more"), Overall Status (badge), AI Score, Date First Applied, Actions (View Profile). Search bar, status filter, job filter, skill filter. Candidate detail drawer: profile card, applications list, resume link.

**Database Schema Reference:**
- `candidates` table: `id`, `name`, `email`, `phone`, `skills`, `ai_match_score`, `resume_url`, `linkedin_url`, `github_url`, `portfolio_url`
- `applications` table: `candidate_id`, `job_id`, `status` — to find candidates who applied and their stages
- `jobs` table: `company_id`, `title` — to scope to company and show job names

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Onboarding wizard + profile page + resume upload — 7 days  
**Sprint 2:** Dashboard + applications tracking + interviews view + company candidates page — 7 days

---

### Task List

**Sprint 1:**
- [ ] Build 4-step wizard backend (step 1-4 PATCH endpoints, current_step tracking)
- [ ] Build resume upload/delete endpoints (multer, PDF validation, file storage)
- [ ] Build profile get/update endpoints
- [ ] Build wizard frontend (4 steps, progress indicator, navigation, resumability)
- [ ] Build candidate profile page (all sections, inline edit, resume preview)
- [ ] Build profile completion percentage calculation logic
- [ ] Build candidate navigation bar (Profile, Jobs, Applications, Interviews)

**Sprint 2:**
- [ ] Build candidate dashboard backend (aggregation queries)
- [ ] Build candidate dashboard frontend (completion bar, recent apps, upcoming interviews, recommended jobs, stats)
- [ ] Build candidate applications page (list, filter, detail drawer, withdraw)
- [ ] Build stage transitions tracking (optional stage_transitions table)
- [ ] Build candidate interviews page (list, filter, join button activation logic)
- [ ] Build company-side candidates page (list, search, filter, detail drawer)
- [ ] Write tests for all candidate endpoints

---

### Prompt 1: 4-Step Onboarding Wizard Backend & Resume Upload

> Build the complete 4-step candidate onboarding wizard with server-side step tracking and resume file upload. **Backend:** Create `src/modules/candidate/` with controller, service, repository, routes, validator, types. Implement `GET /api/candidate/profile` â€” requires auth (Candidate role), returns full candidate record from `candidates` table by `req.user.candidateId`, includes `current_step` for wizard resumability. Implement `PATCH /api/candidate/profile/step/1` â€” Zod validates: `name (string, required)`, `phone (string, required, min 10 digits)`, `location (string, optional)`, `date_of_birth (date string, optional)`, `about_me (string, max 300, optional)`, `avatar (string, optional)`. Updates candidates table fields, sets `current_step = 2`, recalculates `profile_completion`.

> Implement `PATCH /api/candidate/profile/step/2` â€” validates: `summary (string, max 1000, optional)`, `resume_drive_link (URL string, optional)`. For resume file upload, create separate `POST /api/candidate/me/resume` â€” use multer middleware with fileFilter (only `application/pdf`), limits (`fileSize: 5 * 1024 * 1024`). Store file locally at `uploads/resumes/{candidateId}_{timestamp}.pdf`. Update `resume_url` in candidates table. Create `DELETE /api/candidate/me/resume` â€” delete file, set `resume_url = NULL`. Step 2 sets `current_step = 3`. Implement `PATCH /api/candidate/profile/step/3` â€” validates URLs for github, linkedin, portfolio, leetcode. Sets `current_step = 4`. Implement `PATCH /api/candidate/profile/step/4` â€” validates: `skills (array of strings, min 1 required)`, salary preferences, job types. Set `onboarding_completed = true`. Calculate `profile_completion` as weighted sum.

> **Frontend:** Build wizard at `/candidate/onboarding`. Progress bar at top showing 4 steps with labels. Each step in its own route `/candidate/onboarding/step/1` through `/step/4`. On wizard load, call `GET /api/candidate/profile` and redirect to `current_step`. Step 1: avatar grid, name input, phone input, location input, DOB date picker, about me textarea. Step 2: tab switcher for upload/link, drag-and-drop zone for PDF, summary textarea. Step 3: URL input fields with platform icons. Step 4: skill tag input, salary inputs, job type chips, preferred role/location. "Complete Profile" button -> celebration screen with confetti -> redirect to `/candidate/dashboard`. All forms use React Hook Form + Zod. Navigation: "Save & Continue" / "Back" buttons.

---

### Prompt 2: Candidate Dashboard & Profile Page

> Build the candidate dashboard overview and full profile page with editing. **Candidate Dashboard Backend:** Create `GET /api/candidate/dashboard` â€” auth required (Candidate). Execute queries scoped to `candidate_id`: (1) Profile completion from candidates table. (2) Recent applications: `SELECT a.id, a.status, a.applied_at, j.title, c.name FROM applications a JOIN jobs j ON a.job_id = j.id JOIN companies c ON j.company_id = c.id WHERE a.candidate_id = ? ORDER BY a.applied_at DESC LIMIT 3`. (3) Upcoming interviews: scheduled interviews with job/company info, `LIMIT 2`. (4) Recommended jobs: jobs matching candidate skills via array overlap. (5) Quick stats: total apps, active apps, scheduled interviews.

> **Profile Page Backend:** `PATCH /api/candidate/me/profile` â€” accepts any combination of profile fields, validates with partial Zod schema, updates candidates table, recalculates profile_completion. **Frontend â€” Dashboard:** Build at `/candidate/dashboard`. Profile Completion Bar with percentage. Recent Applications cards. Upcoming Interviews cards with "Join" button (visible 30 min before). Recommended Jobs cards. Quick Stats Row with 4 metric cards.

> **Profile Page Frontend:** Build at `/candidate/profile`. Sections: Personal Info, About Me, Resume, Professional Links, Skills, Preferences. Each section has an "Edit" icon that opens inline editor or modal. Resume section: file name display, download/re-upload/delete buttons, preview button. Skills: horizontal tag wrap with add/remove functionality.

---

### Prompt 3: Application Tracking & Candidate Interviews Page

> Build the candidate applications tracking page and the interviews schedule page. **Applications Page Backend:** `GET /api/candidate/applications` â€” returns all applications for candidate with job and company info. Support `?status=screening&search=frontend&page=1&limit=20`. `GET /api/candidate/applications/:id` â€” returns single application with full detail including stage history and linked interviews. `PATCH /api/candidate/applications/:id/withdraw` â€” validates application belongs to candidate, status not 'hired' or 'rejected', sets `status = 'withdrawn'`.

> **Candidate Interviews Backend:** `GET /api/candidate/interviews` â€” auth required. Query interviews joined with applications, jobs, companies, and interviewers. Support filters: `?status=scheduled&round_type=technical`. Return: interview id, job_title, company_name, round_type, scheduled_at, status, meeting_link, interviewer_name.

> **Frontend â€” Applications Page:** Build at `/candidate/applications`. Table with columns: Job Title, Company Name, Date Applied, Pipeline Stage (color-coded badge), Last Updated, Actions (View Details, Withdraw with confirmation). Application detail drawer: full data, pipeline stage timeline (vertical stepper with dates), interview schedule. **Interviews Page:** Build at `/candidate/interviews`. Vertical list of interview cards sorted by date. Each card: Job Title, Company Name, Round Type badge, Date/Time, Interviewer Name, Status badge, "Join Interview" button (active 30 min before). Filters: status tabs (Upcoming/Completed/Cancelled), round type filter.

---

### Prompt 4: Company-Side Candidates View & Testing

> Build the company recruiter's view of all candidates and comprehensive tests. **Company-Side Candidates Backend:** Create `GET /api/companies/me/candidates` â€” auth required (Admin, Recruiter). Complex query: `SELECT DISTINCT c.id, c.name, c.email, c.phone, c.skills, COUNT(a.id) as applied_jobs_count FROM candidates c JOIN applications a ON a.candidate_id = c.id JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ? GROUP BY c.id`. Support params: `?search=john`, `status=interview`, `job_id=5`, `skill=react`, `page=1&limit=20`. Create `GET /api/companies/me/candidates/:id` â€” returns full candidate profile plus all applications from this candidate to this company.

> **Frontend â€” Company Candidates Page:** Build at `/company/candidates`. Table layout with columns: Candidate Name, Email, Phone, Applied Jobs count, Skills (top 3 tags), Overall Status badge, Date First Applied, Actions ("View Profile"). Search bar, status filter, job filter dropdown. Candidate detail opens as right drawer: profile card, all applications table, resume download link, skills list.

> Write integration tests: (1) Get candidate interviews returns correct data. (2) Company candidates list is scoped correctly to company. (3) Candidate detail returns applications only for requesting company. (4) Wizard step validation works correctly. (5) Resume upload accepts PDF only. (6) Profile completion calculation is accurate. (7) Application withdrawal works and prevents re-withdrawal.

---