# Enterprise Project Management Tool — Functional Documentation

**Organization:** Quality Council of India (QCI)  
**Version:** 1.0  
**Date:** April 2026  
**Confidential**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Roles & Access Control](#2-user-roles--access-control)
3. [Dashboard](#3-dashboard)
4. [Project Management](#4-project-management)
5. [Kanban Board](#5-kanban-board)
6. [Sprint Management](#6-sprint-management)
7. [Task Management](#7-task-management)
8. [My Tasks](#8-my-tasks)
9. [User Management & Onboarding](#9-user-management--onboarding)
10. [Division Management](#10-division-management)
11. [Workflow & Approvals](#11-workflow--approvals)
12. [Time Tracking & Timesheets](#12-time-tracking--timesheets)
13. [Portfolio Dashboard](#13-portfolio-dashboard)
14. [Capacity Planning](#14-capacity-planning)
15. [Executive Dashboard & OKRs](#15-executive-dashboard--okrs)
16. [Platform-Wide Features](#16-platform-wide-features)
17. [Technical Architecture](#17-technical-architecture)
18. [Deployment & Configuration](#18-deployment--configuration)

---

## 1. System Overview

The QCI Enterprise PM Tool is a comprehensive SaaS project management platform purpose-built for multi-division enterprise organizations. It provides a unified workspace for project tracking, sprint management, team collaboration, time tracking, resource planning, and executive reporting.

### Business Problems Addressed

| Problem | Solution |
|---|---|
| Siloed project data across divisions | Single unified platform for all divisions |
| Manual status tracking causing missed deadlines | Real-time Kanban boards and automated notifications |
| No visibility into team capacity | Capacity heatmaps and utilization dashboards |
| Disconnected approval workflows | Configurable multi-step approval chains |
| No real-time portfolio health monitoring | Executive portfolio dashboard with health scores |
| Time tracking scattered across spreadsheets | Integrated time logging and timesheet approvals |

### Key Stakeholders

- **Org Admin / IT Admin** — Full platform control, user provisioning, billing
- **Division Admin** — Division-level operations and budget management
- **Project Manager** — Day-to-day project and sprint management
- **Team Member** — Task execution, time logging, collaboration
- **Executive / Leadership** — Strategic visibility, OKRs, portfolio health
- **Viewer / External** — Limited read-only access to specific projects

---

## 2. User Roles & Access Control

The platform implements a **6-tier role-based access control (RBAC)** system. Each role has a defined permission scope, and users are assigned one role per organization.

### Role Hierarchy

```
Org Admin
  └── Division Admin
        └── Project Manager
              └── Member
              └── Executive (cross-cutting, read-only)
              └── Viewer (limited read-only)
```

### Role Definitions

#### Org Admin
- Full system access across all divisions and projects
- Manages users: invite, suspend, reactivate, change roles, remove
- Creates and manages divisions
- Configures global workflows, approval chains, and custom roles
- Access to all reports, exports, and executive dashboards
- Controls billing and platform settings

#### Division Admin
- Manages a specific division and its projects
- Can invite new users to the organization
- Assigns members to division projects
- Configures division-level feature flags (time tracking, sprints, etc.)
- Manages division budget and headcount
- Approves timesheets for division members

#### Project Manager
- Creates and manages projects within their division
- Assigns tasks to team members
- Creates, starts, and completes sprints
- Reviews and approves timesheets
- Manages Kanban board and task workflows
- Can delete any comment on their projects

#### Member
- Works on assigned tasks
- Moves tasks through workflow statuses
- Logs time against tasks and projects
- Submits weekly timesheets for approval
- Adds comments and collaborates on tasks
- Participates in sprint activities

#### Executive
- Read-only access to portfolio dashboards
- Views OKR tracking at company and division level
- Views executive scorecards and cross-division reports
- Cannot create or modify any content
- Receives summary notifications and alerts

#### Viewer
- Read-only access to specific projects they are granted visibility into
- Cannot create, modify, or delete any content
- Useful for external stakeholders, auditors, or cross-team visibility

---

## 3. Dashboard

The Dashboard is the first screen a user sees after logging in. It provides a real-time, organization-wide summary tailored to the user's role.

### Components

**Stat Cards (top row)**
- Active Projects count
- Total Tasks count
- Overall completion rate (%)
- Overdue tasks count (highlighted in red if > 0)

**Recent Activity Feed**
- Live timeline of events across all projects the user has access to
- Events include: sprint started/completed, tasks moved to Done, new comments, user invitations, timesheet submissions
- Clicking an event navigates to the relevant item

**My Tasks Widget**
- Shows the 5 most urgent tasks assigned to the current user
- Tasks are sorted by due date (soonest first)
- Color-coded by priority: Critical (red), High (orange), Medium (yellow), Low (gray)
- Click any task to open the full task detail view

**Navigation Sidebar**
The sidebar provides access to all platform modules:
- Dashboard
- Projects (list + Kanban)
- Sprints
- My Tasks
- Time Logs
- Calendar
- Portfolio (admin/executive)
- Capacity Planning (admin/PM)
- Executive Dashboard (executive/admin)
- Approvals Inbox
- Admin (User Management, Divisions, Workflows, Roles)

---

## 4. Project Management

Projects are the primary organizational unit. Each project belongs to a division, has a set of tasks, and can run sprints.

### Creating a Project

**Who can create:** Org Admin, Division Admin, Project Manager

**Required Fields:**
- Project Name
- Division (dropdown of available divisions)
- Description (optional)
- Start Date / End Date (optional)

**Auto-generated:**
- Unique project key/code (e.g., `SAMPLE`, `APIV3`)
- Task sequence counter (tasks will be `SAMPLE-1`, `SAMPLE-2`, etc.)

### Project List

- Shows all projects the user has access to
- Displays: project name, division, status, task count, progress bar, assigned PM
- Filter by: division, status, date range
- Sort by: name, date created, last updated

### Project Detail

Clicking a project opens the project detail view with tabs:
- **Overview** — project stats, team members, milestones
- **Kanban** — drag-and-drop task board (see Section 5)
- **Sprints** — sprint list and backlog (see Section 6)
- **Members** — project team, role assignments
- **Settings** — project name, dates, workflow, notifications

---

## 5. Kanban Board

The Kanban board provides a visual, drag-and-drop interface for managing task workflow within a project.

### Default Columns

| Column | Color | Meaning |
|---|---|---|
| Backlog | Gray | Tasks not yet started |
| To Do | Blue | Ready to be picked up |
| In Progress | Orange | Actively being worked on |
| In Review | Purple | Awaiting peer review or PM approval |
| Done | Green | Completed |

> Columns are fully configurable via Workflow settings (see Section 11).

### Task Cards

Each card displays:
- Task title
- Priority badge (Critical / High / Medium / Low)
- Assignee avatar with initials
- Estimated hours
- Due date indicator (red if overdue)

### Actions on Task Cards

- **Drag** card to a new column to update its status
- **Click** card to open full task detail
- **Three-dot menu (⋮)** — View Details, Delete Task
- **Inline create** — click "+ Add Task" at the bottom of any column

### Filtering

- Filter by assignee (multi-select)
- Filter by priority
- Search by task title
- Clear all filters button

---

## 6. Sprint Management

Sprints enable Agile development workflows. Each sprint belongs to a project and contains a subset of tasks.

### Sprint States

| State | Meaning |
|---|---|
| Planned | Sprint created but not started yet |
| Active | Currently running (only one active sprint per project) |
| Completed | Sprint ended; tasks rolled over or marked done |

### Active Sprint Banner

At the top of the Sprint page, the currently active sprint is shown as a prominent banner with:
- Sprint name and goal
- Start and end dates
- Live statistics: task count, total estimated hours, completion percentage

### Sprint List Panel (left column)

- Lists all sprints for the selected project
- Shows sprint name, status badge (color-coded), and task count
- Click a sprint to load its tasks in the detail panel
- Delete button with confirmation prompt

### Sprint Detail Panel (right column)

- Shows all tasks assigned to the selected sprint
- Task rows display: priority icon, title, assignee, status, estimated hours
- **"Remove from Sprint"** option moves a task back to the backlog

**Backlog Section** (shown below sprint tasks)
- Lists all project tasks NOT assigned to any sprint
- Each backlog task has an **"+ Add"** button to assign it to the selected sprint

### Creating a Sprint

1. Click **"+ New Sprint"** button
2. Enter sprint name (required) and goal (optional)
3. Set start and end dates
4. Click **"Create Sprint"**

Starting a sprint automatically marks any currently active sprint as completed.

---

## 7. Task Management

Tasks are the fundamental unit of work. Every task belongs to a project and can be assigned to a sprint.

### Task Fields

| Field | Description |
|---|---|
| Title | Short description of the work |
| Description | Detailed explanation, acceptance criteria |
| Status | Current workflow state (Backlog, To Do, In Progress, etc.) |
| Priority | Critical / High / Medium / Low |
| Assignee | Team member responsible for the task |
| Reporter | Person who created or reported the task |
| Due Date | Target completion date |
| Estimated Hours | Planned effort in hours |
| Logged Hours | Actual time logged against this task |
| Sprint | Which sprint this task belongs to (if any) |
| Labels | Custom tags for categorization |

### Task Detail View

Opening a task shows:
1. **Header bar** — task ID (e.g., `SAMPLE-1`), breadcrumb navigation
2. **Title** (editable inline)
3. **Description** (rich text, editable)
4. **Field grid** — status, priority, assignee, reporter, due date, hours
5. **Comments section** — threaded discussion

### Comments

- Any project member can add a comment
- Comments show author avatar, name, and timestamp
- Authors can **edit** and **delete** their own comments
- Project Managers can delete any comment
- Comments support markdown formatting

### Task Creation

Tasks can be created from:
- The **Kanban board** (click "+ Add Task" in any column)
- The **Sprint detail panel** (task will be added to that sprint)
- The **My Tasks** page (opens create modal)

---

## 8. My Tasks

My Tasks is a personal task list showing all tasks assigned to the currently logged-in user across all projects.

### Filters

| Filter | Shows |
|---|---|
| All | Every assigned task |
| Open | Tasks not yet marked Done |
| Overdue | Open tasks past their due date |
| Done | Completed tasks |

### Task List Columns

- Checkbox (click to mark done)
- Task ID + Title
- Project name
- Priority badge
- Status
- Due date (red if overdue)
- Estimated hours

### Bulk Actions

Select multiple tasks to:
- Mark as Done
- Set priority (bulk update)
- Delete selected tasks

### Search

Type in the search box to filter tasks by title in real time.

---

## 9. User Management & Onboarding

User Management is accessible to Org Admin and Division Admin via the Admin menu.

### Active Members Tab

Displays all active organization members in a table:
- Avatar / initials
- Full name
- Email address
- Role badge (color-coded)
- Status indicator (active / suspended / inactive)
- Join date
- Last login date

**Actions per member:**
- **Change Role** — dropdown to reassign the user's role
- **Suspend** — temporarily disable access (status → suspended)
- **Reactivate** — re-enable a suspended user
- **Remove** — permanently remove from the organization

> The organization owner cannot be removed or have their role changed.

### Pending Invites Tab

Shows all invitations that have been sent but not yet accepted:
- Recipient email address
- Invited role
- Invited by (admin name)
- Invitation sent date
- Expiry date (invites expire after 7 days)
- **Cancel (×)** button to revoke the invitation

### Inviting a New User

1. Click **"+ Invite Member"** button
2. Enter the recipient's email address
3. Select their role from the dropdown
4. Click **"Send Invite"**

**What happens next:**
- A professional HTML email is sent to the recipient via Gmail SMTP
- The email contains: inviter name, assigned role, invite link, expiry date, QCI branding
- The invite link directs the user to the registration/acceptance page
- The invitation appears in the Pending Invites tab

**Safeguards:**
- Duplicate email check (cannot invite someone already a member)
- Duplicate invite check (cannot send a second pending invite to the same address)
- Invites expire automatically after 7 days
- Invalid role submissions are rejected with a validation error

---

## 10. Division Management

Divisions represent organizational units (e.g., Engineering, Sales, HR). Each project belongs to one division.

### Division List

Accessible via Admin → Divisions. Shows all divisions as cards with:
- Division name and code
- Color indicator
- Member count
- Project count
- Budget allocation

### Division Detail

Clicking a division opens:

**Overview Tab**
- Division stats
- Budget vs. actual spending
- Headcount target vs. current

**Members Tab**
- List of all division members
- Add/remove members
- Each member shows name, role, join date

**Projects Tab**
- All projects in this division
- Quick-create a new project within this division

**Feature Config Tab**
Module toggles per division:
- Time Tracking (on/off)
- Sprint Management (on/off)
- Calendar View (on/off)
- AI Assistant (on/off)
- Export Features (on/off)
- Custom Roles (on/off)

**Handoff Checklist Tab**
Pre-launch readiness checklist:
- Documentation complete
- Team trained
- Workflows configured
- Integrations tested
- Sign-off obtained

### Creating a Division

1. Click **"+ New Division"**
2. Enter: name, code (short identifier), color, parent division (optional for hierarchy)
3. Assign a Division Admin
4. Set budget and headcount targets
5. Save

### Division Hierarchy

Divisions can be nested (parent → child). The hierarchy is visualized as a tree. This supports large organizations with sub-departments under each major division.

---

## 11. Workflow & Approvals

### Custom Workflows

Each project can have a custom workflow (set of statuses). The default workflow is:
**Backlog → To Do → In Progress → In Review → Done**

**Customization options:**
- Add new status columns (e.g., "QA Testing", "Blocked")
- Remove unused statuses
- Reorder statuses via drag-and-drop
- Assign custom colors to each status
- Mark which status is the initial state and which is the final (Done) state

### Approval Chains

For sensitive actions (e.g., budget spend, scope changes, deliverable sign-off), multi-step approval chains can be configured.

**Setting up an approval chain:**
1. Go to Admin → Workflows → Approval Chains
2. Name the approval chain (e.g., "Budget Approval")
3. Add steps: assign an approver role or specific user to each step
4. Link the chain to a project, division, or form trigger

**Approval process:**
- Requestor submits an item for approval
- Step 1 approver is notified in-app and by email
- Approver can: **Approve** (advances to next step) or **Reject** (with a note, returns to requestor)
- On final approval, the item is marked approved and requestor is notified
- Full audit trail is maintained (who approved/rejected, timestamps, notes)

### Approvals Inbox

The Approvals Inbox (accessible from the sidebar) shows all pending approvals assigned to the current user:
- Item name, type, and requestor
- Submission date
- Current step in the chain
- One-click Approve / Reject buttons
- Filter by: pending, approved, rejected

### Forms & Submissions

Custom intake forms can be created to trigger workflows:
- Build a form with custom fields (text, date, dropdown, file upload)
- Link the form to an approval chain or task creation workflow
- Track all submissions and their current status
- Forms can be shared as links with internal or external users

---

## 12. Time Tracking & Timesheets

### Logging Time

Team members log time from:
- The **Task Detail** page (click "Log Time" button)
- The **Time Logs** page (manual entry)

**Time entry fields:**
- Date (defaults to today)
- Hours spent
- Task (searchable dropdown)
- Description/notes

Entries can be edited or deleted by the author. Admins can edit any entry.

### Weekly Timesheet View

The Timesheets page shows a weekly grid:
- Rows: projects the user has worked on
- Columns: Mon–Sun
- Each cell: hours logged per day per project
- Row total and weekly total shown
- Target: 40 hours/week (configurable)
- **Status**: Draft → Submitted → Approved / Rejected

### Submitting a Timesheet

1. Log all time for the week
2. Click **"Submit for Approval"**
3. The assigned approver (Division Admin or PM) is notified
4. Approver reviews and clicks **Approve** or **Reject with note**
5. Status is updated; submitter receives notification

### Time Reports

- **By-day breakdown** — hours per day in a selected period
- **By-project breakdown** — total hours logged per project
- **Org-wide time summary** — total hours by person across all projects
- All reports are **exportable to CSV**

### Manager View

Division Admins and Project Managers see all timesheets in their scope:
- Filter by week, person, or status
- Bulk approve multiple timesheets
- Reject with a required note
- View utilization trends over time

---

## 13. Portfolio Dashboard

The Portfolio Dashboard gives project managers, division admins, and executives a health overview across all active projects.

### Portfolio Table

Columns per project:
- Project name
- Division
- Progress (% of tasks done)
- Health Score (0–100)
- Budget status
- Status label (On Track / At Risk / Off Track)

**Health Score Formula:**
```
Health = (40% × Task Progress) + (30% × Budget Efficiency) + (30% × Blocked Task Penalty)
```

- **> 80** = Green (On Track)
- **65–80** = Orange (At Risk)
- **< 65** = Red (Off Track)

### Project Health Detail

Clicking a project in the portfolio shows:
- Health score breakdown (progress, budget, blocked tasks)
- Velocity trend over the last 4 sprints
- Budget: allocated vs. spent
- Upcoming milestones
- Overdue tasks list

---

## 14. Capacity Planning

Capacity Planning helps project managers and division admins balance workload across team members.

### Utilization Heatmap

A grid showing:
- **Rows:** Team members
- **Columns:** Weeks (configurable: 2 / 4 / 8 week view)
- **Cells:** Utilization percentage

**Color coding:**
| Color | Range | Interpretation |
|---|---|---|
| Blue | < 50% | Under-utilized |
| Green | 50–80% | Optimal |
| Orange | 80–100% | High load |
| Red | > 100% | Over-allocated |

### Per-Member Workload Cards

Below the heatmap, each team member has a card showing:
- Assigned tasks count
- Total estimated hours
- Current sprint tasks
- Availability (hours remaining this week)

### Over-Utilization Alerts

If any team member exceeds 100% utilization in a week, a warning alert is shown at the top of the page, prompting the PM to reassign or reschedule tasks.

---

## 15. Executive Dashboard & OKRs

The Executive Dashboard is designed for senior leadership and executives. It provides a strategic, read-only view of the entire organization.

### OKR Dashboard

- Company-level Objectives with linked Key Results
- Division-level OKRs with drill-down capability
- Each Key Result shows: target, current value, progress %
- Quarterly view: Q1 / Q2 / Q3 / Q4 toggle
- Trend indicator: on track / at risk / missed

### Division Scorecards

Each division is represented as a scorecard:
- Health status: Green / Amber / Red
- Task completion %
- Overdue tasks count
- Budget utilization bar
- Change vs. previous period (↑↓)

### Resource Dashboard

- Team size per division
- Billable vs. non-billable hours breakdown
- Capacity vs. demand comparison
- Exportable to CSV/PDF

### Executive Rollup

- Org-wide KPI summary in one view
- Alerts for divisions that are at risk
- Velocity trends comparison across divisions
- Budget comparison bar chart

---

## 16. Platform-Wide Features

### Global Search

- Press **⌘K** (Mac) or **Ctrl+K** (Windows) to open the global search bar
- Searches across: tasks, projects, users, divisions
- Results appear in < 200ms
- Filter results by type

### In-App Notifications

- Bell icon in the top navigation
- Unread count badge
- Notification panel shows last 20 events
- Mark individual notifications as read
- Mark all as read
- Delete notifications
- Panel auto-refreshes every 30 seconds

### Export Features

Users can export data from any list view:
- **CSV** — compatible with Excel, Google Sheets
- **Excel (.xlsx)** — formatted spreadsheet
- **PDF** — print-ready report
- Filter before export to export only what you need

### AI Assistant

An AI assistant (powered by Claude by Anthropic) is integrated throughout the platform:
- **Task description suggestions** — type a title, get a description draft
- **Sprint goal recommendations** — based on selected backlog items
- **Status report drafting** — weekly summary of sprint progress
- **Blocked task analysis** — suggests root causes and resolution paths

### Calendar View

- All tasks with due dates are plotted on a calendar
- Monthly and weekly views
- Click any task to open the detail panel
- Color-coded by project
- Filter by assignee

### Custom Roles

Beyond the 6 system roles, organizations can define custom permission sets:
- Name the role (e.g., "QA Lead", "Scrum Master")
- Select which permissions to grant
- Assign to any member

### External User Access

- Invite external collaborators (clients, partners, auditors)
- Set an access expiry date
- Restrict to specific projects only
- Revoke access instantly

### MS 365 Integration (Production)

- Outlook calendar sync (tasks appear as calendar events)
- Microsoft Teams notifications
- Azure Active Directory (AAD) authentication for SSO
- OneDrive / SharePoint for file attachments

---

## 17. Technical Architecture

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework with type safety |
| TanStack Query v5 | Server state management and caching |
| Tailwind CSS + shadcn/ui | Styling and component library |
| React Router v6 | Client-side navigation |
| Vite | Build tool and dev server |
| Axios | HTTP client for API requests |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| In-memory Maps (dev) | Data storage in development mode |
| Prisma ORM (prod) | Type-safe database access |
| JWT + Refresh Tokens | Authentication and session management |
| Zod | Request/response validation |
| Nodemailer + Gmail | Email delivery |
| Winston | Structured logging |

### Infrastructure (Production)

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Redis | Caching, session store, job queues |
| BullMQ | Background job processing |
| AWS S3 | File and attachment storage |
| HTTPS / TLS | Encrypted transport |

### Security

- **JWT authentication** with short-lived access tokens (15 min) and refresh tokens (7 days)
- **Helmet.js** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS whitelisting** — only configured frontend origins are accepted
- **Rate limiting** — 100 requests/minute per IP
- **bcrypt** — password hashing with salt rounds
- **Input validation** — all requests validated via Zod schemas before processing
- **RBAC middleware** — every route checks the user's role before executing

---

## 18. Deployment & Configuration

### Environment Variables

The backend requires a `.env` file at `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

# Auth
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com

# Database (Production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (Production)
REDIS_URL=redis://localhost:6379
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Create a new App Password for "Mail" / "Other (Custom name)"
4. Copy the 16-character password (no spaces) into `SMTP_PASS`

### Development Mode

In development mode, the backend uses **in-memory Map stores** — no database is required. Pre-seeded data includes:
- 1 organization (`dev-org-id`)
- 6 users with different roles
- 3 divisions (Engineering, Sales, HR)
- 2 projects with tasks
- 3 sprints

**Starting the servers:**
```bash
# Backend (from project root)
node backend/src/app.js

# Frontend (from project root)
cd frontend && npm run dev
```

**Dev login (no password required):**
Use the `x-dev-user-id` request header or select a persona from the login screen:
- `admin@example.local` → Org Admin
- `pm@example.local` → Project Manager
- `member@example.local` → Member
- `executive@example.local` → Executive

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL and run `npx prisma migrate deploy`
- [ ] Configure Redis
- [ ] Set all environment variables in production
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure Azure AD for SSO (optional)
- [ ] Set up BullMQ workers for background jobs
- [ ] Configure S3 bucket for file storage
- [ ] Run security audit (`npm audit`)
- [ ] Enable monitoring and alerting (e.g., Datadog, Sentry)

---

*Document prepared by Priyanka Bansal — Quality Council of India*  
*Enterprise PM Tool v1.0 — April 2026*
