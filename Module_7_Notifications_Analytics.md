# Module 7: Notifications System & Analytics Dashboard (Combined)

**Priority:** Low | **Phase:** Phase 8 & 9  
**Build Order:** 7 (Final module — After Interview Management)  
**Estimated Requirements:** ~40 Functional Requirements (20 Notifications + 20 Analytics)

---

## Module Overview

This combined module covers the two supporting systems that complete the platform: the **Notifications System** — the invisible infrastructure that ensures every stakeholder is informed at every meaningful event through email notifications and in-app toasts — and the **Analytics Dashboard** — the data visualization layer that provides company-level and platform-level insights into hiring performance. These modules are combined due to their lower priority and relatively independent nature. The Notifications System uses SMTP email (Nodemailer) with branded HTML templates, event-driven triggers, and delivery logging. The Analytics Dashboard provides KPI cards, funnel charts, time-series charts, and distribution visualizations using aggregation queries over the application data.

---

## Responsibilities

### Notifications System
1. **Email Notification Service** — SMTP integration via Nodemailer for sending branded HTML emails.
2. **Event-Driven Triggers** — Automatically fire notifications on key events (signup, application, interview schedule, status update, etc.).
3. **Email Templates** — Branded, reusable HTML templates with dynamic content injection.
4. **Delivery Logging** — Track email send status, log failures, basic retry mechanism.
5. **In-App Toast Notifications** — Real-time UI feedback using Sonner for success, error, info, and warning messages.
6. **Notification Queue** — Basic queue for async email processing to avoid blocking request handlers.

### Analytics Dashboard
7. **Company-Level Analytics** — KPI cards, pipeline funnel, applications over time, per-job analysis, interview outcomes.
8. **Super Admin Analytics** — Platform-wide metrics, company registrations over time, activity distribution.
9. **Aggregation APIs** — Backend endpoints computing metrics from joins across jobs, applications, interviews, feedbacks.
10. **Charts & Visualizations** — Recharts/Chart.js rendering of bar charts, line charts, donut charts, funnel charts.
11. **Global Filters** — Date range, job, and department filters applied across all charts.

---

## Feature Extraction

### Feature 1: Email Notification Service & SMTP Configuration

**Functional Description:**  
The platform sends branded HTML emails for all key events using Nodemailer over SMTP. Emails use reusable templates with dynamic content (candidate name, job title, dates, etc.). The service is designed as a centralized utility called by other modules when events occur.

**Technical Elaboration:**
- **SMTP Setup:** Configure Nodemailer transport using env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (e.g., `noreply@hrplatform.com`). Create `src/shared/utils/email.ts` with `sendEmail({ to, subject, html })` function.
- **Template Engine:** Create `src/shared/templates/` directory with HTML email templates. Each template is a function accepting dynamic data and returning HTML string. Templates include: platform logo, company name, action summary, CTA button, footer with contact link.
- **Templates to Create:**
  - `welcome.ts` — Signup confirmation
  - `email-verification.ts` — Verify email link
  - `password-reset.ts` — Reset password link
  - `company-approved.ts` — Company workspace ready
  - `company-rejected.ts` — Rejection with reason
  - `invite-user.ts` — Login credentials for invited user
  - `application-confirmation.ts` — Application submitted
  - `application-status-update.ts` — Stage transition notification
  - `interview-scheduled.ts` — Interview date/time/round details
  - `interview-rescheduled.ts` — Updated schedule
  - `interview-cancelled.ts` — Cancellation notice
  - `interview-assigned.ts` — For interviewer
  - `feedback-reminder.ts` — Reminder to submit feedback
  - `application-outcome.ts` — Offer/Hire congratulations or rejection
- **Async Email Sending:** Wrap email sending in a try-catch with Winston logging. Use `setImmediate` or a simple queue (Bull/BullMQ with Redis, or basic in-memory queue) to process emails asynchronously without blocking the API response.
- **Delivery Logging:** Log every email attempt: `{ to, subject, status (sent/failed), error, timestamp }`. Store in a `notification_logs` table or log file.
- **Retry Mechanism:** On failure, retry up to 3 times with exponential backoff (1s, 5s, 30s).
- **Duplicate Prevention:** Track sent notifications with a composite key `(event_type + entity_id + recipient)` to prevent duplicate sends on retries.

**Database Schema Reference:**
- Note: Need `notification_logs` table (optional): `id (bigint PK)`, `recipient_email (string)`, `subject (string)`, `event_type (string)`, `entity_id (bigint — e.g., application_id, interview_id)`, `status (string — sent/failed)`, `error_message (text, nullable)`, `attempts (integer DEFAULT 1)`, `sent_at (timestamp)`, `created_at`
- All other tables are read-only for context (candidate names, job titles, etc.)

---

### Feature 2: Event-Driven Notification Triggers

**Functional Description:**  
Notifications are triggered automatically when specific events occur across the platform. Each module calls the notification service after completing its primary action. The triggers are standardized and cover the full user journey.

**Technical Elaboration:**
- **Trigger Points (by module):**

  **Auth Module:**
  - User signup → Send welcome email + email verification link
  - Forgot password → Send password reset email

  **Company Module:**
  - Company approved → Send approval email to company admin
  - Company rejected → Send rejection email with reason
  - User invited → Send invite email with credentials

  **Candidate Module:**
  - Onboarding reminder → Send after 48 hours if wizard not completed (cron job)

  **Application Module:**
  - Application submitted → Send confirmation to candidate
  - Stage transition → Send status update to candidate: "Your application for [Job Title] has moved to [New Stage]"
  - Application outcome (hired/rejected) → Send outcome email

  **Interview Module:**
  - Interview scheduled → Send to candidate + interviewer
  - Interview rescheduled → Send updated schedule to both
  - Interview cancelled → Send cancellation to both
  - Feedback reminder → Send to interviewer 2 hours after interview if feedback not submitted (cron job)
  - New application alert (optional) → Send to recruiter when new candidate applies

  **Super Admin:**
  - New company registration → Notify super admin of pending approval

- **Implementation:** Create `src/modules/notification/notification.service.ts` with methods for each trigger: `sendWelcomeEmail(candidate)`, `sendApplicationConfirmation(application, job, company)`, `sendInterviewScheduled(interview, candidate, job)`, etc. Each method: builds template with dynamic data, calls `sendEmail()`, logs the result. Other modules call notification service after their primary operation succeeds.

**Database Schema Reference:**
- `candidates` table: `email`, `name` — recipient data
- `users` table: `email`, `name` — recipient data for internal users
- `companies` table: `name`, `contact_email` — for company admin notifications
- `applications` table: `status` — for stage update content
- `interviews` table: `scheduled_at`, `round_type` — for interview notification content
- `jobs` table: `title` — for email subject/body content

---

### Feature 3: In-App Toast Notifications

**Functional Description:**  
Every user action that succeeds or fails produces a toast notification in the UI. Toasts are positioned at the top-right corner, auto-dismiss after 5 seconds, and are color-coded by type (success, error, info, warning).

**Technical Elaboration:**
- **Library:** Sonner (already in tech stack from React guidelines).
- **Toast Types:**
  - Success (green): "Application submitted successfully", "Job published", "Feedback submitted", "Profile updated"
  - Error (red): "Failed to upload resume — please try again", "Invalid credentials", "Server error"
  - Info (blue): "Interview scheduled successfully", "Company approved"
  - Warning (yellow): "Your session is about to expire", "Profile incomplete — complete before applying"
- **Implementation:** Import `toast` from Sonner. Call `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()` after API responses in frontend service hooks. Position: top-right. Duration: 5000ms. Dismissable via close button.
- **Centralized Toast Handler:** Create `src/shared/hooks/useApiToast.ts` — wraps React Query mutation hooks with automatic toast on success/error. Example: `useMutation({ onSuccess: () => toast.success(msg), onError: (err) => toast.error(err.message) })`.

**Database Schema Reference:** N/A (frontend-only feature).

---

### Feature 4: Company-Level Analytics Dashboard

**Functional Description:**  
Company Admins and Recruiters access an analytics page showing key hiring performance metrics — KPI cards, pipeline funnel visualization, applications over time, per-job analysis, and interview outcome distribution. All charts support global filtering by date range, job, and department.

**Technical Elaboration:**
- **Analytics API:** `GET /api/companies/me/analytics` — Auth (Admin, Recruiter). Accepts query params: `?date_from=2026-01-01&date_to=2026-04-30&job_id=5&department=Engineering`. Returns composite analytics object:

  **KPIs (6 cards):**
  - Total Jobs Posted: `SELECT COUNT(*) FROM jobs WHERE company_id = ?`
  - Total Applications: `SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?`
  - Candidates in Pipeline: `SELECT COUNT(DISTINCT candidate_id) FROM applications a JOIN jobs j ... WHERE j.company_id = ? AND a.status NOT IN ('hired','rejected','withdrawn')`
  - Interviews Conducted: `SELECT COUNT(*) FROM interviews i JOIN applications a ... JOIN jobs j ... WHERE j.company_id = ? AND i.status = 'completed'`
  - Hire Rate: `(COUNT WHERE status='hired' / COUNT total) * 100`
  - Avg Time to Hire: `AVG(hired_date - applied_at)` for hired applications (in days)

  **Chart 1 — Pipeline Funnel:**
  ```sql
  SELECT status, COUNT(*) as count 
  FROM applications a JOIN jobs j ON a.job_id = j.id 
  WHERE j.company_id = ? 
  GROUP BY status 
  ORDER BY CASE status 
    WHEN 'applied' THEN 1 WHEN 'screening' THEN 2 
    WHEN 'shortlisted' THEN 3 WHEN 'interview_1' THEN 4 
    WHEN 'interview_2' THEN 5 WHEN 'offer' THEN 6 
    WHEN 'hired' THEN 7 WHEN 'rejected' THEN 8 
  END
  ```
  Returns stage, count, and conversion % between stages.

  **Chart 2 — Applications Over Time (Line):**
  ```sql
  SELECT DATE(applied_at) as date, COUNT(*) as count 
  FROM applications a JOIN jobs j ON a.job_id = j.id 
  WHERE j.company_id = ? AND applied_at BETWEEN ? AND ? 
  GROUP BY DATE(applied_at) ORDER BY date
  ```
  Toggleable: daily (30 days) or weekly (90 days).

  **Chart 3 — Applications by Job (Horizontal Bar):**
  ```sql
  SELECT j.title, j.status, COUNT(a.id) as count 
  FROM jobs j LEFT JOIN applications a ON a.job_id = j.id 
  WHERE j.company_id = ? 
  GROUP BY j.id ORDER BY count DESC LIMIT 10
  ```

  **Chart 4 — Pipeline Stage Distribution (Donut):**
  Same data as funnel but rendered as donut chart. Color-coded per stage.

  **Chart 5 — Interview Outcome Distribution (Pie):**
  ```sql
  SELECT f.recommendation, COUNT(*) as count 
  FROM feedbacks f JOIN interviews i ON f.interview_id = i.id 
  JOIN applications a ON i.application_id = a.id 
  JOIN jobs j ON a.job_id = j.id 
  WHERE j.company_id = ? 
  GROUP BY f.recommendation
  ```

- **Frontend:** Build at `/company/analytics`. Install `recharts` for charting. **Global Filter Bar:** Date range picker (presets: Last 7 days / 30 days / 90 days / Custom), Job filter dropdown, Department filter dropdown. All charts re-fetch on filter change. **KPI Cards Row:** 6 metric cards with icon, label, and value. Optionally show trend arrow (up/down vs last period). **Charts Section:** 2-column grid on desktop. Funnel Chart (custom or bar-based funnel), Line Chart (applications over time with filled area), Horizontal Bar Chart (top jobs), Donut Chart (pipeline distribution), Pie Chart (interview outcomes). Each chart has a title and subtle legend. Loading shimmer placeholders while fetching. Empty state: "No data available yet" with illustration.

**Database Schema Reference:**
- `jobs` table: `company_id`, `status`, `department`, `title` — for filtering and grouping
- `applications` table: `job_id`, `status`, `applied_at` — primary analytics data source
- `interviews` table: `application_id`, `status` — for interview metrics
- `feedbacks` table: `interview_id`, `recommendation` — for outcome analysis
- All joins scoped by `jobs.company_id`

---

### Feature 5: Super Admin Platform Analytics

**Functional Description:**  
The Super Admin has a platform-wide analytics view showing aggregate metrics across all companies — total companies by status, total users, jobs, applications, interviews. Charts show company registrations over time, status distribution, and top companies by activity.

**Technical Elaboration:**
- **Analytics API:** `GET /api/admin/analytics` — Auth (Super Admin). Returns:

  **Platform KPIs:**
  - Total Companies (with breakdown: active, pending, rejected): `SELECT status, COUNT(*) FROM companies GROUP BY status`
  - Total Internal Users: `SELECT COUNT(*) FROM users`
  - Total Candidates: `SELECT COUNT(*) FROM candidates`
  - Total Jobs: `SELECT COUNT(*) FROM jobs`
  - Total Applications: `SELECT COUNT(*) FROM applications`
  - Total Interviews: `SELECT COUNT(*) FROM interviews`
  - Total Feedbacks: `SELECT COUNT(*) FROM feedbacks`

  **Chart 1 — Companies Over Time (Line):**
  ```sql
  SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count 
  FROM companies GROUP BY month ORDER BY month
  ```

  **Chart 2 — Company Status Distribution (Donut):**
  Active vs Pending vs Rejected count.

  **Chart 3 — Top Companies by Activity (Grouped Bar):**
  ```sql
  SELECT c.name, 
    COUNT(DISTINCT j.id) as jobs_count, 
    COUNT(DISTINCT a.id) as applications_count 
  FROM companies c 
  LEFT JOIN jobs j ON j.company_id = c.id 
  LEFT JOIN applications a ON a.job_id = j.id 
  WHERE c.status = 'active' 
  GROUP BY c.id ORDER BY applications_count DESC LIMIT 10
  ```

- **Frontend:** Build at `/superadmin/analytics`. Same chart library (Recharts). KPI cards at top (7 metrics). Line chart for company growth. Donut for status distribution. Grouped bar for top companies.

**Database Schema Reference:**
- `companies` table: `status`, `created_at` — for company metrics and growth
- `users` table: aggregate count
- `candidates` table: aggregate count
- `jobs` table: `company_id` — for per-company breakdown
- `applications` table: `job_id` — for per-company application counts
- `interviews` table: aggregate count
- `feedbacks` table: aggregate count

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Notification service (email templates, SMTP, triggers, logging) + In-app toasts — 7 days  
**Sprint 2:** Company Analytics Dashboard + Super Admin Analytics + Charts — 7 days

---

### Task List

**Sprint 1 — Notifications:**
- [ ] Configure Nodemailer SMTP transport with env vars
- [ ] Create email template functions (14 templates listed above)
- [ ] Build notification service with methods for each trigger event
- [ ] Integrate notification triggers into existing modules (auth, company, application, interview)
- [ ] Implement async email sending (basic queue or setImmediate)
- [ ] Add delivery logging (Winston structured logs or notification_logs table)
- [ ] Implement basic retry mechanism (3 retries with backoff)
- [ ] Configure Sonner toasts across all frontend features
- [ ] Create useApiToast hook for centralized toast handling

**Sprint 2 — Analytics:**
- [ ] Build company analytics aggregation API endpoint
- [ ] Build Super Admin analytics aggregation API endpoint
- [ ] Install and configure Recharts on frontend
- [ ] Build KPI card components (reusable metric card)
- [ ] Build Pipeline Funnel Chart component
- [ ] Build Applications Over Time Line Chart
- [ ] Build Applications by Job Bar Chart
- [ ] Build Pipeline Distribution Donut Chart
- [ ] Build Interview Outcome Pie Chart
- [ ] Build global filter bar (date range, job, department)
- [ ] Build Super Admin analytics page (company growth, status distribution, top companies)
- [ ] Add loading states and empty states for all charts
- [ ] Write tests for analytics aggregation queries

---

### Prompt 1: Email Notification Service â€” SMTP Setup & HTML Templates

> Build the email notification infrastructure. **Backend â€” SMTP Setup:** Create `src/shared/utils/email.ts`. Configure Nodemailer transport using env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Export `sendEmail({ to, subject, html })` function with Winston logging on success/failure.

> **HTML Templates:** Create `src/shared/templates/` directory. Each template is a TypeScript function returning an HTML string. Base template wrapper `baseTemplate(content)` includes: styled container (max-width 600px), platform logo header, content area, CTA button styling, footer. Create 14 template functions: (1) `welcomeEmail` (2) `emailVerification` (3) `passwordReset` (4) `companyApproved` (5) `companyRejected` (6) `userInvite` (7) `applicationConfirmation` (8) `applicationStatusUpdate` (9) `interviewScheduled` (10) `interviewRescheduled` (11) `interviewCancelled` (12) `interviewAssigned` (13) `feedbackReminder` (14) `applicationOutcome`. Each accepts dynamic data and returns branded HTML.

> **Async Email & Retry:** Wrap email sending in try-catch. Use `setImmediate` or basic queue for async processing. Implement retry mechanism: 3 retries with exponential backoff (1s, 5s, 30s). Track sent notifications with composite key to prevent duplicates.

---

### Prompt 2: Event-Driven Notification Triggers & In-App Toasts

> Build the notification service with event-driven triggers and frontend toast notifications. **Notification Service:** Create `src/modules/notification/notification.service.ts`. Methods: `notifyWelcome(candidate)`, `notifyEmailVerification(user, token)`, `notifyPasswordReset(user, token)`, `notifyCompanyApproved(company, admin)`, `notifyCompanyRejected(company, admin, reason)`, `notifyUserInvited(user, company, tempPassword)`, `notifyApplicationSubmitted(application)`, `notifyStageTransition(application, oldStage, newStage)`, `notifyInterviewScheduled(interview)`, `notifyInterviewRescheduled(interview, oldDate)`, `notifyInterviewCancelled(interview)`, `notifyFeedbackReminder(interview)`. Each method constructs template with dynamic data, calls sendEmail, wraps in try-catch.

> **Integration:** Add notification calls to existing module services â€” auth.service after signup calls `notifyWelcome()`, company approval calls `notifyCompanyApproved()`, application creation calls `notifyApplicationSubmitted()`, stage transition calls `notifyStageTransition()`, interview scheduling calls `notifyInterviewScheduled()`. All calls are fire-and-forget (`void notificationService.notify...()`).

> **In-App Toasts Frontend:** Ensure Sonner `<Toaster />` is mounted in app providers. Create `src/shared/hooks/useApiToast.ts` â€” custom hook wrapping mutations with automatic toast on success/error. Apply to all existing mutation calls. Toast types: success (green), error (red), info (blue), warning (yellow). Duration: 5000ms, position: top-right.

---

### Prompt 3: Company Analytics Dashboard â€” KPIs, Charts & Filters

> Build the company-level analytics dashboard with KPI cards, charts, and global filtering. **Backend â€” Analytics API:** Create `src/modules/analytics/` module. `GET /api/companies/me/analytics` â€” auth (Admin, Recruiter). Accepts query params: `date_from`, `date_to`, `job_id`, `department`. Execute queries scoped to `company_id`: **KPIs:** total_jobs, total_applications, active_candidates, interviews_conducted, hire_rate, avg_time_to_hire. **Pipeline Funnel:** counts per status with conversion percentages. **Applications Over Time:** daily counts for last 30 days. **Top Jobs:** top 10 jobs by application count. **Interview Outcomes:** feedback recommendation distribution.

> **Frontend â€” Analytics Page:** Build at `/company/analytics`. Install `recharts`. **Global Filter Bar:** DateRangePicker (presets: Last 7/30/90 days, Custom), Job filter dropdown, Department filter. On filter change, refetch via React Query. **KPI Cards Row:** 6 cards in responsive grid (3x2 desktop). Each `MetricCard.tsx`: icon, label, value, optional trend indicator.

> **Charts Grid** (2 columns desktop): (1) Funnel Chart â€” horizontal bars simulating funnel with conversion percentages. (2) Applications Over Time â€” AreaChart with filled area and smooth curve. (3) Top Jobs Bar Chart â€” horizontal bars, color by job status. (4) Pipeline Distribution Donut â€” PieChart with inner radius, center total. (5) Interview Outcomes Pie â€” 4 segments color-coded by recommendation. Loading states: skeleton shimmer for cards, spinner for charts. Empty state with illustration.

---

### Prompt 4: Super Admin Analytics, Notification Logging & Final Polish

> Build the Super Admin analytics and notification delivery logging. **Super Admin Analytics Backend:** `GET /api/admin/analytics` â€” auth (Super Admin). Platform-wide queries: total companies by status, total users/candidates/jobs/applications/interviews/feedbacks. Companies registered over time (monthly). Top 10 companies by activity (jobs + applications). **Frontend:** Build at `/superadmin/analytics`. 7 KPI cards. Line chart for company growth. Donut for status distribution. Grouped bar for top companies.

> **Notification Logging Backend:** Create `notification_logs` migration: `id`, `recipient_email`, `subject`, `event_type`, `entity_type`, `entity_id`, `status (pending/sent/failed)`, `error_message`, `attempts`, `last_attempt_at`, `sent_at`, `created_at`. In `sendEmail()`: create log entry before sending, update status on success/failure. **Retry Function:** `retryFailedEmails()` â€” query failed logs with attempts < 3, attempt resend, update status. Run via setInterval every 5 minutes. **Duplicate Prevention:** Check existing sent log before creating new one.

> **Final Polish:** Ensure every frontend mutation has toast notifications. Verify consistent API error format `{ success: false, error: "message" }`. Verify charts handle empty data. Add indexes for analytics performance: `applications.applied_at`, `jobs.company_id`, `applications.job_id + status`. **Tests:** (1) Email sends successfully (mock transport). (2) Failure logging and retry works. (3) Company analytics returns correct KPIs. (4) Super Admin analytics aggregates correctly. (5) Date range filters work. (6) Duplicate prevention works. (7) Charts render with empty/sample data.

---