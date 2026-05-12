# ProjectFlow — SaaS Project Management Tool
## Specifications Document

**Organisation:** Quality Council of India (QCI)
**Product Name:** ProjectFlow
**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Author:** Priyanka Bansal (priyanka.bansal@qcin.org)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Feature Modules](#5-feature-modules)
   - 5.1 [Authentication & Onboarding](#51-authentication--onboarding)
   - 5.2 [Shell & Navigation](#52-shell--navigation)
   - 5.3 [Workspace (All Roles)](#53-workspace-all-roles)
   - 5.4 [Project Management Section](#54-project-management-section)
   - 5.5 [Executive Section](#55-executive-section)
   - 5.6 [Admin Section](#56-admin-section)
   - 5.7 [Global Utilities](#57-global-utilities)
6. [API Summary](#6-api-summary)
7. [Data Models](#7-data-models)
8. [State Management](#8-state-management)
9. [Development Setup](#9-development-setup)
10. [Testing](#10-testing)

---

## 1. Overview

ProjectFlow is a multi-tenant SaaS project management platform built exclusively for Quality Council of India (QCI). It supports the full project delivery lifecycle — from task creation and sprint planning through to executive-level OKR and financial oversight — across multiple organisational divisions.

**Key design principles:**
- Role-filtered UI: every sidebar item, page, and action is visible only to authorised roles.
- Division-scoped data: members belong to one or more divisions; data and module access can be restricted per division.
- Feature-flag governance: a persisted Zustand store controls which features are active for each role; org_admin can toggle access at runtime.
- Development-mode persona switcher: a header control lets developers instantly switch between all six stakeholder personas without re-authenticating.

---

## 2. Tech Stack

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.6.3 |
| Build tool | Vite | 5.4.11 |
| Routing | React Router v6 | 6.28.0 |
| Server state | TanStack React Query | 5.60.0 |
| Client state | Zustand | 5.0.1 |
| HTTP client | Axios | 1.7.7 |
| UI primitives | Radix UI (Dialog, Dropdown, Select, Tabs, Toast, Tooltip, Popover, Avatar, Separator, Label, Slot) | Various |
| Styling | Tailwind CSS | 3.4.15 |
| Animation | tailwindcss-animate | 1.0.7 |
| Charts | Recharts | 2.13.3 |
| Icons | Lucide React | 0.454.0 |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable | 6.1.0 / 8.0.0 |
| Date utility | date-fns | 4.1.0 |
| Forms | React Hook Form | 7.53.2 |
| Class utilities | clsx, tailwind-merge, class-variance-authority | Latest |
| Unit testing | Vitest + @testing-library/react | 4.1.5 / 16.3.2 |

**Dev server:** `http://localhost:5173`
**API base URL:** `VITE_API_URL` env var, defaults to `/v1`

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | LTS |
| Framework | Express | 5.0.1 |
| Language | JavaScript (ESM) | — |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL | 17 |
| Auth | JSON Web Tokens (jsonwebtoken) | 9.0.2 |
| Password hashing | bcryptjs | 2.4.3 |
| AI integration | @anthropic-ai/sdk (Claude) | 0.39.0 |
| Queue | BullMQ | 5.30.0 |
| Real-time | Socket.IO | 4.8.1 |
| Email | Nodemailer | 8.0.5 |
| File uploads | Multer | 1.4.5-lts.1 |
| Rate limiting | express-rate-limit | 7.4.1 |
| Validation | Zod | 3.23.8 |
| Logging | Winston + Morgan | Latest |
| Security | Helmet, CORS | Latest |
| Cache/queue broker | ioredis (Redis) | 5.4.1 |

**Database connection:**
- Host: `localhost`
- Port: `5432`
- Database: `project_mgmt`
- User: `postgres`
- Password: `123456`
- `DATABASE_URL=postgresql://postgres:123456@localhost:5432/project_mgmt`

**API server:** `http://localhost:4000`
**API prefix:** `/v1`

---

## 3. Architecture

### High-Level Diagram

```
Browser (React SPA)
  └─ Vite dev server :5173
       └─ /v1/* → Express API :4000
                    └─ Prisma ORM
                         └─ PostgreSQL :5432
                    └─ BullMQ → Redis (background jobs)
                    └─ Socket.IO (real-time events)
                    └─ Anthropic SDK (AI features)
```

### Frontend Structure

```
frontend/src/
  api/
    client.ts           # Axios instance with auth interceptors + dev header injection
    hooks.ts            # All React Query hooks (queries + mutations)
  components/
    layout/
      AppShell.tsx      # Root layout: Sidebar + Header + <Outlet />
      Sidebar.tsx       # Collapsible nav, role-filtered sections
      Header.tsx        # Search, division switcher, role switcher, notifications, user menu
      MobileNav.tsx     # Bottom nav for mobile viewports
    shared/             # Reusable cross-page components
    ui/                 # shadcn/ui primitives (Button, Card, Badge, Avatar, Input, etc.)
  pages/
    auth/               # Login, Register, ForgotPassword, ResetPassword, InviteAccept, MicrosoftCallback
    DashboardPage.tsx
    pm/                 # Kanban, Calendar, Gantt, Sprints, Reports, AdvancedReports,
                        # TimeLogging, CapacityPlanning, ProjectTracking, Attendance
    user/               # MyTasks, TaskDetail, Notifications
    executive/          # ExecutiveDashboard, OKR, Financial, Resource, Roadmap, StatusReports,
                        # RiskRegister, Portfolio
    admin/              # AdminDashboard, UserManagement, Workflows, CustomFields, IssueTypes,
                        # TaskTemplates, AuditLog, DivisionConfig, DivisionMIS, Divisions,
                        # CustomRoles, ExternalUsers, Versioning, Exports, Approvals, Forms,
                        # FeatureFlags, OnboardingWizard, Handoff, OrgSettings, Integrations
  store/
    authStore.ts        # Zustand + persist: user, accessToken, currentRole, currentDivisionId
    featureFlagsStore.ts# Zustand + persist: per-feature role access matrix
    attendanceStore.ts  # Zustand + persist: clock-in/out, leave, 30-day seeded demo data
    themeStore.ts       # Zustand: dark/light mode
  types/index.ts        # Shared TypeScript interfaces
```

### Backend Structure

```
backend/
  prisma/
    schema.prisma       # All models and enums
    seed.js             # Demo data seeder
  src/
    app.js              # Express app entry, middleware, route mounting
    middleware/
      auth.js           # JWT verification + dev bypass
    routes/             # One file per resource (see API Summary)
    services/           # Business logic
```

### Authentication Flow

1. User submits email/password to `POST /v1/auth/login`.
2. Server returns `{ access_token, user, role }` + sets an `httpOnly` refresh-token cookie.
3. Frontend stores `access_token` in Zustand (persisted to `localStorage` under key `pm-auth`).
4. Every Axios request attaches `Authorization: Bearer <token>`.
5. On 401, the Axios interceptor calls `POST /v1/auth/refresh` (cookie-based) and retries.
6. On refresh failure, `logout()` is called and the user is redirected to `/login`.

**Development bypass:** When `NODE_ENV=development`, the backend authenticates any request that carries an `x-dev-user-id` header matching a key in its `DEV_USERS` map — no real token is required. The frontend Axios client auto-injects this header (`user.id`) in dev builds.

### Theming

- Tailwind `dark:` classes for component variants.
- CSS custom properties in HSL format on `:root` and `.dark`.
- Brand tokens:

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--primary` | hsl(215 60% 14%) | hsl(215 60% 14%) | QCI navy blue |
| `--accent` | hsl(200 88% 48%) | hsl(200 88% 48%) | Sky blue accent |
| `--background` | hsl(0 0% 100%) | hsl(222 47% 11%) | Page background |
| `--card` | hsl(0 0% 100%) | hsl(222 47% 14%) | Card surfaces |
| `--muted` | hsl(210 40% 96%) | hsl(217 33% 17%) | Muted areas |
| `--border` | hsl(214 32% 91%) | hsl(217 33% 22%) | Borders |
| `--foreground` | hsl(222 47% 11%) | hsl(210 40% 98%) | Body text |

- Sidebar: always dark navy (`hsl(215 60% 14%)`), independent of theme toggle.
- A horizontal 3px gradient bar in the header provides the QCI brand accent.

---

## 4. User Roles & Permissions

### Role Definitions

| Role | Code | Description |
|---|---|---|
| Org Admin | `org_admin` | Full access across all divisions, settings, and admin features. Always sees all feature flags. |
| Division Admin | `division_admin` | Full control within assigned divisions. Can manage division config, MIS, members, workflows, approvals, forms, exports, and audit logs for their division. |
| Project Manager | `project_manager` | Creates and manages projects, sprints, tasks, reports, capacity, and time tracking within their division. |
| Member | `member` | Works on assigned tasks, logs time, views calendar, accesses attendance, and submits timesheets. |
| Executive | `executive` | Read-only cross-division visibility: executive dashboard, OKRs, financials, resources, roadmap, portfolio. |
| Viewer | `viewer` | Read-only access to assigned projects. Sees dashboard, projects, calendar, project tracking, and roadmap. |

### Sidebar Section Visibility

| Section | Visible to |
|---|---|
| Workspace | All roles |
| Project Mgmt | org_admin, division_admin, project_manager, member |
| Executive | org_admin, executive |
| Admin | org_admin, division_admin |

### Dev Stakeholder Personas

The header role-switcher (dev mode only) maps each role to a named persona:

| Persona | Role | Dev User ID | Default Division |
|---|---|---|---|
| Demo Admin | org_admin | dev-org_admin-id | None (all) |
| Demo Div Admin | division_admin | dev-division_admin-id | div_engineering |
| Demo PM | project_manager | dev-project_manager-id | div_engineering |
| Demo Member | member | dev-member-id | div_engineering |
| Demo Executive | executive | dev-executive-id | None (all) |
| Demo Viewer | viewer | dev-viewer-id | None |

---

## 5. Feature Modules

### 5.1 Authentication & Onboarding

#### Login (`/login`)
- Email + password form.
- "Sign in with Microsoft" OAuth button → `/auth/microsoft-callback`.
- Redirects to `/dashboard` on success.
- Blocked in production if already authenticated (`PublicRoute` wrapper).

#### Register (`/register`)
- New user self-registration with email, first name, last name, password.
- Email verification flow (token sent via Nodemailer).

#### Forgot Password (`/forgot-password`)
- Email submission → password reset link sent.
- Reset form at `/reset-password?token=<token>`.

#### Invite Accept (`/invite`)
- Token-based invite link acceptance.
- Sets password and activates account.

#### Microsoft OAuth Callback (`/auth/microsoft-callback`)
- Handles redirect from Microsoft 365 OAuth.
- Creates/links user account and redirects to dashboard.

---

### 5.2 Shell & Navigation

#### AppShell
- Layout: fixed left Sidebar + fixed top Header + scrollable main content via React Router `<Outlet />`.
- Protected by `ProtectedRoute`; redirects to `/login` if no `accessToken`.

#### Sidebar
- **Width:** 64px (collapsed) / 256px (expanded).
- **Toggle:** Chevron button at bottom.
- **Sections:** Workspace, Project Mgmt, Executive, Admin — each separated by a divider.
- **Role filtering:** items rendered only when `currentRole` is in the item's `roles` array.
- **Active state:** left border highlight in sky blue, background in darker navy.
- **Collapsed tooltips:** fixed-position (z-[500]) label appears on hover so overflow:hidden does not clip it.
- **Branding:** "PF" logo mark + "ProjectFlow / Quality Council of India" text.
- **User strip:** name + role label at bottom (hidden when collapsed).

#### Header
- 60px fixed bar with a 3px QCI gradient top accent.
- **Global search** trigger (opens `GlobalSearch` modal, queries `/v1/search`).
- **Division switcher:** pill dropdown — lists divisions from `useMyDivisions()`; sets `currentDivisionId` in auth store.
- **Role switcher:** pill dropdown (desktop only in header, also in user menu on mobile) — lists all six personas; calls `switchRole()`.
- **Notification bell:** badge with unread count; opens `NotificationPanel` dropdown (polling every 30s).
- **User menu:** avatar with role-coloured ring, name, email, theme toggle, sign-out.

#### Mobile Navigation (`MobileNav`)
- Bottom tab bar visible on small screens as an alternative to the sidebar.

---

### 5.3 Workspace (All Roles)

#### Dashboard (`/dashboard`)
- **KPI cards:** Total projects, active projects, total tasks, completed tasks, overdue tasks, my open tasks.
- **Project progress bars:** per-project completion percentage.
- **Team workload table:** open tasks, high-priority tasks, overdue tasks, estimated hours per member.
- **Recent activity feed:** chronological list of org events (actor, action, entity).
- **Chart widgets:** powered by Recharts.
- Data sourced from `GET /v1/dashboard/overview` → `useDashboard()`.

#### Projects (`/projects`)
- **List view:** paginated cards/table with status filter (active, archived, completed, on_hold), search, color indicator.
- **Create project modal:** name, key (auto-generated, unique per org), description, status, visibility (private/org_wide/public), color, start date, due date.
- **Delete project** with confirmation.
- Links to per-project board (`/projects/:id/board`), calendar (`/projects/:id/calendar`), Gantt (`/projects/:id/gantt`).

#### Kanban Board (`/projects/:projectId/board`)
- Columns driven by the project's workflow statuses.
- Tasks displayed as cards with priority badge, assignee avatar, due date, tag chips.
- **Drag-and-drop** via @dnd-kit/sortable: moving a card calls `POST /v1/tasks/:id/move` with `{ status_id, status_name, position }`.
- **Inline create:** "+" button per column opens `TaskModal`.
- Filters: status, assignee, priority, search.

#### My Tasks (`/my-tasks`)
- Personal task list fetched via `GET /v1/tasks/my`.
- Filters: status, priority, page.
- Sortable columns; bulk actions (status, priority, assignee, delete) via `PATCH /v1/tasks/bulk`.

#### Task Detail (`/tasks/:taskId`)
- Full task view: title, description (rich text), status, priority, assignee, reporter, dates, estimated vs logged hours, tags, custom fields.
- **Comment thread:** threaded replies, edit/delete, @mentions.
- **Subtasks:** nested task list.
- **File attachments:** upload/download.
- **Time log entries:** inline log form.
- **Activity history:** change feed.

#### Calendar (`/calendar`)
- Month and week views of tasks and deadlines.
- Also accessible per-project at `/projects/:id/calendar`.
- Tasks rendered as event blocks; click to open task detail.

#### Notifications (`/notifications`)
- Full-page notification list with type filters (task_assigned, task_updated, task_commented, project_created, project_updated, member_added, mention, due_date_reminder, workflow_changed).
- Mark individual as read, delete individual, mark all as read.
- Also accessible via header bell dropdown for quick triage.

---

### 5.4 Project Management Section

*Visible to: org_admin, division_admin, project_manager; Time Tracking and Attendance also include member.*

#### Sprints (`/sprints`)
- **Sprint list** per project (project selector dropdown).
- Sprint states: `planned`, `active`, `completed`.
- Create sprint with name, goal, start date, end date.
- **Backlog panel:** tasks not yet in any sprint; drag to add to sprint.
- Remove task from sprint.
- **Burndown chart:** Recharts line chart of remaining work over sprint duration.
- Delete sprint (tasks return to backlog).

#### Team (`/team`)
- Organisation member list with role, status, last login, join date.
- **Invite member:** email + role → generates invite link.
- **Pending invites:** list with cancel action.
- Suspend/activate member.
- Remove member.
- Division filter.
- Data via `GET /v1/members`, `POST /v1/members/invite`, `PATCH /v1/members/:id/status`, `DELETE /v1/members/:id`.

#### Time Tracking (`/time-tracking`)
- **Weekly timesheet grid:** Mon–Sun columns, task rows; log hours per cell.
- **Weekly summary:** total hours, target hours, breakdown by day and by project.
- **Timesheet submission:** `POST /v1/time-logs/timesheets/submit` with week start.
- **Timesheet approval/rejection** (managers): `PATCH /v1/time-logs/timesheets/:id/approve|reject`.
- **Org-level summary** for managers: `GET /v1/time-logs/summary/org`.
- Project filter for log entries.
- Edit and delete existing time entries.

#### Reports (`/reports`)
- **Burndown chart:** sprint remaining effort over time.
- **Velocity chart:** story points / task count completed per sprint.
- **Time tracking chart:** hours by project over period.
- **Task distribution pie:** breakdown by status or priority.
- Project selector and date range controls.

#### Advanced Reports (`/reports/advanced`)
- Drag-and-drop dashboard builder using @dnd-kit.
- Widget size selector: S / M / L / XL grid cells.
- Widget library: bar charts, line charts, pie charts, stat cards, custom tables.
- Widget configuration panel: data source, filters, axis labels.
- Saved layout persistence.

#### Capacity Planning (`/capacity`)
- **Heatmap** of team utilisation by week — cell colour intensity indicates % of capacity used.
- Per-member capacity hours configuration.
- Organisation head and division head designation controls.
- Overallocation alerts.
- Data from `GET /v1/resources/capacity/heatmap` → `useResourceCapacityHeatmap()`.

#### Project Tracking (`/project-tracking`)
- **RAG (Red/Amber/Green) status dashboard** across all projects.
- Columns: project name, status, owner, completion %, budget vs spent, milestone count.
- **Milestone tracker** panel.
- **CSV export** button.
- Accessible to: org_admin, division_admin, project_manager, executive, viewer.

#### AI Features (`/ai`)
- **Claude-powered task suggestions:** paste a project description → AI returns a structured list of suggested tasks with priorities and estimates.
- **Task summary generation:** summarise a task's description and comments into a concise brief.
- Powered by `@anthropic-ai/sdk` on the backend; usage logged to `AiLog` table.
- Accessible to: org_admin, division_admin, project_manager.

#### Gantt Timeline (`/gantt`, `/projects/:projectId/gantt`)
- Visual horizontal bar chart of tasks over time.
- Priority-coloured bars (critical = red, high = orange, medium = blue, low = green).
- Zoom levels: day / week / month.
- Project selector shown when accessed via `/gantt` (no project context).
- Accessible to: org_admin, division_admin, project_manager.

#### Attendance (`/attendance`)
- **Clock-in / Clock-out** with live timer display.
- **Today summary:** current status, hours worked, clock-in/out timestamps.
- **Weekly grid:** Mon–Fri grid showing status per day (present, absent, leave, WFH, half-day, holiday).
- **Monthly calendar:** heat-map style attendance calendar.
- **Leave request form:** type (sick, casual, earned, WFH, half-day), date, reason; deducts from leave balance.
- **Team view** (managers only): team attendance for a selected date using `getTeamAttendance()`.
- Leave balances: sick (10), casual (12), earned (15) days initialised per demo user.
- Persisted to `localStorage` under `pm-attendance`; last 90 days retained.
- Accessible to: org_admin, division_admin, project_manager, member.

---

### 5.5 Executive Section

*Visible to: org_admin, executive (with noted exceptions).*

#### Executive Dashboard (`/executive`)
- Cross-division KPI scorecard grid: divisions count, total projects, active projects, total members, total budget, overall completion %, overdue tasks.
- Division health distribution: green / amber / red counts.
- Velocity comparison bar chart (division vs division).
- Budget comparison bar chart.
- Active alerts panel (severity-tagged messages per division).
- Data from `GET /v1/executive/rollup` → `useExecutiveRollup()`.

#### OKR & Goals (`/executive/okrs`)
- Objectives list with key results nested beneath.
- Progress bars per key result (0–100%).
- Health indicators: `on_track` (green), `behind` (amber), `at_risk` (red).
- **New OKR modal:** title, description, level (org/division), quarter, year, owner.
- Division filter.
- Update key result progress.
- Data from `GET /v1/okrs` → `useOKRs()`, `POST /v1/okrs` → `useCreateOKR()`.

#### Financial Dashboard (`/executive/financial`)
- Budget vs spent comparison per division.
- Cost-over-time line chart.
- Division filter.
- Data from `GET /v1/financial/*`.

#### Resource Dashboard (`/executive/resources`)
- Capacity and skill matrix across all divisions.
- Resource utilisation summary.
- Data from `GET /v1/resources/dashboard` → `useResourceDashboard()`.

#### Roadmap (`/roadmap`)
- High-level product/project roadmap timeline.
- Accessible to: org_admin, division_admin, project_manager, executive, viewer.

#### Status Reports (`/status-reports`)
- Per-project status reports with health indicators, summary text, and milestone list.
- Accessible to: org_admin, division_admin, project_manager, executive.

#### Risk Register (`/risk-register`)
- Risk table: description, severity, likelihood, owner, mitigation, status.
- Add/edit/resolve risks.
- Accessible to: org_admin, division_admin, project_manager, executive.

#### Portfolio (`/portfolio`)
- Multi-project portfolio view.
- Portfolio summary: `GET /v1/portfolio` → `usePortfolioSummary()`.
- Capacity by week (configurable 1–8 weeks): `GET /v1/portfolio/capacity?weeks=N` → `usePortfolioCapacity()`.
- Dependency graph: `GET /v1/portfolio/dependencies` → `usePortfolioDependencies()`.
- Accessible to: org_admin, executive.

---

### 5.6 Admin Section

*Visible primarily to org_admin; some items available to division_admin, project_manager.*

#### Admin Dashboard (`/admin/dashboard`)
- System health overview: member count, project count, task metrics, storage usage.
- Accessible to: org_admin.

#### Roles & Permissions (`/admin/roles`)
- **System role matrix:** view and edit the permission set for each built-in role.
- **Custom roles:** create named roles with a bespoke permission set; assign to members.
- **Member role assignment:** change an org member's role.
- Data via `GET /v1/roles`, `POST /v1/roles`, `PATCH /v1/roles/:id`, `GET /v1/roles/system-matrix`, `PATCH /v1/roles/system-matrix`.
- Accessible to: org_admin.

#### Division Config (`/admin/division-config`)
- Per-division configuration panel.
- **Module toggles:** enable/disable feature modules per division (e.g., time_tracking, sprints, reports).
- **Feature toggles:** granular sub-feature switches.
- **Role permission overrides:** override system-level role permissions within the division scope.
- **Workflow template selector:** assign a workflow config to the division.
- **Member management:** add/remove division members with role; `POST /v1/division-config/:id/members`, `DELETE /v1/division-config/:id/members/:userId`.
- Data via `GET /v1/division-config`, `PATCH /v1/division-config/:id`.
- Accessible to: org_admin, division_admin.

#### Division MIS (`/admin/division-mis`)
- Division Management Information System.
- Per-division metrics: members (total/active/inactive/suspended), projects (total/active/completed/on_hold/overdue), tasks (by status and priority), time tracking (weekly/monthly hours), approvals (pending/approved/rejected), top contributors, recent activity.
- Division overview list with health scores.
- Data from `GET /v1/mis/division/:id` and `GET /v1/mis/division-overview`.
- Accessible to: org_admin, division_admin.

#### Handoff Panel (`/admin/handoff`)
- Division readiness checklist for handoff events.
- Per-division checklist scores and ready flags.
- Data from `GET /v1/division-config/handoff/all`.
- Accessible to: org_admin.

#### User Management (`/admin/users`)
- Full member CRUD (same as Team page but in admin context).
- Accessible to: org_admin.

#### Workflows (`/admin/workflows`)
- **Workflow template builder:** create named workflow configs with custom statuses and transitions.
- Status properties: name, color, is_initial, is_final, order.
- Transition rules: from status → allowed to statuses.
- Mark as default.
- Delete workflow (not if in use).
- Data via `GET /v1/workflows`, `POST /v1/workflows`, `PATCH /v1/workflows/:id`, `DELETE /v1/workflows/:id`.
- Accessible to: org_admin.

#### Issue Types (`/admin/issue-types`)
- Define custom issue type labels beyond the default "task" type (e.g., Bug, Story, Epic, Sub-task).
- Icon and colour per type.
- Accessible to: org_admin.

#### Task Templates (`/admin/templates`)
- Create reusable task skeletons: title pattern, default priority, estimated hours, tags, custom field defaults.
- Apply a template when creating a new task.
- Accessible to: org_admin, division_admin, project_manager.

#### Custom Fields (`/admin/custom-fields`)
- Define additional data fields that appear on task forms.
- Field types: text, number, date, select, multi-select, checkbox, user.
- `applies_to`: task or project.
- Required toggle, archived toggle, display order.
- Data via `GET /v1/custom-fields`, `POST /v1/custom-fields`, etc.
- Accessible to: org_admin.


#### Divisions (`/admin/divisions`)
- Create, rename, archive divisions.
- Hierarchical structure (parent/child).
- Assign manager, budget, head count.
- Colour and icon per division.
- Data via `GET /v1/divisions`, `GET /v1/divisions/hierarchy`, `POST /v1/divisions`, `PATCH /v1/divisions/:id`, `DELETE /v1/divisions/:id`.
- Accessible to: org_admin.

#### External Users (`/admin/external-users`)
- Invite outside stakeholders (clients, auditors) with limited access.
- Access levels: viewer, commenter.
- Optional expiry date.
- Grant/revoke access to specific resources (projects, tasks).
- Data via `GET /v1/external-users`, `POST /v1/external-users`, `POST /v1/external-users/:id/revoke`.
- Accessible to: org_admin.

#### Approvals (`/admin/approvals`)
- Multi-step approval workflow inbox.
- View pending approvals assigned to the current user's role.
- Approve or reject a step with an optional note.
- Create new approval requests linked to a task or project.
- Data via `GET /v1/approvals/pending`, `POST /v1/approvals/:id/approve`, `POST /v1/approvals/:id/reject`.
- Accessible to: org_admin, division_admin, project_manager.

#### Forms (`/admin/forms`)
- Form builder for custom intake / request forms.
- Field types: text input, textarea, dropdown, checkbox, date picker, file upload.
- Published forms can be submitted by members; submission data attached to tasks or routed to approvals.
- Data via `GET /v1/forms/templates`, `POST /v1/forms/submit/:id`, `GET /v1/forms/submissions`.
- Accessible to: org_admin, division_admin, project_manager.

#### Versioning (`/admin/versioning`)
- Entity version history: view point-in-time snapshots of any entity (project, task, workflow).
- Create org-level snapshots.
- Data via `GET /v1/versioning/:type/:id/history`, `GET /v1/versioning/snapshots`, `POST /v1/versioning/snapshots`.
- Accessible to: org_admin.

#### Exports (`/admin/exports`)
- Trigger async data exports: tasks (CSV/JSON), projects (CSV/JSON).
- View export queue: status (pending/processing/completed/failed), file size, record count, download link.
- Data via `GET /v1/exports`, `POST /v1/exports/tasks`, `POST /v1/exports/projects`.
- Accessible to: org_admin, division_admin, project_manager.

#### Audit Log (`/admin/audit-log`)
- Full immutable activity history stored in `ActivityLog` table.
- Columns: timestamp, actor (name/email/avatar), action, entity type, entity ID, old value, new value, diff, IP address.
- Filters: entity_type, action, actor, date range, search text.
- Paginated (page / page_size).
- Data via `GET /v1/audit-logs` → `useAuditLogs()`.
- Accessible to: org_admin, division_admin.

#### Integrations (`/settings/integrations`, `/admin/integrations`)
- **Microsoft 365 / Outlook integration:** calendar sync, meeting task creation.
- OAuth flow via `/auth/microsoft-callback`.
- Accessible to: org_admin, project_manager, member.

#### Feature Flags (`/admin/feature-flags`)
- Matrix table: rows = features, columns = roles.
- Toggle checkboxes enable/disable each feature for each role.
- Core features (projects, kanban_board, my_tasks) cannot be disabled.
- **Bulk controls:** enable all / disable all per role column.
- Changes persist to `localStorage` under `pm-feature-flags`.
- `org_admin` always has access regardless of flags.
- Feature categories: Core, PM, Executive, Admin.
- Accessible to: org_admin.

#### Onboarding Wizard (`/admin/onboarding`)
- Step-by-step guided setup for a new organisation or division.
- Steps: org profile → divisions → invite members → configure workflows → set feature flags → done.
- Accessible to: org_admin.

#### Settings (`/settings`)
- Organisation settings: name, logo, domain, plan details, max members, max projects.
- Accessible to: org_admin.

---

### 5.7 Global Utilities

#### Global Search
- Triggered from header search bar (requires ≥2 characters).
- Searches tasks and projects simultaneously via `GET /v1/search?q=&types=tasks,projects&page_size=20`.
- Results grouped by type, with keyboard navigation.
- `useSearch()` hook with 10s stale time.

#### Notification Panel
- Bell icon with unread count badge (polled every 30s).
- Dropdown lists recent notifications with type icons.
- Per-item: mark as read (`PATCH /v1/notifications/:id/read`), delete (`DELETE /v1/notifications/:id`).
- "Mark all read" button (`PATCH /v1/notifications/read-all`).
- Notification types: task_assigned, task_updated, task_commented, project_created, project_updated, member_added, mention, due_date_reminder, workflow_changed.

#### Task Modal (`TaskModal`)
- Create/edit task dialog used across Kanban, Sprint, and My Tasks views.
- Fields: title, description, status, priority, assignee, due date, estimated hours, tags, sprint, custom fields.

#### Project Modal (`ProjectModal`)
- Create project dialog with all project fields.

#### Permission Gate (`PermissionGate`)
- Component wrapper that renders children only if the current role has access to the given feature key, using `useFeatureFlagsStore.isEnabled(featureKey, role)`.

#### Keyboard Shortcuts
- Managed by `useKeyboardShortcuts` hook.
- Shortcut panel (`KeyboardShortcutsPanel`) accessible from header or via hotkey.

#### Workflow Modal (`WorkflowModal`)
- Dialog for creating/editing workflow configurations.

#### Approval Inbox (`ApprovalInbox`)
- Shared component used inside the Approvals page and potentially as a widget.

#### File Attachments (`FileAttachments`)
- Reusable upload/download component used in TaskDetail.

#### Form Builder (`FormBuilder`)
- Drag-and-drop field composer used inside the Forms admin page.

---

## 6. API Summary

All routes are prefixed with `/v1/`. Authentication is enforced via JWT middleware (dev bypass: `x-dev-user-id` header in `NODE_ENV=development`).

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/refresh` | Refresh access token (httpOnly cookie) |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Apply new password |
| GET | `/auth/microsoft` | Initiate Microsoft OAuth |
| GET | `/auth/microsoft/callback` | OAuth callback |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/overview` | KPIs, project progress, team workload, recent activity |

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List projects (status, search, page filters) |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get single project |
| PATCH | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

### Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/tasks/project/:projectId` | List project tasks (view, status_id, assignee_id, priority, search filters) |
| POST | `/tasks/project/:projectId` | Create task |
| GET | `/tasks/my` | Current user's tasks |
| GET | `/tasks/:id` | Get single task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/move` | Move task to new status/position (Kanban) |
| PATCH | `/tasks/bulk` | Bulk operation (status/priority/assignee/delete) |

### Comments

| Method | Path | Description |
|---|---|---|
| GET | `/comments/task/:taskId` | List comments for task |
| POST | `/comments/task/:taskId` | Create comment (or reply) |
| PATCH | `/comments/:id` | Edit comment |
| DELETE | `/comments/:id` | Delete comment |

### Sprints

| Method | Path | Description |
|---|---|---|
| GET | `/sprints` | List sprints for project |
| POST | `/sprints` | Create sprint |
| GET | `/sprints/backlog` | Backlog tasks for project |
| PATCH | `/sprints/:id` | Update sprint |
| DELETE | `/sprints/:id` | Delete sprint |
| POST | `/sprints/:id/tasks` | Add task to sprint |
| DELETE | `/sprints/:id/tasks/:taskId` | Remove task from sprint |

### Members

| Method | Path | Description |
|---|---|---|
| GET | `/members` | List org members |
| POST | `/members/invite` | Invite member by email+role |
| GET | `/members/invites` | List pending invites |
| DELETE | `/members/invites/:id` | Cancel invite |
| PATCH | `/members/:id/status` | Suspend/activate member |
| DELETE | `/members/:id` | Remove member |

### Time Logs

| Method | Path | Description |
|---|---|---|
| GET | `/time-logs/my` | Current user's time logs (date range, project filter) |
| POST | `/time-logs` | Log time entry |
| PATCH | `/time-logs/:id` | Edit time entry |
| DELETE | `/time-logs/:id` | Delete time entry |
| GET | `/time-logs/summary/weekly` | Weekly hours summary |
| GET | `/time-logs/summary/org` | Org-wide hours summary |
| GET | `/time-logs/timesheets` | List timesheets |
| POST | `/time-logs/timesheets/submit` | Submit weekly timesheet |
| PATCH | `/time-logs/timesheets/:id/approve` | Approve timesheet |
| PATCH | `/time-logs/timesheets/:id/reject` | Reject timesheet |

### Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | List notifications (unread_only, page) |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

### Workflows

| Method | Path | Description |
|---|---|---|
| GET | `/workflows` | List org workflows |
| POST | `/workflows` | Create workflow |
| GET | `/workflows/:id` | Get workflow |
| PATCH | `/workflows/:id` | Update workflow |
| DELETE | `/workflows/:id` | Delete workflow |

### Divisions

| Method | Path | Description |
|---|---|---|
| GET | `/divisions` | List divisions |
| GET | `/divisions/hierarchy` | Tree structure |
| POST | `/divisions` | Create division |
| GET | `/divisions/:id` | Get division |
| PATCH | `/divisions/:id` | Update division |
| DELETE | `/divisions/:id` | Delete division |

### Division Config

| Method | Path | Description |
|---|---|---|
| GET | `/division-config` | All division configs |
| GET | `/division-config/my` | Divisions current user belongs to |
| GET | `/division-config/:id` | Config for division |
| PATCH | `/division-config/:id` | Update config (modules, features, overrides) |
| GET | `/division-config/:id/members` | Division members |
| POST | `/division-config/:id/members` | Add member to division |
| DELETE | `/division-config/:id/members/:userId` | Remove member |
| GET | `/division-config/handoff/all` | All division handoff statuses |
| GET | `/division-config/:id/handoff-status` | Single division handoff |

### OKRs

| Method | Path | Description |
|---|---|---|
| GET | `/okrs` | List OKRs (level, quarter, year) |
| POST | `/okrs` | Create OKR |
| PATCH | `/okrs/:id` | Update OKR / key result progress |

### Executive

| Method | Path | Description |
|---|---|---|
| GET | `/executive/rollup` | Cross-division KPI rollup |
| GET | `/executive/scorecards` | Per-division scorecards |

### Resources

| Method | Path | Description |
|---|---|---|
| GET | `/resources` | List resources |
| GET | `/resources/capacity/heatmap` | Utilisation heatmap data |
| GET | `/resources/dashboard` | Resource dashboard summary |

### Portfolio

| Method | Path | Description |
|---|---|---|
| GET | `/portfolio` | Portfolio summary |
| GET | `/portfolio/capacity` | Capacity by week |
| GET | `/portfolio/dependencies` | Cross-project dependencies |

### Roles

| Method | Path | Description |
|---|---|---|
| GET | `/roles` | List custom roles |
| POST | `/roles` | Create custom role |
| GET | `/roles/:id` | Get custom role |
| PATCH | `/roles/:id` | Update custom role |
| DELETE | `/roles/:id` | Delete custom role |
| GET | `/roles/permissions` | Available permission list |
| GET | `/roles/system-matrix` | System role permission matrix |
| PATCH | `/roles/system-matrix` | Update system role permissions |
| GET | `/roles/members` | Org members with roles |
| PATCH | `/roles/members/:userId` | Change member's role |

### External Users

| Method | Path | Description |
|---|---|---|
| GET | `/external-users` | List external users |
| POST | `/external-users` | Invite external user |
| GET | `/external-users/:id` | Get external user |
| PATCH | `/external-users/:id` | Update access |
| POST | `/external-users/:id/revoke` | Revoke access |

### Approvals

| Method | Path | Description |
|---|---|---|
| GET | `/approvals` | List approvals (status filter) |
| GET | `/approvals/pending` | Pending approvals for current user |
| POST | `/approvals` | Create approval request |
| GET | `/approvals/:id` | Get approval |
| POST | `/approvals/:id/approve` | Approve current step |
| POST | `/approvals/:id/reject` | Reject current step |

### Forms

| Method | Path | Description |
|---|---|---|
| GET | `/forms/templates` | List form templates |
| GET | `/forms/templates/:id` | Get template |
| POST | `/forms/submit/:id` | Submit form |
| GET | `/forms/submissions` | List submissions |

### Versioning

| Method | Path | Description |
|---|---|---|
| GET | `/versioning/:type/:id/history` | Entity version history |
| GET | `/versioning/snapshots` | List snapshots |
| POST | `/versioning/snapshots` | Create snapshot |

### Exports

| Method | Path | Description |
|---|---|---|
| GET | `/exports` | List exports |
| GET | `/exports/:id` | Get export |
| POST | `/exports/tasks` | Trigger task export |
| POST | `/exports/projects` | Trigger project export |

### Audit Logs

| Method | Path | Description |
|---|---|---|
| GET | `/audit-logs` | List audit log entries (entity_type, action, actor_id, search, date range, page) |

### MIS

| Method | Path | Description |
|---|---|---|
| GET | `/mis/division/:id` | Division MIS data |
| GET | `/mis/division-overview` | All divisions overview metrics |

### Search

| Method | Path | Description |
|---|---|---|
| GET | `/search` | Full-text search (q, types, page_size) |

### AI

| Method | Path | Description |
|---|---|---|
| POST | `/ai/suggest-tasks` | Claude task suggestions for a project description |
| POST | `/ai/summarise-task` | Claude summary of a task |

### Financial

| Method | Path | Description |
|---|---|---|
| GET | `/financial/*` | Budget and cost data (division-scoped) |

### Integrations

| Method | Path | Description |
|---|---|---|
| GET | `/integrations/outlook/*` | Microsoft 365 calendar / email integration endpoints |

---

## 7. Data Models

All models live in `backend/prisma/schema.prisma`. UUIDs are used for all primary keys. Soft deletes are supported on key entities via `deleted_at` timestamp.

### Core Enums

| Enum | Values |
|---|---|
| `OrgRole` | org_admin, division_admin, project_manager, member, executive, viewer |
| `OrgPlan` | free, starter, professional, enterprise |
| `UserStatus` | active, inactive, suspended, pending_verification |
| `ProjectStatus` | active, archived, completed, on_hold |
| `ProjectVisibility` | private, org_wide, public |
| `TaskPriority` | critical, high, medium, low, none |
| `NotificationType` | task_assigned, task_updated, task_commented, project_created, project_updated, member_added, mention, due_date_reminder, workflow_changed |

### Key Models

#### Organization
Fields: id, name, slug (unique), domain, logo_url, plan (OrgPlan), plan_expires_at, max_members, max_projects, is_active, settings (JSON), metadata (JSON), created_at, updated_at, deleted_at.

#### Division
Fields: id, org_id, parent_id (self-referential hierarchy), name, description, code (unique per org), icon, color, settings (JSON), budget (Decimal), head_count, manager_id, is_active, display_order, created_by, created_at, updated_at, deleted_at.

#### User
Fields: id, email (unique), email_verified_at, password_hash, first_name, last_name, avatar_url, timezone, locale, status (UserStatus), last_login_at, failed_login_count, locked_until, preferences (JSON), created_at, updated_at, deleted_at.

#### OrgMember
Fields: id, org_id, user_id, role (OrgRole), is_owner, invited_by, joined_at. Unique constraint: (org_id, user_id).

#### DivisionMember
Fields: id, division_id, user_id, role (string), added_by, created_at. Unique constraint: (division_id, user_id).

#### Project
Fields: id, org_id, division_id, name, description, key (unique per org), status (ProjectStatus), visibility (ProjectVisibility), color, icon, workflow_config_id, owner_id, start_date, due_date, custom_fields (JSON), settings (JSON), created_by, created_at, updated_at, deleted_at.

#### Task
Fields: id, org_id, project_id, parent_task_id (subtask relation), seq_number (unique per project), title, description, status_id, status_name, priority (TaskPriority), type (default "task"), assignee_id, reporter_id, due_date, start_date, estimated_hours (Decimal), logged_hours (Decimal), position (Decimal), tags (String[]), custom_fields (JSON), attachments (JSON), form_template_id, form_submission_data (JSON), sprint_id, is_archived, completed_at, created_by, created_at, updated_at, deleted_at.

#### Sprint
Fields: id, org_id, project_id, name, goal, status (planned/active/completed), start_date, end_date, created_by, created_at, updated_at.

#### WorkflowConfig
Fields: id, org_id, name, description, is_default, statuses (JSON array of WorkflowStatus), transitions (JSON array of WorkflowTransition), created_by, created_at, updated_at.

#### Comment
Fields: id, org_id, task_id, parent_id (threaded), author_id, body, mentions (String[]), attachments (JSON), is_edited, edited_at, created_at, updated_at, deleted_at.

#### TimeLog
Fields: id, org_id, task_id, user_id, hours (Decimal), description, logged_date, created_at.

#### ActivityLog (Audit)
Fields: id, org_id, actor_id, entity_type, entity_id, action, old_value (JSON), new_value (JSON), diff (JSON), ip_address, user_agent, created_at.

#### Notification
Fields: id, org_id, user_id, type (NotificationType), title, body, entity_type, entity_id, actor_id, is_read, read_at, created_at.

#### Invitation
Fields: id, org_id, email, role (OrgRole), token_hash (unique), invited_by, accepted_at, expires_at, created_at.

#### CustomFieldDefinition
Fields: id, org_id, name, field_key (unique per org), field_type (text/number/date/select/multi-select/checkbox/user), options (JSON), is_required, is_archived, applies_to (task/project), display_order, created_by, created_at, updated_at.

#### CustomRole
Fields: id, org_id, name (unique per org), description, color, permissions (JSON array), is_system, created_by, created_at, updated_at.

#### ExternalUser
Fields: id, org_id, email, first_name, last_name, avatar_url, access_level, permissions (JSON), expires_at, invited_by, invited_at, accepted_at, last_access_at, is_active, created_at, updated_at.

#### Approval
Fields: id, org_id, workflow_id, title, description, content, status, current_step, requested_by, related_task_id, related_project_id, created_at, updated_at.

#### ApprovalStep
Fields: id, approval_id, step_id, step_name, step_order, role, status, parallel, created_at, updated_at.

#### EntityVersion
Fields: id, org_id, entity_type, entity_id, version (unique per entity), data (JSON), changes (JSON), changed_by, change_reason, created_at.

#### Snapshot
Fields: id, org_id, name, description, snapshot_type, data (JSON), created_by, created_at.

#### Export
Fields: id, org_id, name, description, export_type, format, filters (JSON), columns (JSON), status (pending/processing/completed/failed), file_url, file_size, record_count, error_message, requested_by, completed_at, expires_at, created_at, updated_at.

#### AiLog
Fields: id, org_id, user_id, feature, prompt_tokens, completion_tokens, model, entity_type, entity_id, created_at.

#### RefreshToken
Fields: id, user_id, token_hash (unique), org_id, device_info (JSON), expires_at, revoked_at, created_at.

---

## 8. State Management

### Auth Store (`useAuthStore`)
- **Library:** Zustand + `persist` middleware (key: `pm-auth`).
- **State:** `accessToken`, `user`, `currentRole`, `currentDivisionId`.
- **Actions:** `login(token, user, role)`, `logout()`, `setAccessToken(token)`, `setUser(user)`, `switchRole(role, persona?)`, `setDivision(divisionId)`.
- In development (`import.meta.env.DEV === true`), initialises with the Org Admin persona and a dev token automatically.

### Feature Flags Store (`useFeatureFlagsStore`)
- **Library:** Zustand + `persist` middleware (key: `pm-feature-flags`).
- **State:** `features: FeatureFlag[]` — each entry has `key`, `label`, `description`, `category`, `enabledForRoles: OrgRole[]`, `isCore: boolean`.
- **Actions:** `toggleRoleAccess(featureKey, role)`, `isEnabled(featureKey, role)`, `resetToDefaults()`, `setFeatures(features)`.
- Core features (projects, kanban_board, my_tasks) cannot be toggled off.
- `org_admin` role bypasses all flag checks (always returns `true` from `isEnabled`).
- 24 feature flags across categories: Core (3), PM (8), Executive (6), Admin (7).

### Attendance Store (`useAttendanceStore`)
- **Library:** Zustand + `persist` middleware (key: `pm-attendance`).
- **State:** `records: AttendanceRecord[]`, `clockInTime: string | null`, `leaveBalance: Record<userId, LeaveBalance>`.
- **Actions:** `clockIn(userId)`, `clockOut(userId)`, `markLeave(userId, date, leaveType, reason)`, `markWFH(userId, date)`.
- **Selectors:** `getRecord(userId, date)`, `getWeekRecords(userId, weekStart)`, `getMonthRecords(userId, year, month)`, `getTodayStatus(userId)`, `getTeamAttendance(date)`.
- Seeded with 30 days of realistic demo data for all five non-viewer dev personas.
- `partialize` retains only last 90 days on persist.
- Hours computed to nearest 0.25h.

### Theme Store (`themeStore`)
- Manages `dark` / `light` mode toggle; applies `dark` class to `<html>`.

### React Query Cache
- All server data fetched and cached via TanStack React Query.
- Key naming conventions: `['dashboard']`, `['projects', params]`, `['tasks', projectId, params]`, `['kanban', projectId]`, `['myTasks', params]`, `['task', taskId]`, `['sprints', projectId]`, `['members', params]`, `['notifications', params]`, `['okrs', params]`, etc.
- Notifications refetched every 30s (`refetchInterval: 30000`).
- Cache invalidated via `queryClient.invalidateQueries` after mutations.

---

## 9. Development Setup

### Prerequisites

- Node.js 20+ (LTS)
- PostgreSQL 17
- Redis (for BullMQ queues)
- Git

### Database Setup

```sql
CREATE DATABASE project_mgmt;
```

Or use the connection string:
```
DATABASE_URL=postgresql://postgres:123456@localhost:5432/project_mgmt
```

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy      # apply all migrations
node prisma/seed.js            # seed demo data
npm run dev                    # starts on :4000
```

**Backend `.env` (minimum):**
```
DATABASE_URL=postgresql://postgres:123456@localhost:5432/project_mgmt
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
NODE_ENV=development
PORT=4000
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=<your-key>   # for AI features
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev    # starts on :5173
```

**Frontend `.env` (optional):**
```
VITE_API_URL=http://localhost:4000/v1
```

If `VITE_API_URL` is not set, the Axios client defaults to `/v1` (relies on Vite proxy or same-origin deployment).

### Vite Proxy (Development)

To proxy API calls through Vite dev server (avoids CORS), add to `vite.config.ts`:
```ts
server: {
  proxy: {
    '/v1': 'http://localhost:4000'
  }
}
```

### Dev Persona Switching

In development (`import.meta.env.DEV === true`):
1. The frontend auto-authenticates as Org Admin on first load.
2. Use the role pill in the header to switch between the six personas.
3. The Axios client automatically sends `x-dev-user-id: <persona.devUserId>` on every request.
4. The backend auth middleware accepts this header without a JWT when `NODE_ENV=development`.

### Useful Scripts

| Script | Command | Description |
|---|---|---|
| Frontend dev | `npm run dev` | Vite dev server at :5173 |
| Frontend build | `npm run build` | TypeScript check + Vite production build |
| Frontend test | `npm run test` | Vitest unit tests |
| Frontend test:coverage | `npm run test:coverage` | Coverage report |
| Backend dev | `npm run dev` | Nodemon restart on changes |
| Backend test | `npm test` | Jest with coverage |
| DB migrate | `npm run db:migrate` | Apply pending migrations |
| DB seed | `npm run db:seed` | Run seed script |
| DB studio | `npm run db:studio` | Prisma Studio GUI at :5555 |

---

## 10. Testing

### Frontend (Vitest + Testing Library)

- **Config:** `vitest` with `jsdom` environment; setup file at `src/test/setup.ts`.
- **Test files:** `src/test/` directory.
  - `StatCard.test.tsx` — renders stat card with correct values.
  - `ProjectModal.test.tsx` — form submission and validation.
  - `Button.test.tsx` — variant and disabled state rendering.
  - `utils.test.ts` — utility function unit tests.
- **Run:** `npm run test` or `npm run test:watch`.
- **Coverage:** `npm run test:coverage` (v8 provider).

### Backend (Jest + Supertest)

- **Test runner:** Jest 29 with coverage.
- **HTTP testing:** Supertest for integration tests against Express routes.
- **Run:** `npm test` inside `backend/`.

### End-to-End (Playwright)

- **Location:** `./e2e/` at the repository root.
- **Test count:** 81 tests across 7 spec files.
- **Patterns:** Sprint API tests use project-scoped sprint IDs; workflow tests use workflow config IDs.
- **Known patterns:** Dev bypass header used to authenticate E2E test users without UI login.
- **Run:** `npx playwright test` from repo root (ensure both dev servers are running).

---

*End of SPECS.md*
