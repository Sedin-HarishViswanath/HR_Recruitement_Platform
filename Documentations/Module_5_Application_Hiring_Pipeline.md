# Module 5: Application & Hiring Pipeline

**Priority:** Medium | **Phase:** Phase 6  
**Build Order:** 5 (After Candidate Management)  
**Estimated Requirements:** ~35 Functional Requirements

---

## Module Overview

The Application & Hiring Pipeline module is the operational heart of the recruitment platform — it's where the actual hiring decision-making happens. This module manages the complete lifecycle of a job application from the moment a candidate applies through every stage of the hiring pipeline: Applied → Screening → Shortlisted → Interview 1 → Interview 2 → Offer → Hired / Rejected. Recruiters visualize applications through both a table view and a Kanban board, move candidates between stages, assign interviewers, review candidate profiles, and make progression/rejection decisions. The module maintains a complete stage transition history (audit trail), supports candidate filtering by stage/skill/experience, and provides pipeline summary statistics per job.

---

## Responsibilities

1. **Application Record Management** — Create, read, and update application records linking candidates to jobs.
2. **Pipeline Stage Transitions** — Move candidates between stages with history tracking and audit trail.
3. **Kanban Board** — Visual Kanban board with columns for each pipeline stage, draggable candidate cards.
4. **Table View** — Traditional table listing of all applications with search, filter, and quick actions.
5. **Bulk Operations** — Move multiple candidates between stages simultaneously.
6. **Candidate Cards** — Display candidate summary cards with name, skills, AI score, resume preview.
7. **Pipeline Summary** — Counts per stage, conversion rates, per-job pipeline overview.
8. **Recruiter Notes** — Internal notes on applications (not visible to candidate).
9. **Stage History** — Complete timestamped audit trail of stage transitions.
10. **Application Detail View** — Full candidate profile + pipeline history + interview history + feedback.

---

## Feature Extraction

### Feature 1: Application Table View & Filtering

**Functional Description:**  
The primary view for recruiters — a table listing all applications across all jobs for their company. Each row shows candidate info, job, current stage, assigned recruiter/interviewer, AI score, and actions (move stage, schedule interview, reject). Rich filtering by stage, job, recruiter, date range, and keyword search.

**Technical Elaboration:**
- **List Applications (Company):** `GET /api/companies/me/applications` (or through company-scoped middleware on `GET /applications`) — Query joins `applications → candidates → jobs → users (recruiter)`. WHERE `jobs.company_id = req.user.companyId`. Support params: `?stage=screening&job_id=5&recruiter_id=3&search=john&date_from=2026-01-01&date_to=2026-04-30&page=1&limit=20&sort=applied_at:desc`. Each record includes: application_id, candidate_name, candidate_email, job_title, current_stage (status), assigned_recruiter (from applications.user_id JOIN users), assigned_interviewer (from latest interview), ai_score, applied_at, updated_at.
- **Quick Actions per Row:** Move Stage dropdown (next logical stage), Schedule Interview button, Reject button (with confirmation).
- **Frontend:** Build at `/company/applications`. Table with columns: Candidate Name, Job Title, Current Stage (color-coded badge), Assigned Recruiter, Assigned Interviewer, AI Score, Date Applied, Last Updated, Actions dropdown. Filters bar: stage multi-select, job dropdown, recruiter dropdown, date range picker, search input. Toggle button to switch between Table View and Kanban Board View.

**Database Schema Reference:**
- `applications` table: `id`, `job_id`, `candidate_id`, `user_id (recruiter)`, `status`, `applied_at`, `resume_url`, `cover_note`, `ai_score`, `parsed_skills`
- `candidates` table: `name`, `email`, `skills` — for display
- `jobs` table: `title`, `company_id` — for scoping and display
- `users` table: `name` — for recruiter/interviewer name
- `interviews` table: `interviewer_id` — for assigned interviewer

---

### Feature 2: Kanban Board (Drag-and-Drop Pipeline)

**Functional Description:**  
A visual Kanban board where each column represents a pipeline stage and candidate cards can be dragged between columns to transition stages. The board is scoped per job — a recruiter selects a job and sees all its applications organized by stage.

**Technical Elaboration:**
- **Get Pipeline Data:** `GET /jobs/:jobId/pipeline` — Returns applications for a specific job, grouped by stage. Query: `SELECT a.*, c.name, c.email, c.skills, c.ai_match_score FROM applications a JOIN candidates c ON a.candidate_id = c.id WHERE a.job_id = ? ORDER BY a.updated_at DESC`. Group results by `status` field into stage buckets.
- **Pipeline Summary:** `GET /jobs/:jobId/pipeline/summary` — Returns count per stage: `SELECT status, COUNT(*) FROM applications WHERE job_id = ? GROUP BY status`.
- **Stage Transition (Drag):** `PATCH /applications/:id/stage` — Accepts `{ stage: 'screening' }`. Validates: application exists, user has permission (same company), stage is a valid next stage (optional: enforce sequential transitions). Updates `applications.status`. Creates entry in `stage_transitions` table: `{ application_id, from_stage, to_stage, changed_by, changed_at }`. Triggers notification to candidate (status update email).
- **Frontend:** Kanban board using a drag-and-drop library (e.g., `@dnd-kit/core` or `react-beautiful-dnd`). Columns: Applied, Screening, Shortlisted, Interview 1, Interview 2, Offer, Hired, Rejected. Each column header shows stage name + count badge. Cards: candidate name, job title (if not per-job), applied date, AI score badge, skills (2-3 tags). Drag a card from one column to another → calls PATCH API → updates state optimistically → shows success toast. Job selector dropdown at top to switch between jobs.

**Database Schema Reference:**
- `applications` table: `id`, `job_id`, `candidate_id`, `status` — grouped by status for columns
- `candidates` table: `name`, `email`, `skills`, `ai_match_score` — for card content
- `jobs` table: `id`, `title`, `company_id` — for job scoping
- Note: Need `stage_transitions` table: `id (bigint PK)`, `application_id (FK → applications)`, `from_stage (string)`, `to_stage (string)`, `changed_by (FK → users)`, `changed_at (timestamp DEFAULT NOW())`, `notes (text, optional)`

---

### Feature 3: Bulk Stage Movement

**Functional Description:**  
Recruiters can select multiple candidates and move them to a new stage simultaneously. This is useful for batch operations like shortlisting all screening candidates or rejecting multiple applicants.

**Technical Elaboration:**
- **Bulk Move:** `POST /applications/bulk-move` — Accepts `{ application_ids: [1, 2, 3], target_stage: 'shortlisted' }`. Validates: all applications belong to same company, target stage is valid. Updates all applications' status in a transaction. Creates stage_transitions entries for each. Returns success with count of moved applications.
- **Frontend:** Checkbox on each row/card. When 1+ selected, a floating action bar appears at bottom: "Move X candidates to [stage dropdown] → Apply". Confirmation modal before execution.

**Database Schema Reference:**
- `applications` table: `id`, `status` — bulk updated
- `stage_transitions` table: multiple entries created (one per application)

---

### Feature 4: Application Detail View

**Functional Description:**  
Clicking on an application opens a comprehensive detail view showing the full candidate profile, pipeline stage history (timestamped timeline), interview history with feedback, and recruiter action buttons (advance, reject, schedule interview).

**Technical Elaboration:**
- **Get Application Detail:** Composite endpoint combining:
  - Application data: `GET /applications/:id` — full application record
  - Stage history: `GET /applications/:id/history` — returns `stage_transitions` ordered by `changed_at ASC`
  - Resume: `GET /applications/:id/resume` — returns resume URL for preview
  - Interviews: `GET /applications/:id/interviews` (from Interview module) — returns all interviews linked to this application
  - Feedback: Linked through interviews → feedbacks
- **Recruiter Notes:** Stored in `applications` table (add `internal_notes` text column) or separate `application_notes` table. `PATCH /applications/:id/notes` — update notes. Notes visible only to company users, never to candidate.
- **Frontend:** Detail view (right drawer or full page). Top: candidate profile snapshot (avatar, name, email, phone, skills, resume download). Middle: Pipeline Stage Timeline (vertical stepper component — each stage shows: stage name, date/time transitioned, who moved it). Interviews section: list of linked interviews with round type, date, status, feedback summary. Feedback section: each feedback entry with rating stars, strengths, weaknesses, recommendation badge. Bottom: action buttons — "Move to Next Stage" (dropdown), "Reject" (with confirmation), "Schedule Interview" (opens interview scheduling modal). Notes section: textarea for internal recruiter notes.

**Database Schema Reference:**
- `applications` table: all fields — primary data source
- `stage_transitions` table: `application_id`, `from_stage`, `to_stage`, `changed_by`, `changed_at` — for timeline
- `interviews` table: `application_id` — for interview history
- `feedbacks` table: `interview_id` — for feedback display
- `candidates` table: `name`, `email`, `phone`, `skills`, `resume_url` — for profile snapshot

---

### Feature 5: Add Application (Company-Side)

**Functional Description:**  
Recruiters can manually add an application on behalf of a candidate — selecting an existing candidate or entering new candidate details, selecting a job, assigning initial stage, recruiter, and interviewer.

**Technical Elaboration:**
- **Add Application:** `POST /api/applications` from company context — Accepts `{ candidate_id (or candidate details for new), job_id, cover_note, initial_stage (default 'applied'), recruiter_id, interviewer_id }`. If candidate_id provided: validate candidate exists. If new candidate: create candidate record first. Validate: job belongs to company, no duplicate application. Creates application record. Sets `user_id = req.user.userId` (recruiter who created).
- **Frontend:** "Add Application" button (top right) on Applications page. Modal with: Select Candidate (searchable dropdown of existing candidates, or "Add New" option), Select Job (searchable dropdown of company's published jobs), Cover Note textarea, Initial Stage dropdown (defaults to "Applied"), Assign Recruiter dropdown, Assign Interviewer dropdown. Submit → creates application → refreshes list.

**Database Schema Reference:**
- `applications` table: `id`, `job_id`, `candidate_id`, `user_id (recruiter)`, `status`, `applied_at`, `cover_note`
- `candidates` table: searched for existing candidates
- `jobs` table: filtered by company_id for job selection
- `users` table: filtered by company_id and role for recruiter/interviewer dropdowns

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Application table view, filtering, stage transitions, stage history — 7 days  
**Sprint 2:** Kanban board, bulk operations, application detail view, add application — 7 days

---

### Task List

**Sprint 1:**
- [ ] Create `stage_transitions` table migration (id, application_id FK, from_stage, to_stage, changed_by FK, changed_at, notes)
- [ ] Build company applications list endpoint with joins and filtering
- [ ] Build stage transition endpoint (PATCH status + create transition record)
- [ ] Build stage history endpoint (GET transitions for an application)
- [ ] Build applications table view frontend (columns, badges, filters, search)
- [ ] Build stage transition UI (dropdown action on each row)
- [ ] Build pipeline summary endpoint (counts per stage per job)

**Sprint 2:**
- [ ] Build Kanban board API (pipeline data grouped by stage)
- [ ] Build Kanban board frontend (drag-and-drop, columns, cards)
- [ ] Build bulk move endpoint and UI (multi-select, floating action bar)
- [ ] Build application detail view (profile snapshot, timeline, interviews, feedback, notes)
- [ ] Build add application endpoint and modal
- [ ] Build recruiter notes functionality
- [ ] Write tests for stage transitions, bulk move, pipeline queries

---

### Prompt 1: Application List API, Stage Transitions & Table View

> Build the company-side application management with table view and stage transitions. **Backend â€” Stage Transitions Table:** Create migration for `stage_transitions` table: `id (bigint PK)`, `application_id (FK NOT NULL)`, `from_stage`, `to_stage`, `changed_by (FK -> users)`, `changed_at (timestamp DEFAULT NOW())`, `notes (text, optional)`. Index on `application_id`. **Application List API:** Create `GET /api/applications` with company-scoped middleware. Query applications joined with candidates, jobs, and users. Add filter support: `stage`, `job_id`, `recruiter_id`, `search`, `date_from/date_to`. Pagination with `COUNT(*)` for total. Sort configurable.

> **Stage Transition API:** `PATCH /applications/:id/stage` â€” auth (Admin, Recruiter). Zod validates: `stage (enum: applied/screening/shortlisted/interview_1/interview_2/offer/hired/rejected)`. Service validates company ownership, creates `stage_transitions` record, updates `applications.status`. **Stage History API:** `GET /applications/:id/history` â€” returns all transitions with user names. **Pipeline Data API:** `GET /jobs/:jobId/pipeline` â€” returns applications grouped by status. `GET /jobs/:jobId/pipeline/summary` â€” returns count per status.

> **Frontend â€” Applications Table:** Build at `/company/applications`. Top filter bar: stage multi-select pills (color-coded), job dropdown, recruiter dropdown, date range picker, search input. Table columns: checkbox, Candidate Name, Job Title, Current Stage (badge), Assigned Recruiter, AI Score, Date Applied, Last Updated, Actions (Move Stage dropdown, Schedule Interview, Reject). Toggle for "Table View" / "Kanban View". Pagination at bottom.

---

### Prompt 2: Kanban Board & Drag-and-Drop

> Build the visual Kanban pipeline board with drag-and-drop stage transitions. **Frontend â€” Kanban Board:** Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. Build `KanbanBoard.tsx` toggled via the Table/Kanban switch. **Job Selector** dropdown at top. On job select, fetch pipeline data. **Board Layout:** Horizontal scrollable board with columns per stage. Each `PipelineColumn.tsx`: header with stage name + count badge, scrollable card list.

> **Candidate Cards:** `CandidateCard.tsx` inside each column: candidate name, applied date, AI score badge (color-coded), skills tags. Cards are draggable using `useSortable`. **Drag-and-Drop:** When card dragged between columns, call `PATCH /applications/:id/stage`. Show optimistic update, revert on error. Success toast on move. Confirmation modal for "Rejected" column.

> **Pipeline Summary Bar:** Below job selector, show horizontal summary with colored count badges per stage. Data from `GET /jobs/:jobId/pipeline/summary`.

---

### Prompt 3: Bulk Operations & Application Detail View

> Build bulk candidate movement and the comprehensive application detail view. **Bulk Operations Backend:** `POST /applications/bulk-move` â€” auth (Admin, Recruiter). Zod validates: `application_ids (array, min 1, max 50)`, `target_stage (enum)`. Service validates all applications belong to same company, executes in DB transaction â€” updates all statuses, creates stage_transition entries. Returns `{ moved_count: N }`.

> **Bulk Operations Frontend:** In Table View: checkboxes on rows. When selected, floating action bar slides up: "[X] candidates selected - Move to: [stage dropdown] [Apply] | [Cancel]". In Kanban: multi-select via Shift+Click, drag selection to target column. Confirmation modal for bulk rejection.

> **Application Detail View Frontend:** Opens as right drawer (60% width). **Top Section:** Candidate profile card with avatar, name, contact info, skills, resume download, professional links. **Pipeline Timeline:** Vertical stepper showing stage transitions with dates and changed-by names. **Interviews Section:** List of interviews with round type, date, interviewer, status, feedback summary. **Feedback Section:** Full feedback cards with rating stars, strengths, weaknesses, recommendation badge. **Actions:** "Move to Next Stage", "Reject", "Schedule Interview" buttons.

---

### Prompt 4: Add Application, Recruiter Notes & Testing

> Build manual application creation, recruiter notes, and comprehensive tests. **Add Application Backend:** Extend `POST /api/applications` for company context (Admin, Recruiter role). Accepts: `{ candidate_id, job_id, cover_note, initial_stage, assigned_recruiter_id }`. Validate: candidate exists, job belongs to company, no duplicate, job is published. Create application with initial stage_transition record.

> **Recruiter Notes:** Extend `applications` table with `internal_notes (text, nullable)`. `PATCH /applications/:id/notes` â€” accepts `{ notes }`, updates field. Only accessible to company users. **Frontend:** Notes Section in detail drawer: textarea with "Save Notes" button. Label: "Internal notes - not visible to candidate". **Add Application Modal:** "Add Application" button on Applications page. Modal: Select Candidate (searchable dropdown), Select Job dropdown, Cover Note textarea, Initial Stage dropdown, Assign Recruiter dropdown. Submit -> create -> refresh -> toast.

> **Tests:** (1) Stage transition creates history record. (2) Bulk move updates all applications in transaction. (3) Bulk move fails if application from different company. (4) Pipeline data returns correct grouping. (5) Application detail includes stage history and interviews. (6) Recruiter notes update works. (7) Add application prevents duplicates. (8) Kanban drag triggers correct API call.

---