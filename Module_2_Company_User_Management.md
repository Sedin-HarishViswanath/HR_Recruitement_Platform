# Module 2: Company & User Management

**Priority:** High | **Phase:** Phase 3  
**Build Order:** 2 (After Authentication)  
**Estimated Requirements:** ~35 Functional Requirements

---

## Module Overview

The Company & User Management module is the organizational backbone of the platform. It handles everything related to a company's lifecycle — from initial registration (2-step wizard), through Super Admin approval, to full workspace activation. Once a company is active, the Company Admin can invite internal users (Recruiters and Interviewers) via email, manage their roles and access, and configure company settings. The Super Admin has a separate view for listing, approving, and rejecting company registrations. This module also provides the Company Dashboard (statistics hub), the User Management page (CRUD for internal team members), and the sidebar navigation structure that anchors the entire company-side experience. Data isolation is enforced at every layer — a company's data is invisible to all other companies.

---

## Responsibilities

1. **Company Registration Wizard** — 2-step wizard form for company admins to register their company (Company Profile + Location & Contact).
2. **Super Admin Approval** — Approve/reject pending companies, trigger approval/rejection emails.
3. **Company Dashboard** — Display key hiring metrics (total jobs, active jobs, total candidates, applications, interviews, hires).
4. **User Invitation System** — Token-based invite for recruiters/interviewers with email + role + temporary password.
5. **User Management** — List, filter, edit, deactivate, and remove internal company users.
6. **Company Profile Management** — View and edit company details, settings.
7. **Sidebar Navigation** — Persistent left sidebar for company view (Dashboard, Users, Jobs, Candidates, Applications, Interviews, Feedback, Settings).
8. **Company Data Isolation** — Strict tenant-level data separation at API and DB query levels.
9. **Super Admin Portal** — Companies list, user list, system-level dashboard, company detail view.

---

## Feature Extraction

### Feature 1: Company Registration Wizard (2-Step)

**Functional Description:**  
After a Company Admin signs up and gets approved by the Super Admin, they are redirected to a 2-step onboarding wizard. Step 1 collects company profile details (name, domain, size, industry, logo, bio). Step 2 collects location and contact information. The wizard is resumable — progress is saved server-side per step.

**Technical Elaboration:**
- **Step 1 — Company Profile:** `PATCH /api/companies/me/profile` with body containing `{ name, domain, company_size, industry, logo (file upload), bio, website_url }`. Frontend renders a centered card layout with progress indicator. Company name and domain are pre-filled from signup. Company size is a dropdown (1-10, 11-50, 51-200, 201-500, 500+). Industry is a dropdown (Technology, Finance, Healthcare, etc.). Logo upload accepts PNG/JPG via drag-and-drop. Bio textarea max 500 chars. "Save & Continue" button → Step 2. "Save Progress" link → saves and stays.
- **Step 2 — Location & Contact:** Same PATCH endpoint with `{ address_line1, address_line2, city, state, country (dropdown), postal_code, contact_email (pre-filled), contact_phone }`. "Back" → Step 1. "Complete Setup" → submits, redirects to Company Dashboard.
- **Resumability:** Backend stores which step is completed. On page load, `GET /api/companies/me/profile` returns current data + completion state. Frontend resumes at the incomplete step.

**Database Schema Reference:**
- `companies` table: `id`, `name`, `domain (UNIQUE)`, `company_size`, `industry`, `address_line1`, `address_line2`, `city`, `state`, `country`, `postal_code`, `contact_email`, `contact_phone`, `status`, `active`, `admin_user_id (FK → users)`
- `active_storage_attachments` + `active_storage_blobs`: For company logo upload

---

### Feature 2: Super Admin Company Approval/Rejection

**Functional Description:**  
The Super Admin views a list of all companies with their status (Pending, Active, Rejected). They can approve pending companies (sets status to 'active', triggers approval email) or reject them (sets status to 'rejected' with a reason, triggers rejection email). The Super Admin can also manually create companies.

**Technical Elaboration:**
- **List Companies:** `GET /admin/companies` — Returns paginated list with filters by status. Columns: Company Name, Domain, Industry, Size, Status badge, Date Registered, Actions.
- **Get Company Detail:** `GET /admin/companies/:id` — Returns full company profile + list of internal users + job/application counts.
- **Approve:** `PATCH /admin/companies/:id/approve` — Sets `companies.status = 'active'`, `companies.active = true`. Triggers email to company admin: "Your company workspace is ready."
- **Reject:** `PATCH /admin/companies/:id/reject` — Accepts `{ reason: "..." }`. Sets `companies.status = 'rejected'`, `companies.active = false`. Triggers rejection email with reason.
- **Create Company (manual):** Opens modal with all company fields + admin user details. Super Admin can manually register a company.
- **Frontend:** Super Admin companies page at `/superadmin/companies` — table layout with search, status filter, action buttons.

**Database Schema Reference:**
- `companies` table: `id`, `name`, `domain`, `status (pending/active/rejected)`, `active (boolean)`, all address fields
- `users` table: `company_id` — to list users belonging to a company
- `memberships` + `roles`: To identify the company admin user

---

### Feature 3: User Invitation System

**Functional Description:**  
Company Admins invite Recruiters and Interviewers to join their company. The admin provides the user's name, email, role, and a temporary password. The system creates the user account, assigns the role, and sends an invite email with login credentials.

**Technical Elaboration:**
- **Send Invite:** `POST /api/companies/me/invitations` — Accepts `{ name, email, role, password, confirmPassword }`. Validates: email format, email not already registered, role is Recruiter or Interviewer, password meets strength requirements. Creates `users` record with `company_id = admin's companyId`, hashes password. Creates `memberships` entry linking user to selected role. Sends invite email with: company name, login URL, email, temporary password.
- **Bulk Invite (optional):** `POST /api/companies/me/invitations/bulk` — Accepts array of `{ name, email, role }` with auto-generated passwords.
- **List Invitations:** `GET /api/companies/me/invitations` — Returns pending/completed invitations.
- **Frontend:** "Invite User" button on Users page opens modal with: Full Name, Email, Role Dropdown (Recruiter/Interviewer), Password, Confirm Password. On submit → user appears in list with "Pending" status until first login.

**Database Schema Reference:**
- `users` table: `id`, `email`, `password_digest`, `name`, `company_id` — new record created
- `memberships` table: `user_id`, `role_id` — role assignment
- `roles` table: `id`, `name` — `Recruiter` or `Interviewer`
- `companies` table: `id` — admin's company context
- Note: May need an `invitations` table for tracking: `id`, `company_id`, `email`, `role_id`, `status (pending/accepted)`, `invited_by (FK → users)`, `created_at`

---

### Feature 4: Company User Management (CRUD)

**Functional Description:**  
Company Admins can view, search, filter, edit, deactivate, and remove internal users (Recruiters/Interviewers) belonging to their company. Users are listed in a table format with role badges and status indicators.

**Technical Elaboration:**
- **List Users:** `GET /api/companies/me/users` — Returns all users where `company_id = req.user.companyId`. Supports query params: `?role=recruiter&status=active&search=john`. Columns: Name, Email, Role, Date Invited, Status (Active/Pending/Deactivated), Actions.
- **Edit User:** `PATCH /api/companies/me/users/:userId` — Update `name`, `role` (change memberships entry). Cannot change email. Validates: user belongs to same company, cannot edit own role, cannot escalate to Admin.
- **Deactivate User:** `PATCH /api/companies/me/users/:userId/deactivate` — Sets user as inactive (add `is_active` flag or remove memberships). Deactivated users cannot login. Reversible.
- **Remove User:** `DELETE /api/companies/me/users/:id` — Soft delete or hard delete user. Removes from company. Preserves historical data (applications, interviews they created).
- **Frontend:** Table/list layout with search bar, role filter dropdown, status filter. Each row has Edit (pencil icon), Deactivate (pause icon), Remove (trash icon) action buttons.

**Database Schema Reference:**
- `users` table: `id`, `email`, `name`, `company_id` — filtered by company_id
- `memberships` table: `user_id`, `role_id` — joined to get role name
- `roles` table: `name` — display role label

---

### Feature 5: Company Dashboard & Profile

**Functional Description:**  
The Company Dashboard is a minimalist statistics hub showing key hiring metrics. The Company Profile page shows and allows editing of all company details. Both are accessible after login by Company Admin, Recruiter (dashboard only), and Interviewer (limited).

**Technical Elaboration:**
- **Dashboard:** `GET /api/companies/me/dashboard` — Returns aggregated metrics:
  - Top Row (4 cards): Total Jobs Posted (`COUNT jobs WHERE company_id`), Active Jobs (`COUNT jobs WHERE status='published'`), Total Candidates (`COUNT DISTINCT candidates via applications`), Total Applications (`COUNT applications via jobs`)
  - Mid Row (3 cards): Total Interviews Scheduled, Completed Interviews, Interview Conversion Rate (Hired / Total Interviewed %)
  - Bottom Row (2 cards): Total Hires (`COUNT applications WHERE status='hired'`), Rejection Rate
  - Charts: Bar Chart (applications per job, top 5-6), Donut (pipeline stage distribution), Line Chart (applications over past 30 days)
  - Recent Activity Feed: Last 5 system actions

- **Profile:** `GET /api/companies/me/profile` — Returns full company details. `PATCH /api/companies/me/profile` — Updates company details. `PATCH /api/companies/me/settings` — Updates company settings.

- **Frontend:** Dashboard at `/company/dashboard` with metric cards (clean, spaced, color-coded), charts using Recharts or Chart.js, activity feed. Profile accessible via Settings in sidebar.

**Database Schema Reference:**
- `companies` table: All fields — displayed and editable on profile page
- `jobs` table: `company_id`, `status` — aggregated for job counts
- `applications` table: `status`, linked via `jobs.company_id` — for application counts and pipeline distribution
- `interviews` table: `status`, linked via `applications → jobs → companies` — for interview metrics
- `feedbacks` table: `recommendation` — for conversion rates

---

### Feature 6: Super Admin Portal (Dashboard, Users, Analytics)

**Functional Description:**  
The Super Admin has a dedicated portal with a clean 4-item sidebar: Dashboard, Companies, Users, Analytics. They see platform-wide metrics, manage all companies, and view all users across the system.

**Technical Elaboration:**
- **Dashboard (`/superadmin/dashboard`):** Total Companies (Active/Pending), Platform Users count, Platform Jobs count, Platform Applications count, Platform Interviews count, Pending Approvals banner.
- **Users Page (`/superadmin/users`):** `GET` all users across all companies. Columns: Name, Email, Role, Company, Status, Date Created, Actions (View/Deactivate). Search by name/email. Filter by role, company, status.
- **Analytics (`/superadmin/analytics`):** Platform-wide metrics — Total Companies by status, Users by role, Jobs/Applications/Interviews totals. Charts: Companies over time (line), Active vs Pending vs Rejected (donut), Top companies by activity (bar).
- **Frontend:** Separate layout with minimal sidebar (Dashboard, Companies, Users, Analytics, Logout).

**Database Schema Reference:**
- All tables aggregated at platform level (no company_id filter)
- `companies`: for company management
- `users` + `memberships` + `roles`: for user listing with role resolution
- `jobs`, `applications`, `interviews`, `feedbacks`: for analytics aggregation

---

## Sprint Plan

**Sprint Duration:** 2 Sprints (10-14 days)  
**Sprint 1:** Company registration, approval flow, dashboard, sidebar — 7 days  
**Sprint 2:** User management, invitations, Super Admin portal, profile editing — 7 days

---

### Task List

**Sprint 1:**
- [ ] Build Company Registration Wizard backend (2-step PATCH endpoint)
- [ ] Build Company Registration Wizard frontend (2-step form, progress indicator, resumability)
- [ ] Build Super Admin approval/rejection endpoints
- [ ] Build Super Admin companies list page (table, search, filter, approve/reject actions)
- [ ] Build Company Dashboard backend (aggregation queries for all metrics)
- [ ] Build Company Dashboard frontend (metric cards, charts, activity feed)
- [ ] Build Company sidebar navigation component (Dashboard, Users, Jobs, Candidates, Applications, Interviews, Feedback, Settings)
- [ ] Build company-scoped data isolation middleware

**Sprint 2:**
- [ ] Build User Invitation system (send invite endpoint, email sending, user creation)
- [ ] Build User Management page (list, search, filter, edit, deactivate, remove)
- [ ] Build Company Profile view/edit pages
- [ ] Build Super Admin Dashboard page
- [ ] Build Super Admin Users page (all users, search, filter)
- [ ] Build Super Admin Analytics page (platform-wide charts)
- [ ] Write tests for company CRUD, user management, approval flow

---

### Prompt 1: Company Registration Wizard Backend & Super Admin Approval

> Build the backend for the company onboarding lifecycle. Create the company onboarding wizard API. The `PATCH /api/companies/me/profile` endpoint accepts the combined wizard data. For Step 1 fields: `name (string, required)`, `domain (string, unique, required)`, `company_size (string, values: '1-10'/'11-50'/'51-200'/'201-500'/'500+')`, `industry (string)`, `bio (text, max 500)`, `website_url (string, URL format)`. For Step 2 fields: `address_line1 (string, required)`, `address_line2 (string)`, `city (string, required)`, `state (string, required)`, `country (string, required)`, `postal_code (string, required)`, `contact_email (string, pre-filled)`, `contact_phone (string)`. Use Zod validation for all inputs. The `GET /api/companies/me/profile` endpoint returns the current company data so the frontend can resume at the correct step.

> Build Super Admin endpoints: `GET /admin/companies` returns paginated company list with `?status=pending&search=acme&page=1&limit=10`, `GET /admin/companies/:id` returns full company detail with user list and job/application counts, `PATCH /admin/companies/:id/approve` sets `status='active'` and `active=true` and triggers approval email, `PATCH /admin/companies/:id/reject` accepts `{ reason }` sets `status='rejected'` and `active=false` and triggers rejection email. Add company-scoping middleware: for all company-module routes, extract `companyId` from `req.user.companyId` and inject into all DB queries — `WHERE company_id = ?`. Super Admin bypasses this scoping.

---

### Prompt 2: Company Onboarding Wizard Frontend & Super Admin Companies Page

> Build the Company Onboarding Wizard at `/company/onboarding` with two steps. Use a centered card layout with a progress indicator (Step 1/2 with labels). Step 1: form fields for Company Profile with pre-filled name/domain from signup. Company size and industry as dropdowns. Logo upload with drag-and-drop zone (PNG/JPG). Bio textarea with character counter. Step 2: address fields with country dropdown, pre-filled contact email. "Save & Continue" / "Back" / "Complete Setup" navigation. On complete → redirect to `/company/dashboard`.

> Build Super Admin Companies page at `/superadmin/companies` with table layout — columns: Company Name, Domain, Industry, Size, Status (badge: green=Active, yellow=Pending, red=Rejected), Date Registered, Actions (View/Approve/Reject). Search bar, status filter dropdown. Approve button sends PATCH and refreshes list. Reject button opens modal with reason textarea then sends PATCH.

---

### Prompt 3: Company Dashboard, Sidebar Navigation & User Management

> Build the Company Dashboard statistics hub and the persistent sidebar navigation. **Company Dashboard Backend:** Create `GET /api/companies/me/dashboard` endpoint. Execute aggregation queries scoped to `req.user.companyId`: Total Jobs = `SELECT COUNT(*) FROM jobs WHERE company_id = ?`, Active Jobs = `SELECT COUNT(*) FROM jobs WHERE company_id = ? AND status = 'published'`, Total Candidates = `SELECT COUNT(DISTINCT c.id) FROM candidates c JOIN applications a ON a.candidate_id = c.id JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?`, Total Applications = same join with `COUNT(a.id)`, Interview metrics = `SELECT COUNT(*) FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?` with status filters, Total Hires = `COUNT applications WHERE status = 'hired'`, Pipeline Distribution = `SELECT status, COUNT(*) FROM applications GROUP BY status` scoped to company, Applications over time = `SELECT DATE(applied_at), COUNT(*) FROM applications GROUP BY DATE(applied_at) ORDER BY date DESC LIMIT 30` scoped to company. Return all metrics in a single response object. **Sidebar Navigation:** Create a `CompanySidebar` component at `src/features/company/components/CompanySidebar.tsx`. Items in order with icons from lucide-react: Dashboard (LayoutDashboard), Users (Users), Jobs (Briefcase), Candidates (UserSearch), Applications (FileStack), Interviews (Calendar), Feedback (MessageSquare), divider, Settings (Settings), Logout (LogOut). Active state: highlighted background. Company logo/name at top. User avatar + role badge at bottom. Collapsible on smaller screens. Create `CompanyLayout` component that wraps all `/company/*` routes with the sidebar.

> **User Management Backend & Frontend:** Build `GET /api/companies/me/users` — returns users where `company_id = req.user.companyId`, joined with `memberships` and `roles` for role name. Support `?role=recruiter&status=active&search=john&page=1&limit=20`. Build `PATCH /api/companies/me/users/:userId` — update name or role (delete old membership, create new one). Validate user belongs to same company, prevent self-role-change, prevent escalation to Admin. Build `PATCH /api/companies/me/users/:userId/deactivate` — add `is_active` column to users table (boolean DEFAULT true), set to false. Build `DELETE /api/companies/me/users/:id` — remove user from company (set `company_id = NULL`). Build invite endpoint: `POST /api/companies/me/invitations` — accepts `{ name, email, role, password }`, creates user + membership, sends invite email with Nodemailer (template: company name, login URL, credentials).

> Build Users page at `/company/users`. Table with columns: Name, Email, Role (badge), Date Invited, Status (Active=green/Pending=yellow/Deactivated=red badge), Actions (Edit/Deactivate/Remove icons). Search bar, role filter, status filter. "Invite User" button (top right) opens modal: Full Name input, Email input, Role dropdown (Recruiter/Interviewer), Password input, Confirm Password input, Submit button. On invite success → refresh table, show success toast via Sonner.

---

### Prompt 4: Super Admin Portal — Dashboard, Users Page & Analytics

> Build the complete Super Admin portal with dashboard, users management, and platform analytics. **Super Admin Dashboard Backend:** Create `GET /api/admin/dashboard` — return platform-wide metrics: Total Companies = `SELECT COUNT(*) FROM companies` with breakdowns by status (active/pending/rejected), Total Users = `SELECT COUNT(*) FROM users`, Total Candidates = `SELECT COUNT(*) FROM candidates`, Total Jobs = `SELECT COUNT(*) FROM jobs`, Total Applications = `SELECT COUNT(*) FROM applications`, Total Interviews = `SELECT COUNT(*) FROM interviews`, Pending Approvals Count = `SELECT COUNT(*) FROM companies WHERE status = 'pending'`.

> **Super Admin Users Backend:** Create `GET /api/admin/users` — returns all users from `users` table joined with `memberships`, `roles`, and `companies`. Support params: `?role=recruiter&company_id=5&status=active&search=john&page=1&limit=20`. Each user record includes: id, name, email, role (from memberships join), company name (from companies join or "Platform" for super admin), status, created_at. Create `PATCH /api/admin/users/:id/deactivate` for deactivating any user. **Super Admin Analytics Backend:** Create `GET /api/admin/analytics` — Companies registered over time = `SELECT DATE_TRUNC('month', created_at), COUNT(*) FROM companies GROUP BY 1 ORDER BY 1`, Company status distribution, Top companies by jobs posted = `SELECT c.name, COUNT(j.id) FROM companies c LEFT JOIN jobs j ON j.company_id = c.id GROUP BY c.id ORDER BY COUNT DESC LIMIT 10`, Top companies by applications.

> **Frontend — Super Admin Layout:** Create `AdminSidebar` with 4 items: Dashboard (LayoutDashboard), Companies (Building2), Users (Users), Analytics (BarChart3), divider, Logout (LogOut). Create `AdminLayout` wrapping all `/superadmin/*` routes. **Dashboard Page** at `/superadmin/dashboard`: metric cards for Total Companies (with Active/Pending split), Users, Jobs, Applications, Interviews. Prominent banner at top if pending approvals > 0: "N companies awaiting approval — Review Now" with link to companies page. **Users Page** at `/superadmin/users`: full-width table with columns: Name, Email, Role (badge), Company (name or "Platform"), Status (badge), Date Created, Actions (View/Deactivate). Search by name/email, filters for role, company, status. **Analytics Page** at `/superadmin/analytics`: Line chart for companies over time, Donut for company status distribution, Bar chart for top companies by jobs and applications. Use Recharts or Chart.js for all charts. Apply consistent dark/light theme support via next-themes.

---
