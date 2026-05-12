# Business Requirements Document (BRD)
## Q-Flow — Enterprise Project Management Platform
### Quality Council of India (QCI)

---

| Field | Details |
|---|---|
| **Document Title** | Business Requirements Document — Q-Flow |
| **Version** | 1.0 |
| **Prepared By** | Quality Council of India — Technology Division |
| **Date** | May 2026 |
| **Status** | Approved for Development |
| **Classification** | Internal — Confidential |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [Business Objectives](#3-business-objectives)
4. [Project Scope](#4-project-scope)
5. [Stakeholders](#5-stakeholders)
6. [User Roles & Access Control](#6-user-roles--access-control)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Business Process Flows](#9-business-process-flows)
10. [Integration Requirements](#10-integration-requirements)
11. [Reporting & Analytics Requirements](#11-reporting--analytics-requirements)
12. [Data Requirements](#12-data-requirements)
13. [Assumptions & Dependencies](#13-assumptions--dependencies)
14. [Constraints](#14-constraints)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Success Criteria & KPIs](#16-success-criteria--kpis)
17. [Glossary](#17-glossary)

---

## 1. Executive Summary

Quality Council of India (QCI) operates across multiple divisions managing a high volume of concurrent government-linked and institutional projects. The existing project tracking is fragmented across spreadsheets, emails, and disconnected tools — leading to visibility gaps, delayed approvals, inconsistent reporting, and lack of governance.

**Q-Flow** is a purpose-built, multi-role SaaS project management platform designed to centralise all project lifecycle activity at QCI — from planning and execution to approvals, reporting, and project closure — within a single governed system accessible to all stakeholders.

This document defines the business requirements that Q-Flow must satisfy to be accepted as fit for purpose.

---

## 2. Business Context & Problem Statement

### 2.1 Current State

| Pain Point | Impact |
|---|---|
| Projects tracked in Excel/email | No real-time visibility; version conflicts; data loss risk |
| No structured approval process | Budget and scope changes approved verbally or via email chains |
| Manual status reporting | PMs spend 3–5 hours/week compiling reports manually |
| No capacity visibility | Resource over-allocation is discovered only when timelines slip |
| Siloed divisional data | Executive leadership cannot get a cross-division portfolio view |
| No audit trail | Compliance reviews require manual evidence gathering |
| No standard workflow | Each division follows different project execution processes |

### 2.2 Trigger for This Initiative

- QCI is scaling its project portfolio from ~40 to 100+ concurrent projects across 5+ divisions
- Regulatory and compliance pressure requires documented audit trails for all project decisions
- Leadership requires real-time dashboards for executive review meetings (monthly Governing Board)
- Existing tools (Excel, Google Sheets) are inadequate for multi-user concurrent editing and governance

---

## 3. Business Objectives

| # | Objective | Measurable Target |
|---|---|---|
| BO-01 | Centralise all project data into a single system | 100% of active projects tracked in Q-Flow within 6 months of go-live |
| BO-02 | Eliminate manual status reporting | PM reporting effort reduced by ≥70% |
| BO-03 | Enforce structured approval workflows | Zero project scope/budget changes without documented approval |
| BO-04 | Provide real-time executive visibility | Board-ready portfolio dashboards available at all times |
| BO-05 | Standardise project execution across divisions | All divisions using common workflow templates |
| BO-06 | Enable compliance-ready audit trails | All decisions, changes, and approvals logged with timestamp and actor |
| BO-07 | Reduce project overruns | On-time delivery rate improved by ≥20% within 12 months |

---

## 4. Project Scope

### 4.1 In Scope

- **User Management** — org-level and division-level user administration, role assignment, invitations
- **Project Lifecycle Management** — project creation, planning, execution, monitoring, closure
- **Task Management** — task creation, assignment, status tracking, priorities, dependencies
- **Sprint / Agile Management** — sprint planning, backlog management, velocity tracking
- **Kanban Board** — visual task boards configurable per project workflow
- **Time Logging** — member-level time tracking against tasks and projects
- **Approval Workflows** — multi-step configurable approval chains for budget, scope, and milestone decisions
- **Division Management** — hierarchical division structure with separate configurations
- **Custom Roles & Permissions** — role-based access control down to feature level
- **Financial Tracking** — project budget, actuals, variance, and cost forecasting
- **Resource Management** — capacity planning, allocation tracking, utilisation reports
- **OKR Management** — Objectives and Key Results linked to projects and divisions
- **Portfolio Management** — cross-project executive views, risk aggregation, milestone tracking
- **MIS Reports** — Management Information System reports for compliance and governance
- **Notifications** — in-app and email notifications for tasks, approvals, deadlines
- **Audit Log** — tamper-evident log of all system actions
- **Email OTP Verification** — secure email verification on registration
- **Calendar View** — task and milestone calendar across projects
- **Gantt Chart** — project timeline visualisation
- **Exports** — PDF and CSV export for reports and dashboards
- **Microsoft 365 Integration** — Outlook calendar sync
- **AI Features** — AI-assisted task generation and project insights
- **Governance Module** — workflow governance, SLA monitoring, compliance dashboards
- **Training Guide** — in-app role-based usage guide for all user types

### 4.2 Out of Scope (v1.0)

- Native mobile applications (iOS / Android)
- ERP or SAP integration
- Payroll or HR system integration
- Video conferencing integration
- Public-facing project status portal
- Multi-language / i18n support (English only in v1.0)

---

## 5. Stakeholders

| Stakeholder | Role | Involvement |
|---|---|---|
| **Director General, QCI** | Executive Sponsor | Final approval; monthly review |
| **Division Heads** | Primary Decision Makers | Approve scope, monitor division projects |
| **IT / Technology Division** | System Owner | Platform ownership, deployment, integrations |
| **Project Managers** | Primary Users | Daily project execution, reporting |
| **Project Members / Staff** | End Users | Task execution, time logging |
| **Finance Team** | Secondary Users | Budget approvals, financial reports |
| **Compliance / Audit Team** | Secondary Users | Audit log access, MIS reports |
| **External Consultants** | External Users | Limited access to assigned projects |
| **QCI Governing Board** | Viewers | Executive dashboards, portfolio view |

---

## 6. User Roles & Access Control

### 6.1 Role Definitions

| Role | Description | Access Level |
|---|---|---|
| **org_admin** | Organisation administrator — full system access | All modules, all divisions, system configuration |
| **division_admin** | Division head / manager — full access within division | All projects and users within their division |
| **project_manager** | Manages one or more projects | Full access to assigned projects; create tasks, manage sprints, submit approvals |
| **member** | Project team member | View and update assigned tasks; log time; view project progress |
| **viewer** | Read-only stakeholder | View project status, dashboards, and reports; no edit access |
| **executive** | Senior leadership | Cross-organisation dashboards, OKRs, portfolio view, financial summaries |

### 6.2 Permission Matrix (Summary)

| Feature | org_admin | division_admin | project_manager | member | viewer | executive |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Create / delete users | ✅ | ✅ (division) | ❌ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage tasks | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ | ❌ |
| Approve requests | ✅ | ✅ | ✅ (step 1) | ❌ | ❌ | ✅ (step 2) |
| Log time | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View financial data | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| System configuration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit log access | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Executive dashboards | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 7. Functional Requirements

### 7.1 Authentication & User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | Users shall register with email, name, and password | Must Have |
| FR-AUTH-02 | Email OTP verification required before account activation | Must Have |
| FR-AUTH-03 | Password must meet strength requirements (min 8 chars, uppercase, digit, special char) | Must Have |
| FR-AUTH-04 | Show/hide password toggle on all password fields | Must Have |
| FR-AUTH-05 | JWT-based session management with 15-minute access tokens and 7-day refresh tokens | Must Have |
| FR-AUTH-06 | Forgot password / reset password via email link | Must Have |
| FR-AUTH-07 | Invitation-based onboarding — org admin invites users via email | Must Have |
| FR-AUTH-08 | Microsoft 365 / Azure AD SSO | Should Have |
| FR-AUTH-09 | Role switching for admin users (view system as different roles) | Should Have |
| FR-AUTH-10 | Rate limiting on authentication endpoints (10 attempts per 15 minutes per IP) | Must Have |

### 7.2 Project Management

| ID | Requirement | Priority |
|---|---|---|
| FR-PROJ-01 | Create projects with name, key, description, division, start date, due date, and colour | Must Have |
| FR-PROJ-02 | Assign project manager and team members to projects | Must Have |
| FR-PROJ-03 | Project status lifecycle: Draft → Active → On Hold → Completed → Closed | Must Have |
| FR-PROJ-04 | Configurable workflow templates per project (Kanban, Agile, Simple, Approval-Gated) | Must Have |
| FR-PROJ-05 | Project-level custom fields | Should Have |
| FR-PROJ-06 | Project key must be unique within the organisation | Must Have |
| FR-PROJ-07 | Soft-delete projects (data retained for audit) | Must Have |
| FR-PROJ-08 | Project versioning — track changes to project scope, dates, budget | Should Have |
| FR-PROJ-09 | Formal project closure process with checklist and sign-off | Must Have |
| FR-PROJ-10 | External user access — invite consultants with limited scoped access | Should Have |

### 7.3 Task Management

| ID | Requirement | Priority |
|---|---|---|
| FR-TASK-01 | Create tasks with title, description, assignee, priority, due date, story points, tags | Must Have |
| FR-TASK-02 | Task status workflow configurable per project (e.g. To Do → In Progress → In Review → Done) | Must Have |
| FR-TASK-03 | Task types: Story, Bug, Task, Epic, Sub-task | Must Have |
| FR-TASK-04 | Assign multiple team members to a single task | Should Have |
| FR-TASK-05 | Task comments with threaded replies and mentions | Must Have |
| FR-TASK-06 | File attachments on tasks | Should Have |
| FR-TASK-07 | Task dependencies (blocked by / blocking) | Should Have |
| FR-TASK-08 | Bulk task operations (status change, reassign, delete) | Should Have |
| FR-TASK-09 | Task templates for repeating work | Nice to Have |
| FR-TASK-10 | "My Tasks" view — personalised cross-project task list for each user | Must Have |

### 7.4 Sprint & Agile Management

| ID | Requirement | Priority |
|---|---|---|
| FR-SPRINT-01 | Create sprints with name, goal, start date, and end date | Must Have |
| FR-SPRINT-02 | Sprint backlog — add/remove tasks from sprint | Must Have |
| FR-SPRINT-03 | Start, complete, and cancel sprints | Must Have |
| FR-SPRINT-04 | Velocity tracking across sprints | Must Have |
| FR-SPRINT-05 | Burndown chart per sprint | Must Have |
| FR-SPRINT-06 | Sprint retrospective notes | Should Have |
| FR-SPRINT-07 | Carry-over incomplete tasks to next sprint | Must Have |

### 7.5 Kanban Board

| ID | Requirement | Priority |
|---|---|---|
| FR-KANBAN-01 | Visual column-based board per project | Must Have |
| FR-KANBAN-02 | Drag-and-drop task cards between columns | Must Have |
| FR-KANBAN-03 | WIP (Work In Progress) limits per column | Should Have |
| FR-KANBAN-04 | Filter cards by assignee, priority, label | Must Have |
| FR-KANBAN-05 | Quick-edit task details from board card | Must Have |

### 7.6 Time Logging

| ID | Requirement | Priority |
|---|---|---|
| FR-TIME-01 | Members log time against tasks in hours | Must Have |
| FR-TIME-02 | Time log entries include date, duration, and optional notes | Must Have |
| FR-TIME-03 | Weekly timesheet view per user | Must Have |
| FR-TIME-04 | PM and admin can view all time logs per project | Must Have |
| FR-TIME-05 | Time log reports exportable to CSV | Must Have |
| FR-TIME-06 | Billable vs non-billable time classification | Should Have |

### 7.7 Approval Workflows

| ID | Requirement | Priority |
|---|---|---|
| FR-APPR-01 | Create approval requests linked to projects or tasks | Must Have |
| FR-APPR-02 | Configurable multi-step approval chains (PM → Division Admin → Executive) | Must Have |
| FR-APPR-03 | Approval types: Budget revision, Scope change, Milestone sign-off, Vendor change | Must Have |
| FR-APPR-04 | Approvers can Approve, Reject, or Send Back to previous step | Must Have |
| FR-APPR-05 | SLA tracking per approval step with visual indicators (on-track, at-risk, overdue) | Must Have |
| FR-APPR-06 | Approval delegation — assign to another approver with reason and audit trail | Should Have |
| FR-APPR-07 | Email notifications to approvers when action is required | Must Have |
| FR-APPR-08 | Cost-based conditional routing — items above threshold auto-route to executive | Should Have |
| FR-APPR-09 | All approval decisions permanently recorded in audit trail | Must Have |

### 7.8 Division Management

| ID | Requirement | Priority |
|---|---|---|
| FR-DIV-01 | Hierarchical division structure (parent and child divisions) | Must Have |
| FR-DIV-02 | Division-level budget allocation and tracking | Must Have |
| FR-DIV-03 | Division admin can manage users and projects within their division | Must Have |
| FR-DIV-04 | Division-specific configuration (working days, holidays, capacity) | Should Have |
| FR-DIV-05 | Cross-division project support | Should Have |

### 7.9 Financial Management

| ID | Requirement | Priority |
|---|---|---|
| FR-FIN-01 | Set project budget at creation | Must Have |
| FR-FIN-02 | Track actual spend against budget | Must Have |
| FR-FIN-03 | Budget variance alerts when spend exceeds threshold | Must Have |
| FR-FIN-04 | Financial summary dashboard per division and organisation | Must Have |
| FR-FIN-05 | Cost forecasting based on current burn rate | Should Have |
| FR-FIN-06 | Financial reports exportable to PDF/CSV | Must Have |

### 7.10 Resource Management

| ID | Requirement | Priority |
|---|---|---|
| FR-RES-01 | View capacity and utilisation per team member | Must Have |
| FR-RES-02 | Flag over-allocated resources | Must Have |
| FR-RES-03 | Capacity planning for upcoming sprints | Should Have |
| FR-RES-04 | Resource allocation by division | Should Have |

### 7.11 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-NOTIF-01 | In-app notifications for task assignments, comments, approvals, deadlines | Must Have |
| FR-NOTIF-02 | Email notifications for approval requests and overdue tasks | Must Have |
| FR-NOTIF-03 | Notification preferences per user | Should Have |
| FR-NOTIF-04 | Scheduled email reports (daily/weekly/monthly) in PDF or HTML format | Must Have |
| FR-NOTIF-05 | Notification bell with unread count in header | Must Have |

### 7.12 Dashboard & Reporting

| ID | Requirement | Priority |
|---|---|---|
| FR-DASH-01 | Role-specific home dashboard (member, PM, admin, executive) | Must Have |
| FR-DASH-02 | KPI cards: active projects, overdue tasks, open approvals, team utilisation | Must Have |
| FR-DASH-03 | Recent activity feed with formatted change descriptions | Must Have |
| FR-DASH-04 | Custom dashboard builder — add/remove/resize widgets | Must Have |
| FR-DASH-05 | Advanced reports: burndown, velocity, Monte Carlo simulation | Should Have |
| FR-DASH-06 | MIS reports for management and compliance | Must Have |
| FR-DASH-07 | Executive portfolio dashboard — cross-division project health | Must Have |
| FR-DASH-08 | Scheduled email reports with format selection (PDF / Inline HTML / Both) | Must Have |

### 7.13 Audit Log

| ID | Requirement | Priority |
|---|---|---|
| FR-AUDIT-01 | All create, update, and delete actions logged with actor, timestamp, and change details | Must Have |
| FR-AUDIT-02 | Audit log is read-only — no deletion or modification allowed | Must Have |
| FR-AUDIT-03 | Filter audit log by user, action type, date range, and entity | Must Have |
| FR-AUDIT-04 | Audit log exportable for compliance review | Must Have |

### 7.14 OKR Management

| ID | Requirement | Priority |
|---|---|---|
| FR-OKR-01 | Create Objectives with measurable Key Results | Must Have |
| FR-OKR-02 | Link Key Results to specific projects | Must Have |
| FR-OKR-03 | OKR progress tracking (% completion) | Must Have |
| FR-OKR-04 | OKR dashboard per division and organisation | Must Have |

### 7.15 Portfolio Management

| ID | Requirement | Priority |
|---|---|---|
| FR-PORT-01 | Cross-project milestone tracking | Must Have |
| FR-PORT-02 | Portfolio risk register | Must Have |
| FR-PORT-03 | Project health indicators (RAG status) | Must Have |
| FR-PORT-04 | Executive summary view for Governing Board meetings | Must Have |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-01 | Page load time ≤ 2 seconds for 95th percentile under normal load |
| NFR-PERF-02 | API response time ≤ 500ms for 95th percentile |
| NFR-PERF-03 | System must support 500 concurrent active users without degradation |
| NFR-PERF-04 | Dashboard queries must complete in ≤ 3 seconds |

### 8.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | All data in transit encrypted via TLS 1.2+ |
| NFR-SEC-02 | Passwords stored as bcrypt hashes (cost factor ≥ 12) |
| NFR-SEC-03 | JWT tokens expire after 15 minutes; refresh tokens after 7 days |
| NFR-SEC-04 | Rate limiting on all API endpoints (300 req/min global; 10/15min on auth) |
| NFR-SEC-05 | OWASP Top 10 vulnerabilities must be addressed (XSS, SQLi, CSRF, etc.) |
| NFR-SEC-06 | Email OTP verification required for new account activation |
| NFR-SEC-07 | Role-based access enforced server-side on every API request |
| NFR-SEC-08 | HTTP security headers (HSTS, CSP, X-Frame-Options) enforced in production |
| NFR-SEC-09 | All sensitive environment variables stored in secrets manager (never in codebase) |

### 8.3 Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-AVAIL-01 | System availability ≥ 99.5% (excluding planned maintenance) |
| NFR-AVAIL-02 | Planned maintenance windows communicated ≥ 48 hours in advance |
| NFR-AVAIL-03 | Automated database backups — daily with 30-day retention |
| NFR-AVAIL-04 | Recovery Time Objective (RTO): ≤ 4 hours |
| NFR-AVAIL-05 | Recovery Point Objective (RPO): ≤ 24 hours |

### 8.4 Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-01 | System must scale to 2,000 registered users within 2 years |
| NFR-SCALE-02 | Database must support 500+ concurrent projects and 10,000+ tasks |
| NFR-SCALE-03 | Architecture must support horizontal scaling of API layer |

### 8.5 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | System must be fully usable on desktop browsers (Chrome, Firefox, Edge) |
| NFR-UX-02 | Responsive design — functional on tablets (768px+) |
| NFR-UX-03 | New users must be able to complete core tasks without training (intuitive UX) |
| NFR-UX-04 | In-app training guide available for all roles |
| NFR-UX-05 | Dark mode support |

### 8.6 Maintainability

| ID | Requirement |
|---|---|
| NFR-MAINT-01 | Codebase follows documented coding standards |
| NFR-MAINT-02 | Database schema migrations version-controlled |
| NFR-MAINT-03 | API versioned (current: v1) to support backward-compatible changes |
| NFR-MAINT-04 | Environment-specific configuration via environment variables only |

---

## 9. Business Process Flows

### 9.1 Project Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DRAFT     │───►│   ACTIVE    │───►│  ON HOLD    │───►│  COMPLETED  │───►│   CLOSED    │
│             │    │             │    │  (optional) │    │             │    │             │
│ PM creates  │    │ Work begins │    │ Paused by   │    │ Deliverables│    │ Formal sign-│
│ project     │    │ Sprints run │    │ admin       │    │ delivered   │    │ off done    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 9.2 Approval Workflow

```
PM submits approval request
        │
        ▼
Step 1: Division Review (Division Admin)
   ├── Approve ──► Step 2: Executive Approval
   ├── Send Back ──► PM revises and resubmits
   └── Reject ──► Request closed (REJECTED)
        │
        ▼
Step 2: Executive Approval (Executive role)
   ├── Approve ──► Request APPROVED, PM notified
   ├── Send Back ──► Returns to Division Admin
   └── Reject ──► Request closed (REJECTED)
```

### 9.3 User Onboarding

```
Org Admin sends invitation email
        │
        ▼
User receives email with invite link
        │
        ▼
User clicks link → Invite Accept page
        │
        ▼
User sets password (strength validated)
        │
        ▼
OTP sent to email → User enters 6-digit code
        │
        ▼
Account activated → Redirected to Dashboard
```

### 9.4 Sprint Execution

```
PM creates sprint (name, goal, dates)
        │
        ▼
PM adds tasks from backlog to sprint
        │
        ▼
PM starts sprint → Status: ACTIVE
        │
        ▼
Members work on tasks (In Progress → Done)
        │
        ▼
PM completes sprint → Incomplete tasks offered for carry-over
        │
        ▼
Velocity recorded → Sprint retrospective
```

---

## 10. Integration Requirements

| # | System | Integration Type | Purpose | Priority |
|---|---|---|---|---|
| INT-01 | Microsoft 365 / Outlook | OAuth + Graph API | Calendar sync, meeting creation, SSO | Should Have |
| INT-02 | SMTP (neumails / qci.org.in) | SMTP (port 587) | Email notifications, OTP, scheduled reports | Must Have |
| INT-03 | Supabase (PostgreSQL) | Prisma ORM | Primary database | Must Have |
| INT-04 | Anthropic Claude AI | REST API | AI task generation, project insights | Nice to Have |
| INT-05 | PDF generation | html2canvas + jsPDF | Export reports and dashboards as PDF | Should Have |

---

## 11. Reporting & Analytics Requirements

| Report | Audience | Frequency | Format |
|---|---|---|---|
| Project Status Summary | PM, Division Admin | Real-time | Dashboard + PDF |
| Sprint Velocity & Burndown | PM, Team | Per sprint | Charts |
| Resource Utilisation | Division Admin, exec | Weekly | Dashboard |
| Financial Summary (Budget vs Actual) | Finance, Executive | Monthly | Dashboard + CSV |
| OKR Progress | Executive, Division Admin | Quarterly | Dashboard |
| Portfolio Health (RAG) | Executive, Board | Monthly | Dashboard + PDF |
| Audit Log | Compliance, org_admin | On demand | Filterable log + CSV |
| MIS Report | Management | Monthly | PDF + CSV |
| Scheduled Email Reports | Any user | Daily/Weekly/Monthly | PDF attachment or Inline HTML |
| Time Log Summary | PM, Admin | Weekly/Monthly | CSV |

---

## 12. Data Requirements

### 12.1 Core Entities

| Entity | Key Attributes |
|---|---|
| **Organisation** | id, name, slug, plan, settings, isActive |
| **User** | id, email, firstName, lastName, passwordHash, role, status, emailVerifiedAt |
| **Division** | id, name, code, parentId, managerId, budget, headCount |
| **Project** | id, name, key, divisionId, status, startDate, dueDate, budget, workflowConfigId |
| **Task** | id, projectId, title, status, priority, assigneeId, sprintId, storyPoints, dueDate |
| **Sprint** | id, projectId, name, goal, status, startDate, endDate, velocity |
| **TimeLog** | id, taskId, userId, hours, date, description, billable |
| **ApprovalRequest** | id, projectId, workflowId, title, status, requestedBy, currentStep |
| **ActivityLog** | id, userId, action, entityType, entityId, oldValue, newValue |
| **EmailOtp** | id, email, codeHash, purpose, expiresAt, usedAt |
| **Notification** | id, userId, type, title, message, isRead |

### 12.2 Data Retention

| Data Type | Retention Period |
|---|---|
| Active project data | Indefinite while project is active |
| Closed project data | Minimum 7 years (compliance requirement) |
| Audit logs | Minimum 7 years |
| Time logs | Minimum 3 years |
| Email OTPs | 30 minutes (auto-expired) |
| Deleted user accounts | 90 days (soft delete), then anonymised |

### 12.3 Data Residency

All data shall be stored within the Supabase managed PostgreSQL instance. The selected region is ap-northeast-1 (Tokyo). QCI shall maintain the right to migrate to an Indian data centre if regulatory requirements change.

---

## 13. Assumptions & Dependencies

| # | Assumption / Dependency |
|---|---|
| A-01 | All QCI staff have a valid work email address for account creation |
| A-02 | Internet access is available at all QCI offices |
| A-03 | Users will access the system via modern web browsers (Chrome 90+, Edge 90+, Firefox 88+) |
| A-04 | QCI has an active Microsoft 365 subscription for SSO integration |
| A-05 | SMTP credentials (smtp.neumails.com) remain valid and have sufficient sending quota |
| A-06 | Supabase free tier is sufficient for the pilot phase; upgrade required at scale |
| A-07 | Division structure and reporting hierarchy will be provided by QCI HR before go-live |
| A-08 | At least one org_admin will be designated and trained before system launch |
| D-01 | **Dependency**: Supabase PostgreSQL database must remain active (auto-pause disabled for production) |
| D-02 | **Dependency**: Vercel deployment platform must maintain uptime for both frontend and backend |
| D-03 | **Dependency**: GitHub repository must remain accessible for CI/CD deployments |

---

## 14. Constraints

| # | Constraint |
|---|---|
| C-01 | System must be deployable without on-premise infrastructure (cloud-only) |
| C-02 | Frontend must work without a native app — browser-only for v1.0 |
| C-03 | All user-facing text must be in English for v1.0 |
| C-04 | Budget for v1.0 infrastructure limited to free/startup tiers of Vercel and Supabase |
| C-05 | Backend deployed as serverless functions on Vercel — no persistent background processes (Redis/queues not available in production serverless) |
| C-06 | Socket.IO real-time features are limited in serverless deployment — polling fallback required |
| C-07 | Supabase free tier pauses after 1 week of inactivity — production upgrade required before go-live |

---

## 15. Risks & Mitigations

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Low adoption due to change resistance | Medium | High | Change management plan; training sessions; champion users per division |
| R-02 | Data migration from Excel introduces errors | Medium | High | Pilot import with 2–3 projects; validate before bulk migration |
| R-03 | Supabase free tier pauses — production downtime | High | High | Upgrade to Supabase Pro ($25/month) before go-live |
| R-04 | Serverless cold starts cause slow API responses | Medium | Medium | Upgrade to Vercel Pro; consider Render/Railway for warm containers |
| R-05 | SMTP email delivery failures | Low | Medium | Monitor bounce rates; configure SPF/DKIM for qci.org.in domain |
| R-06 | Scope creep post-launch | High | Medium | Strict change request process; version roadmap maintained |
| R-07 | Security breach due to exposed credentials | Low | Critical | Secrets in environment variables only; regular rotation policy |
| R-08 | Supabase region (ap-northeast-1/Tokyo) latency for Indian users | Low | Low | Monitor p95 latency; migrate to ap-south-1 if >500ms observed |

---

## 16. Success Criteria & KPIs

### 16.1 Go-Live Acceptance Criteria

- [ ] All 6 user roles can log in and access their respective dashboards
- [ ] Project CRUD operations work end-to-end
- [ ] Task creation, assignment, and status updates work
- [ ] At least one approval workflow completes successfully (submit → review → approve)
- [ ] Email notifications deliver successfully for OTP, invitations, and approvals
- [ ] Audit log records all create/update/delete actions
- [ ] PDF and CSV exports functional
- [ ] Response time ≤ 2s for dashboard load on production URL

### 16.2 Post-Launch KPIs (6 months)

| KPI | Target |
|---|---|
| Active users (monthly) | ≥ 80% of invited users |
| Projects tracked in Q-Flow | 100% of active QCI projects |
| PM time on manual reporting | Reduced by ≥ 70% |
| Approval turnaround time | ≤ 48 hours per step (vs. days by email) |
| On-time task completion rate | Improved by ≥ 15% |
| System uptime | ≥ 99.5% |
| User satisfaction score | ≥ 4/5 in post-launch survey |

---

## 17. Glossary

| Term | Definition |
|---|---|
| **BRD** | Business Requirements Document — formal specification of what a system must do |
| **OKR** | Objectives and Key Results — goal-setting framework linking strategy to execution |
| **MIS** | Management Information System — structured reports for management decision-making |
| **Sprint** | A time-boxed iteration (typically 2 weeks) in Agile methodology |
| **Backlog** | A prioritised list of tasks/stories not yet in a sprint |
| **Kanban** | A visual workflow management method using columns and cards |
| **WIP Limit** | Work In Progress limit — maximum tasks allowed in a column simultaneously |
| **RAG Status** | Red / Amber / Green — project health indicator |
| **SLA** | Service Level Agreement — defined time within which an action must be completed |
| **JWT** | JSON Web Token — standard for securely transmitting authentication information |
| **OTP** | One-Time Password — time-limited code for email verification |
| **CRUD** | Create, Read, Update, Delete — basic data operations |
| **SSO** | Single Sign-On — authentication via a trusted identity provider (e.g. Microsoft 365) |
| **CSP** | Content Security Policy — HTTP header that restricts resource loading to prevent XSS |
| **HSTS** | HTTP Strict Transport Security — enforces HTTPS connections |
| **RTO** | Recovery Time Objective — maximum acceptable system downtime after a failure |
| **RPO** | Recovery Point Objective — maximum acceptable data loss measured in time |
| **Q-Flow** | The name of QCI's internal project management platform |

---

*Document ends.*

*For change requests to this BRD, contact the Technology Division, Quality Council of India.*
*Document is subject to version control — all amendments require sign-off from the Project Sponsor.*
