# Module 6: Interview Management

**Priority:** Medium | **Phase:** Phase 7  
**Build Order:** 6 (After Application & Hiring Pipeline)  
**Estimated Requirements:** ~25 Functional Requirements

---

## Module Overview

The Interview Management module orchestrates the entire interview lifecycle — from scheduling by recruiters, through assignment to interviewers, conducting the interview (including the live coding workspace), to structured feedback submission and pipeline stage updates based on interview outcomes. The module serves three distinct user experiences: Recruiters schedule, reschedule, and cancel interviews while viewing feedback; Interviewers see only their assigned interviews and submit structured feedback (rating, strengths, weaknesses, recommendation); Candidates view their upcoming interviews and join the live interview workspace. The module also includes the Live Interview Workspace extension — a split-screen environment combining Jitsi Meet video calling with a Monaco Code Editor and JDoodle code execution for technical rounds, and an MCQ assessment panel for aptitude rounds.

---

## Responsibilities

1. **Interview Scheduling** — Recruiters schedule interviews by selecting application, round type, interviewer, date/time, and duration.
2. **Interview Rescheduling & Cancellation** — Update interview date/time or cancel with notification to all parties.
3. **Interviewer Dashboard** — Focused view showing assigned interviews, upcoming sessions, pending feedback.
4. **Feedback Submission** — Structured form: rating (1-5), strengths, weaknesses, recommendation (Strong Hire/Hire/No Hire/Strong No Hire).
5. **Company Interviews Page** — Master list of all interviews across all jobs with search, filter, and quick actions.
6. **Company Feedback Page** — Consolidated view of all submitted feedback with detail view.
7. **Live Interview Workspace** — Technical round: Jitsi video + Monaco editor + JDoodle execution. Aptitude round: MCQ assessment.
8. **Pipeline Integration** — Auto-update candidate stage based on interview feedback/recommendation.
9. **Email Notifications** — Notify candidate and interviewer on schedule, reschedule, and cancellation.

---

## Feature Extraction

### Feature 1: Interview Scheduling, Rescheduling & Cancellation

**Functional Description:**  
Recruiters schedule interviews by selecting a specific application (candidate + job pair), choosing a round type, assigning an interviewer, and setting the date, time, and duration. The system sends email notifications to both the candidate and interviewer. Interviews can be rescheduled (new date/time) or cancelled entirely.

**Technical Elaboration:**
- **Schedule:** `POST /api/interviews` — Auth (Admin, Recruiter). Accepts `{ application_id (required), round_type (required — phone/screening/technical/behavioral/hr/final), interviewer_id (required — FK → users), scheduled_at (datetime, required — must be future), duration (integer — minutes: 30/45/60/90, default 60), meeting_link (optional — Zoom/Meet URL, if blank use platform workspace) }`. Validates: application exists and belongs to company, interviewer belongs to same company and has Interviewer role, no scheduling conflict for interviewer (check overlapping time). Creates `interviews` record with `status: 'scheduled'`. Triggers emails: candidate gets interview schedule notification, interviewer gets assignment notification.
- **Reschedule:** `PATCH /api/interviews/:id` — Accepts `{ scheduled_at (new datetime), duration (optional), interviewer_id (optional — reassign) }`. Validates same rules. Updates record. Sends reschedule notification emails to both parties.
- **Cancel:** `DELETE /api/interviews/:id` — Sets `status: 'cancelled'` (soft delete). Sends cancellation emails. Optionally accepts `{ reason: "..." }` in body.
- **Get Interview Details:** `GET /api/interviews/:id` — Returns full interview with application, candidate, and job context.

**Database Schema Reference:**
- `interviews` table: `id (bigint PK)`, `application_id (bigint FK → applications NOT NULL)`, `round_type (string NOT NULL)` CHECK `phone/screening/technical/behavioral/hr/final`, `interviewer_id (bigint FK → users)`, `scheduled_at (datetime NOT NULL)`, `status (string DEFAULT 'scheduled')` CHECK `scheduled/completed/cancelled`, `meeting_link (string)`, `created_at`, `updated_at`
- Note: `duration` column not in current schema — extend with `duration (integer DEFAULT 60)`
- `applications` table: `id`, `candidate_id`, `job_id` — for context
- `users` table: `id`, `name`, `company_id` — for interviewer validation
- `candidates` table: `name`, `email` — for notification
- `jobs` table: `title`, `company_id` — for scoping and notification content

---

### Feature 2: Company Interviews Page & Feedback Page

**Functional Description:**  
The Company Interviews page lists all interviews across all jobs for the company in a table format. The Company Feedback page shows all submitted feedback. Both pages support search, filter, and quick actions.

**Technical Elaboration:**
- **Company Interviews List:** `GET /api/interviews` with company scoping — Query: `SELECT i.*, a.candidate_id, c.name as candidate_name, j.title as job_title, u.name as interviewer_name FROM interviews i JOIN applications a ON i.application_id = a.id JOIN candidates c ON a.candidate_id = c.id JOIN jobs j ON a.job_id = j.id LEFT JOIN users u ON i.interviewer_id = u.id WHERE j.company_id = ?`. Support: `?status=scheduled&round_type=technical&interviewer_id=5&search=john&date_from=...&date_to=...&page=1&limit=20`.
- **Company Feedback List:** `GET /api/feedbacks` with company scoping — Query: `SELECT f.*, i.round_type, i.scheduled_at, c.name as candidate_name, j.title as job_title, u.name as interviewer_name FROM feedbacks f JOIN interviews i ON f.interview_id = i.id JOIN applications a ON i.application_id = a.id JOIN candidates c ON a.candidate_id = c.id JOIN jobs j ON a.job_id = j.id LEFT JOIN users u ON i.interviewer_id = u.id WHERE j.company_id = ?`.
- **Feedback Detail:** Returns full feedback with candidate and interview context.
- **Frontend Interviews Page** at `/company/interviews`: Table with columns: Candidate Name, Job Title, Round Type (badge), Interviewer Name, Scheduled Date & Time, Duration, Status (badge), Actions (View/Reschedule/Cancel/Join). "Schedule Interview" button (top right) opens scheduling modal. Search by candidate/job, filter by status/round type/interviewer/date range.
- **Frontend Feedback Page** at `/company/feedback`: Table with columns: Candidate Name, Job Title, Round Type, Interviewer Name, Rating (1-5 stars), Recommendation (badge), Date Submitted, Actions (View Full Feedback). Feedback detail drawer: candidate + interview details at top, rating stars, strengths text block, weaknesses text block, recommendation badge, submitted by + date.

**Database Schema Reference:**
- `interviews` table: All fields — primary data source
- `feedbacks` table: `id`, `interview_id (FK)`, `rating`, `strengths`, `weaknesses`, `recommendation`
- All join tables for context as listed above

---

### Feature 3: Interviewer Dashboard & Feedback Submission

**Functional Description:**  
Interviewers have a focused, minimal portal showing only their assigned interviews and feedback obligations. The dashboard shows key metrics (total assigned, upcoming, completed, pending feedback). The feedback form collects structured evaluation: rating, strengths, weaknesses, and hiring recommendation.

**Technical Elaboration:**
- **Interviewer Dashboard Metrics:** Total Assigned (COUNT interviews WHERE interviewer_id = ?), Upcoming (WHERE status = 'scheduled' AND scheduled_at > NOW()), Completed (WHERE status = 'completed'), Pending Feedback (completed interviews with no feedback: LEFT JOIN feedbacks WHERE feedbacks.id IS NULL).
- **Interviewer Interviews List:** `GET /api/interviewer/interviews` — Returns interviews WHERE `interviewer_id = req.user.userId`. Includes candidate name, job title, round type, date, status, feedback status (submitted/pending). Support `?status=scheduled&date_from=...`.
- **Submit Feedback:** `POST /api/interviews/:id/feedback` — Auth (Interviewer). Zod validates: `rating (integer, 1-5, required)`, `strengths (text, required, min 10 chars)`, `weaknesses (text, required, min 10 chars)`, `recommendation (enum: strong_hire/hire/no_hire/strong_no_hire, required)`, `additional_comments (text, optional)`. Validates: interview belongs to this interviewer, interview status is 'completed', no existing feedback (one feedback per interview). Creates `feedbacks` record. Optionally updates interview status or triggers pipeline stage update based on recommendation.
- **View Feedback:** `GET /api/interviews/:id/feedback` — Returns feedback if exists.
- **Frontend Interviewer Dashboard:** Clean layout at `/interviewer/dashboard` with 4 metric cards. Upcoming interview cards (3-5, with Join button). **Interviews Page** at `/interviewer/interviews`: Table with columns, status and feedback status filters. **Feedback Form:** Opens on "Submit Feedback" click. Read-only interview details at top. Rating: 1-5 star selector (interactive, required). Strengths: textarea (required). Weaknesses: textarea (required). Recommendation: radio buttons (Strong Hire/Hire/No Hire/Strong No Hire). Additional Comments: optional textarea. Submit button. Once submitted → locked (read-only), confirmation animation, auto-redirect to interviews list.

**Database Schema Reference:**
- `feedbacks` table: `id (bigint PK)`, `interview_id (bigint FK → interviews NOT NULL)`, `rating (integer NOT NULL)` CHECK `1-5`, `strengths (text)`, `weaknesses (text)`, `recommendation (string NOT NULL)` CHECK `strong_hire/hire/no_hire/strong_no_hire`, `created_at`, `updated_at`
- `interviews` table: `interviewer_id` — to scope to current interviewer
- `applications` table: `status` — may be updated based on recommendation

---

### Feature 4: Live Interview Workspace

**Functional Description:**  
The Live Interview Workspace is a split-screen environment for conducting interviews. For technical rounds: left panel has Jitsi Meet video call, right panel has Monaco code editor with JDoodle execution. For aptitude rounds: full-screen MCQ assessment panel. The workspace is accessed via a "Join Interview" button that activates 30 minutes before the scheduled time.

**Technical Elaboration:**
- **Join Interview:** `POST /api/interviews/:id/join` — Validates: interview exists, user is either the candidate or interviewer, interview is scheduled, current time is within 30 min of scheduled_at. Returns workspace config: `{ roomName: 'interview_{id}', role: 'candidate' | 'interviewer', roundType: 'technical' | 'aptitude', candidateName, interviewerName }`.
- **End Interview:** `POST /api/interviews/:id/end` — Sets `status = 'completed'`. Only interviewer can end.
- **Code Execution:** `POST /api/interviews/:id/execute` — Proxy to JDoodle API. Accepts `{ language, versionIndex, script, stdin }`. Rate limited: 10/min per session. Max execution 15s. Returns `{ output, statusCode, memory, cpuTime }`.
- **Save Code:** `POST /api/interviews/:id/save-code` — Auto-saves code snapshot every 5 seconds. Stores `{ language, code, timestamp }` in interview metadata (add `code_snapshots (jsonb DEFAULT '[]')` column to interviews table or separate table).
- **Candidate Technical View:** Split-screen. Left: Jitsi Meet iframe (`interview_{id}` room, auto-join, audio/video on). Right: Monaco Editor (language selector dropdown, line numbers, minimap, dark/light theme toggle), Run Code button → output console below (stdout, stderr, stdin input, execution time, memory).
- **Interviewer Technical View:** Full-screen Jitsi Meet. No code editor visible. Preparation notes panel (collapsible).
- **Candidate Aptitude View:** Full-screen MCQ panel: question counter, countdown timer (color changes red at 10%), question text, answer options (radio/checkbox), previous/next buttons, question navigator grid (answered/unanswered/flagged), flag for review, auto-submit at timer zero, manual submit with confirmation.
- **Interviewer Aptitude View:** After candidate submits: auto-graded score, each question with candidate's answer vs correct answer, manual grading for short-answer questions.

**Database Schema Reference:**
- `interviews` table: `id`, `application_id`, `round_type`, `interviewer_id`, `scheduled_at`, `status`, `meeting_link`
- Note: Extend with `code_snapshots (jsonb DEFAULT '[]')` for auto-save, `duration (integer)` for timer
- Note: For MCQ, may need `assessment_questions` table and `assessment_responses` table — future extension

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Interview scheduling, company interviews/feedback pages, interviewer portal — 7 days  
**Sprint 2:** Live Interview Workspace (Jitsi + Monaco + JDoodle), aptitude round, auto-save — 7 days

---

### Task List

**Sprint 1:**
- [ ] Extend interviews table (add duration column)
- [ ] Build interview scheduling endpoint (POST with validation, conflict check)
- [ ] Build reschedule (PATCH) and cancel (DELETE) endpoints
- [ ] Build company interviews list page (table, search, filter)
- [ ] Build interview scheduling modal (application selector, round type, interviewer, date/time, duration)
- [ ] Build interviewer dashboard (metrics, upcoming interviews)
- [ ] Build interviewer interviews list page
- [ ] Build feedback submission endpoint and form
- [ ] Build company feedback page (table, detail drawer)
- [ ] Send email notifications on schedule/reschedule/cancel

**Sprint 2:**
- [ ] Build "Join Interview" endpoint with time validation
- [ ] Build Live Interview Workspace page layout (split-screen)
- [ ] Integrate Jitsi Meet video component (auto-join, room naming)
- [ ] Integrate Monaco Editor component (language selector, theme toggle)
- [ ] Build code execution proxy (JDoodle API, rate limiting)
- [ ] Build auto-save code snapshots (5-second interval)
- [ ] Build output console (stdout, stderr, stdin input)
- [ ] Build "End Interview" functionality
- [ ] Build MCQ assessment panel (optional/future)
- [ ] Write tests for scheduling, feedback submission, workspace access

---

### Prompt 1: Interview Scheduling, Company Pages & Email Notifications

> Build the complete interview scheduling system and company interviews/feedback pages. **Backend â€” Interview Scheduling:** Extend `interviews` table: add `duration (integer DEFAULT 60)` column. Create `src/modules/interview/` with full module structure. `POST /api/interviews` â€” auth (Admin, Recruiter). Zod validates: `application_id`, `round_type (enum)`, `interviewer_id`, `scheduled_at (future datetime)`, `duration (30/45/60/90)`, `meeting_link (optional URL)`. Service validates: application exists and belongs to company, interviewer belongs to same company with Interviewer role, scheduling conflict check. Create interview record.

> Send emails using Nodemailer: (1) To candidate: interview scheduled with job title, round type, date/time, duration, meeting link. (2) To interviewer: interview assigned with candidate name, job title, date/time. `PATCH /api/interviews/:id` â€” update schedule, send reschedule emails. `DELETE /api/interviews/:id` â€” set `status = 'cancelled'`, send cancellation emails.

> **Company Interviews Page Frontend:** Build at `/company/interviews`. Table columns: Candidate Name, Job Title, Round Type badge, Interviewer Name, Scheduled Date/Time, Duration, Status badge, Actions (View, Reschedule, Cancel, Join). "Schedule Interview" button -> modal with all fields. Search and filter by status, round type, interviewer, date range. **Company Feedback Page:** Build at `/company/feedback`. Table: Candidate Name, Job Title, Round Type, Interviewer, Rating (stars), Recommendation badge, Date, View button. Feedback detail drawer with full interview and feedback data.

---

### Prompt 2: Interviewer Portal â€” Dashboard, Interview List & Feedback Submission

> Build the complete Interviewer experience â€” focused portal with dashboard, interview list, and structured feedback submission. **Backend:** `GET /api/interviewer/interviews` â€” auth (Interviewer). Query interviews for this interviewer with candidate, job, company info and feedback status. Support filters and pagination. Dashboard metrics: total, upcoming, completed, pending_feedback. `GET /api/interviews/:id/candidate` â€” returns candidate profile for interview prep.

> **Feedback Submission:** `POST /api/interviews/:id/feedback` â€” auth (Interviewer). Validate: interview exists and belongs to this interviewer, status is 'completed', no existing feedback. Zod validates: `rating (1-5)`, `strengths (min 10, max 2000)`, `weaknesses (min 10, max 2000)`, `recommendation (enum: strong_hire/hire/no_hire/strong_no_hire)`, `additional_comments (optional)`. Create feedbacks record. `GET /api/interviews/:id/feedback` â€” returns feedback for this interview.

> **Frontend â€” Interviewer Layout:** Create `InterviewerLayout` with minimal top navigation: Dashboard, Interviews, Feedback. **Dashboard** at `/interviewer/dashboard`: 4 metric cards, upcoming interview preview cards with "Join" button. **Interviews Page** at `/interviewer/interviews`: Table with candidate, job, round type, date, status, feedback status, actions. **Feedback Form:** Opens as full page. Read-only interview details at top. Interactive 1-5 star rating. Strengths/Weaknesses textareas with labels. Recommendation as 4 radio buttons in 2x2 grid (color-coded). Submit -> confirmation animation -> redirect -> toast. View feedback in read-only mode.

---

### Prompt 3: Live Interview Workspace â€” Video, Code Editor & Execution

> Build the Live Interview Workspace with role-based views: split-screen Jitsi video + Monaco editor for technical rounds. **Backend â€” Workspace Endpoints:** `POST /api/interviews/:id/join` â€” auth required. Validate: user is candidate or interviewer for this interview, status is 'scheduled', within 30 minutes of start time. Return workspace config: `{ roomName, displayName, role, roundType, jitsiDomain }`. `POST /api/interviews/:id/end` â€” auth (Interviewer only). Sets status to 'completed'. `POST /api/interviews/:id/execute` â€” auth (Candidate only). Proxy to JDoodle API. Rate limit: 10 requests/minute. Max script length: 10000 chars. `POST /api/interviews/:id/save-code` â€” accepts `{ language, code }`, appends to code_snapshots jsonb array.

> **Frontend â€” Candidate View:** Split-screen layout (50/50, resizable divider). **Left Panel:** Jitsi video embed with mic/camera/chat controls. **Right Panel:** Language selector dropdown (50+ languages), Light/Dark theme toggle, Monaco Editor with auto-save every 5 seconds, Output Console with "Run Code" button, stdout/stderr display, STDIN input field, execution stats.

> **Frontend â€” Interviewer View:** Full-screen Jitsi video (same room as candidate). No code editor. Collapsible "Preparation Notes" panel. "End Interview" button (red) -> confirmation modal -> redirects to feedback form. **Session Reconnect:** On page refresh, call join endpoint again, restore last code snapshot. Show "Session restored" toast. Write tests: join validation, code execution proxy, end interview status update.

---