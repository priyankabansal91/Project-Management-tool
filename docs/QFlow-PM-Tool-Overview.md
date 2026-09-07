# Q-Flow Project Management Tool — Complete Overview

**Organisation:** Quality Council of India (QCI)  
**Product Name:** Q-Flow  
**Current Branch:** `claude/saas-project-management-design-BsbSY`  
**Status:** Live in Production (Vercel)

---

## 1. What We Have Built

### 1.1 Application Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, React Router v6 |
| State | Zustand (5 stores) |
| UI | Radix UI primitives + Tailwind CSS + shadcn/ui |
| Data Fetching | TanStack Query + Axios |
| Backend | Node.js + Express 5 |
| ORM | Prisma v5 |
| Database | PostgreSQL 17 (Neon.tech cloud) |
| Auth | JWT (8h access + 7d refresh HttpOnly cookie) |
| Deployment | Vercel (serverless, both frontend & backend) |
| Charts | Recharts |
| Icons | Lucide React |

---

### 1.2 Organisation Hierarchy

```
Organisation
  └── Division (e.g., IT, HR, Finance)
        └── Vertical (streams within a division)
              └── Project
                    └── Milestone
                          └── Task → Subtask
```

---

### 1.3 User Roles

| Role | Description |
|------|-------------|
| `org_admin` | Full platform control |
| `division_admin` | HOD — manages a division |
| `vertical_head` | Manages a vertical/stream |
| `project_manager` | Leads a project |
| `team_lead` | Leads a team within a project |
| `member` | Project team member |
| `viewer` | Read-only access |
| `executive` | Leadership dashboards only |

---

### 1.4 Screens / Pages Built (66 total)

#### Authentication (5)
- Login, Register, Forgot Password, Reset Password, Verify Email
- Microsoft OAuth callback

#### Core Navigation (5)
- Dashboard (role-aware widgets)
- My Tasks (personal task inbox)
- Task Detail (full task view)
- Profile
- Notifications

#### Project Management (13)
- Project List
- Kanban Board (drag-and-drop task board)
- Milestones Page (waterfall-style with budget, expense heads)
- Milestone Detail
- Milestones Overview (cross-project)
- Calendar View (task calendar with task modal)
- Gantt Chart
- Sprint Management (backlog, sprint board)
- Time Logging
- Project Tracking
- Team / User Management (in context)

#### Executive / Leadership (7)
- Executive Dashboard
- Resource Dashboard (capacity planning)
- Financial Dashboard (budget, ROI, cost)
- Roadmap
- Status Reports
- Risk Register
- Portfolio Dashboard

#### Reports & Analytics (3)
- Standard Reports
- Advanced Reports
- Capacity Planning

#### Governance (2)
- Governance Dashboard
- Project Closure Workflow

#### Workflow Management (3)
- Workflow Monitoring
- Workflow Governance
- Workflow Training

#### Admin & Configuration (24+)
- User Management
- Workflows (create/edit workflow templates)
- Custom Fields
- Issue Types
- Task Templates
- Audit Log
- Admin Dashboard
- Divisions Manager
- Hierarchy View
- Division Configuration (modules + features + permissions + workflow + members per division)
- Admin Handoff
- Custom Roles
- External Users / Guests
- Versioning
- Data Exports
- Approvals Inbox
- Forms / Intake
- Feature Flags
- Onboarding Wizard
- Division MIS Reports
- Verticals Management
- Permission Matrix
- Stage Templates
- Sidebar Config

#### Settings & Integrations
- Org Settings
- Microsoft Outlook Integration

#### AI
- AI Features Page (Claude-powered task generation & reports)

#### Invite Flow
- Invite Accept
- Accept Invite Redirect

---

### 1.5 Backend API Surface (32 route files)

| Category | Routes |
|----------|--------|
| Auth | `/v1/auth` — login, register, refresh, logout, OTP |
| Projects | `/v1/projects` — CRUD, phases, members |
| Tasks | `/v1/tasks` — CRUD, comments, dependencies, subtasks |
| Milestones | `/v1/projects/:id/milestones` |
| Sprints | `/v1/sprints` |
| Time Tracking | `/v1/time-logs` |
| Members | `/v1/members` |
| Divisions | `/v1/divisions`, `/v1/division-config` |
| Verticals | `/v1/verticals` |
| Workflows | `/v1/workflows`, `/v1/approvals` |
| Approval Groups | `/v1/approvals/groups` |
| Forms | `/v1/forms` |
| Dashboard | `/v1/dashboard`, `/v1/dashboard/v2` |
| Executive | `/v1/executive`, `/v1/portfolio` |
| Financial | `/v1/financial` |
| Resources | `/v1/resources` |
| OKRs | `/v1/okrs` |
| MIS | `/v1/mis` |
| Notifications | `/v1/notifications` |
| Search | `/v1/search` |
| Audit Log | `/v1/audit-logs` |
| Exports | `/v1/exports` |
| Versioning | `/v1/versioning` |
| Custom Roles | `/v1/roles` |
| External Users | `/v1/external-users` |
| AI | `/v1/ai` |
| Stage Templates | `/v1/stage-templates` |
| Integrations | `/v1/integrations/outlook` |

---

### 1.6 Database Models (35+ Prisma models)

- **User**, OrgMember, RefreshToken, Invitation, EmailOtp
- **Organisation** — multi-tenant with plan tiers
- **Division**, Vertical, DivisionMember, DivisionLifecycle
- **Project**, ProjectMember, ProjectPhase, ProjectStatus
- **Task**, SubTask, TaskDependency, TaskPriority, Comment
- **Milestone**, MilestoneWaterfallStatus
- **Sprint**
- **StageTemplate**, SubstageTemplate
- **WorkflowConfig**, Approval, ApprovalStep, ApprovalRecord
- **TimeLog**, ActivityLog, AuditLog
- **CustomRole**, CustomRoleMember, CustomFieldDefinition
- **Notification**, EntityVersion, Snapshot
- **Export**, AiLog
- **ExternalUser**, GuestAccess, UserIntegration

---

### 1.7 Key Features Implemented

| Feature | Status |
|---------|--------|
| Multi-role RBAC | ✅ Done |
| Division-aware configuration | ✅ Done |
| Project + Task CRUD | ✅ Done |
| Kanban Board | ✅ Done |
| Gantt Chart | ✅ Done |
| Sprint / Agile module | ✅ Done |
| Waterfall Milestones | ✅ Done |
| Milestone budgets + expense heads | ✅ Done |
| Time Tracking | ✅ Done |
| Multi-step Approval Workflows | ✅ Done |
| Group Approvals | ✅ Done |
| Pre-Project Workflow (intake → approval) | ✅ Done |
| Project Closure Workflow | ✅ Done |
| Executive Dashboard | ✅ Done |
| Financial Dashboard (budget, ROI) | ✅ Done |
| Portfolio Dashboard | ✅ Done |
| Risk Register | ✅ Done |
| OKR Tracking | ✅ Done |
| MIS Reports | ✅ Done |
| Capacity Planning | ✅ Done |
| Division MIS | ✅ Done |
| Audit Log | ✅ Done |
| Entity Versioning | ✅ Done |
| Custom Fields | ✅ Done |
| Custom Roles | ✅ Done |
| Forms / Intake | ✅ Done |
| Data Exports | ✅ Done |
| External Users / Guest Access | ✅ Done |
| Notifications (in-app) | ✅ Done |
| Global Search | ✅ Done |
| Microsoft Outlook Integration | ✅ Done |
| AI Features (Claude) | ✅ Done |
| Dark Mode | ✅ Done |
| Stage Templates | ✅ Done |
| Sidebar Configurator | ✅ Done |
| Feature Flags | ✅ Done |
| Onboarding Wizard | ✅ Done |
| JWT Auth (8h token, 7d refresh) | ✅ Done |
| Dev bypass (x-dev-user-id header) | ✅ Done |
| Vercel production deployment | ✅ Done |

---

## 2. What Can Be Added Further (Roadmap Ideas)

### 2.1 High Priority — Core Gaps

| Feature | Description |
|---------|-------------|
| **Email Notifications** | Currently in-app only. Add SMTP/SendGrid email for task assignments, approvals, deadlines |
| **Real-time Collaboration** | WebSocket / Pusher for live task updates, presence indicators |
| **File Attachments** | S3/Vercel Blob storage for task file uploads, document versioning |
| **Mobile App** | React Native or PWA — current app is desktop-first |
| **Recurring Tasks** | Set tasks to repeat daily/weekly/monthly |
| **Comment Mentions (@user)** | Tag users in comments with notification trigger |
| **Task Dependencies (UI)** | Dependencies exist in DB but need a visual dependency graph |

### 2.2 IT-Specific Features (for the IT Branch)

| Feature | Description |
|---------|-------------|
| **Change Management (CAB)** | Change Advisory Board workflow — RFC → Impact Assessment → CAB Approval → Implementation → PIR |
| **Incident Tracking** | Incident → Root Cause → Resolution → CAPA workflow |
| **SLA Management** | Define SLAs per task type, auto-escalation on breach |
| **IT Asset Linking** | Link tasks/projects to IT assets, servers, software |
| **Release / Deployment Pipeline** | Track releases: Dev → SIT → UAT → Prod with sign-off |
| **Helpdesk Ticket Integration** | Link JIRA/ServiceNow tickets to Q-Flow tasks |
| **Downtime Calendar** | Planned maintenance windows |
| **Compliance Checklist** | ISO 27001, STQC, MEITY checklist against each project |
| **Vulnerability Tracking** | VAPT findings → remediation tasks |
| **Environment Labels** | Tag tasks by environment (Dev/SIT/UAT/Prod) |

### 2.3 Advanced Project Features

| Feature | Description |
|---------|-------------|
| **Resource Booking** | Reserve team members for a time block across projects |
| **Skill Matrix** | Map skills to members, surface skill gaps |
| **Budget Actuals vs Planned** | Connect actual expenses to milestones (currently planned only) |
| **Invoice / PO Tracking** | Link financial milestones to purchase orders |
| **Earned Value Management (EVM)** | CPI, SPI, EAC calculations on milestones |
| **Project Health Scoring** | Auto RAG (Red/Amber/Green) based on schedule, budget, risk |
| **Dependency Graph View** | Visual map of cross-project task dependencies |
| **Baseline & Variance** | Freeze a project baseline, track variance over time |

### 2.4 Collaboration & Communication

| Feature | Description |
|---------|-------------|
| **Teams/Slack Integration** | Push notifications to MS Teams channels |
| **Meeting Minutes** | Attach meeting notes to projects with action items |
| **Announcements Board** | Org-wide or division-wide broadcast messages |
| **Document Repository** | Shared docs with version history per project |
| **Discussion Threads** | Project-level discussion boards (beyond task comments) |

### 2.5 Reporting & Intelligence

| Feature | Description |
|---------|-------------|
| **Scheduled Reports** | Auto-email weekly/monthly reports to executives |
| **Custom Report Builder** | Drag-and-drop report designer |
| **Power BI / Tableau Embed** | Embed external BI dashboards |
| **AI Insights** | Predict schedule slippage, flag at-risk projects |
| **Heatmaps** | Team workload heatmap (who is overloaded) |

### 2.6 Platform / Infrastructure

| Feature | Description |
|---------|-------------|
| **SSO / Active Directory** | SAML/OIDC login via NIC LDAP / Microsoft Entra ID |
| **2FA** | TOTP or email OTP for login |
| **Data Residency** | On-premise deployment option (Docker Compose) |
| **API Keys** | External system integration keys for headless use |
| **Webhook Outbound** | Trigger external systems on task/project events |
| **Import from JIRA/Asana** | One-time migration importer |

---

## 3. IT PM Tool — Branch Strategy

### Plan
Create a new branch `feature/it-division-pm` from the current main branch. This branch will:

1. **Lock the UI to IT Division context** — hide multi-division selector, hard-code `div_it`
2. **Enable IT-specific fields** on tasks (environment, ticket ref, release tag)
3. **Add IT workflows** (CAB, incident, release pipeline)
4. **Customise sidebar** — remove HR/Finance modules, surface IT-only modules
5. **Brand it** for IT — different colour scheme, "IT Helpdesk" style labels

### Merge Strategy
- Q-Flow (generic, multi-division) stays on `claude/saas-project-management-design-BsbSY`
- IT tool lives on `feature/it-division-pm`
- Common bug fixes cherry-picked from main → IT branch
- IT-specific code never merges back to main (diverge intentionally)

---

## 4. Current Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://frontend-priyankabansal91s-projects.vercel.app |
| Backend | https://qflow-backend-priyankabansal91s-projects.vercel.app |
| DB | Neon PostgreSQL (project_mgmt) |

---

*Document generated: September 2026*  
*Maintainer: Priyanka Bansal — priyanka.bansal@qcin.org*
