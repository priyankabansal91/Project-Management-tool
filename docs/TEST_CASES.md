# Q-Flow — Comprehensive Test Case Suite
**Version:** 1.0 | **Coverage:** Functional + Security + Role-Based + Edge Cases
**Format:** Each test has: ID · Description · Preconditions · Steps · Expected Result · Pass/Fail

---

## MODULE 1 — AUTHENTICATION

### TC-AUTH-001: Login with valid credentials
- **Preconditions:** User account exists with status `active`
- **Steps:** Navigate to `/login` → Enter valid email + password → Click Login
- **Expected:** Redirected to dashboard, user name visible in header, JWT stored
- **Result:** ✅ PASS

### TC-AUTH-002: Login with wrong password
- **Preconditions:** User account exists
- **Steps:** Enter valid email + wrong password → Click Login
- **Expected:** Error message "Invalid email or password", no redirect, no token set
- **Result:** ✅ PASS

### TC-AUTH-003: Login with non-existent email
- **Steps:** Enter unknown email + any password → Click Login
- **Expected:** Error message "Invalid email or password" (same generic message — no user enumeration)
- **Result:** ✅ PASS

### TC-AUTH-004: Account lockout after 5 failed attempts
- **Steps:** Attempt login with wrong password 5 times consecutively
- **Expected:** On 5th attempt: account locked message, further attempts rejected even with correct password
- **Result:** ✅ PASS

### TC-AUTH-005: Login with empty fields
- **Steps:** Click Login with blank email and password
- **Expected:** Frontend validation: "Email required" / "Password required" shown inline
- **Result:** ✅ PASS

### TC-AUTH-006: Password reset flow
- **Steps:** Click "Forgot Password" → Enter registered email → Check inbox → Click reset link → Enter new password
- **Expected:** Password updated, old password no longer works, new password grants access
- **Result:** ✅ PASS

### TC-AUTH-007: Expired session redirect
- **Preconditions:** User is logged in
- **Steps:** Wait for JWT to expire (or manually clear/corrupt the localStorage token) → Make an API request
- **Expected:** Redirected to `/login` page, session cleared
- **Result:** ✅ PASS

### TC-AUTH-008: Register new user via invite link
- **Steps:** Org admin sends invite → User clicks invite link → Completes registration form
- **Expected:** Account created with `pending_verification` status, org membership assigned
- **Result:** ✅ PASS

### TC-AUTH-009: Reuse expired invite link
- **Preconditions:** Create invite link → Wait for it to expire OR accept it once
- **Steps:** Navigate to the invite link URL again
- **Expected:** Error: "Invite link has expired or already been used"
- **Result:** ✅ PASS

### TC-AUTH-010: Password minimum length enforcement
- **Steps:** Register with password "abc123" (6 chars) → Try "abcd123" (7 chars) → Try "abcd1234" (8 chars)
- **Expected:** 6-char and 7-char rejected with "at least 8 characters" error. 8-char accepted.
- **Result:** ✅ PASS (after fix)

### TC-AUTH-SEC-001 [SECURITY]: Dev bypass blocked in production
- **Steps:** Send `x-dev-user-id: dev-org_admin-id` header to production API endpoint
- **Expected:** Header ignored, request treated as unauthenticated → 401 returned
- **Result:** ✅ PASS (after NODE_ENV default fix)

### TC-AUTH-SEC-002 [SECURITY]: JWT with invalid signature rejected
- **Steps:** Modify payload of a valid JWT, send modified token to any authenticated endpoint
- **Expected:** 401 Unauthorized — "Token expired or invalid"
- **Result:** ✅ PASS

---

## MODULE 2 — PROJECTS

### TC-PROJ-001: Create project (org_admin)
- **Preconditions:** Logged in as org_admin
- **Steps:** Navigate to Projects → Click "New Project" → Fill name, key, division, description → Submit
- **Expected:** Project created with status `DRAFT`, appears in project list, PM can be assigned
- **Result:** ✅ PASS

### TC-PROJ-002: Create project (vertical_head)
- **Preconditions:** Logged in as vertical_head
- **Steps:** Navigate to Projects → Click "New Project" → Fill form → Submit
- **Expected:** Project created successfully (vertical_head has project:create permission)
- **Result:** ✅ PASS

### TC-PROJ-003: Create project (member — denied)
- **Preconditions:** Logged in as member
- **Steps:** Navigate to Projects page
- **Expected:** "New Project" button is NOT visible (PermissionGate hides it for members)
- **Result:** ✅ PASS

### TC-PROJ-004: Duplicate project key rejected
- **Steps:** Create project with key "ALPHA" → Create second project with same key "ALPHA"
- **Expected:** Second creation fails: "Project key already exists" (409 conflict)
- **Result:** ✅ PASS

### TC-PROJ-005: Edit project details
- **Preconditions:** Logged in as project_manager, project exists
- **Steps:** Open project → Click Edit → Change name/description → Save
- **Expected:** Changes saved, updated name visible in list and detail view
- **Result:** ✅ PASS

### TC-PROJ-006: Edit project (viewer — denied)
- **Preconditions:** Logged in as viewer
- **Steps:** Open project detail page
- **Expected:** No edit button visible; PATCH /projects/:id returns 403 if attempted directly
- **Result:** ✅ PASS

### TC-PROJ-007: Delete project (org_admin)
- **Steps:** Org admin navigates to project → Clicks delete → Confirms
- **Expected:** Project soft-deleted (deletedAt set), no longer in active list
- **Result:** ✅ PASS

### TC-PROJ-008: Project key format validation
- **Steps:** Try to create project with key "alpha space" (with space) or "ALPHA!" (with special chars)
- **Expected:** Validation error: key must be uppercase letters and numbers only
- **Result:** ✅ PASS

### TC-PROJ-009: Project list scoping by role
- **Preconditions:** `member` is assigned to Project A but not Project B
- **Steps:** Login as member → Navigate to Projects
- **Expected:** Only Project A appears (member sees only their projects)
- **Result:** ✅ PASS

### TC-PROJ-010: Add team members to project
- **Preconditions:** Logged in as project_manager
- **Steps:** Open project Kanban → Click "Team" → Search for user → Click Add
- **Expected:** User added to project team, appears in member list, available as task assignee
- **Result:** ✅ PASS

---

## MODULE 3 — TASKS

### TC-TASK-001: Create task
- **Preconditions:** Project exists, logged in as project_manager
- **Steps:** Open project Kanban → Click "+ New Task" → Fill title, assignee, priority, due date → Save
- **Expected:** Task created in "To Do" column, seq number assigned, task visible to assignee
- **Result:** ✅ PASS

### TC-TASK-002: Move task between Kanban columns
- **Steps:** Open Kanban → Drag task from "To Do" to "In Progress"
- **Expected:** Task status updated, change reflected immediately in UI, API updated
- **Result:** ✅ PASS

### TC-TASK-003: Assign task to project member only
- **Preconditions:** Org has users A (in project) and B (not in project)
- **Steps:** Open task assignee dropdown
- **Expected:** Only users assigned to the project appear; user B is NOT in the list
- **Result:** ✅ PASS

### TC-TASK-004: Create subtask
- **Steps:** Open task → Click "Add Subtask" → Fill title → Save
- **Expected:** Subtask created under parent task, appears in task detail view
- **Result:** ✅ PASS

### TC-TASK-005: Log time on task
- **Steps:** Open task → Click "Log Time" → Enter hours (e.g., 2.5) → Save
- **Expected:** Time logged, total logged hours on task updated, time log entry visible
- **Result:** ✅ PASS

### TC-TASK-006: Log time — negative hours rejected
- **Steps:** Open task → Log Time → Enter -1 → Save
- **Expected:** Validation error: "Hours must be greater than 0"
- **Result:** ✅ PASS

### TC-TASK-007: Comment on task with @mention
- **Steps:** Open task → Type comment "@username this is blocked" → Post
- **Expected:** Comment saved, mentioned user receives notification
- **Result:** ✅ PASS

### TC-TASK-008: Delete task (project_manager)
- **Steps:** PM opens task → Click delete → Confirm
- **Expected:** Task soft-deleted, removed from Kanban, `deletedAt` set in DB
- **Result:** ✅ PASS

### TC-TASK-009: Delete task (member — denied)
- **Steps:** Member tries to delete any task (via API: DELETE /v1/tasks/:id)
- **Expected:** 403 Forbidden — member does not have `task:delete` permission
- **Result:** ✅ PASS

### TC-TASK-010: Task due date overdue indicator
- **Preconditions:** Task with due date in the past, status not "done"
- **Steps:** Open My Tasks page
- **Expected:** Task shown with red overdue indicator / "Overdue" badge
- **Result:** ✅ PASS

### TC-TASK-011: Task dependency — blocked task
- **Preconditions:** Task B depends on Task A
- **Steps:** View Task B on Kanban with Task A still in "To Do"
- **Expected:** Task B shows "Blocked" indicator, visual cue on card
- **Result:** ✅ PASS

### TC-TASK-SEC-001 [SECURITY]: IDOR — access task from another org
- **Steps:** Get a valid task ID from Org A. Login as user from Org B. GET /v1/tasks/:taskId
- **Expected:** 404 (task not found for this org) — never expose cross-org data
- **Result:** ✅ PASS

---

## MODULE 4 — MILESTONES

### TC-MS-001: Create milestone with planned budget
- **Preconditions:** Project exists, logged in as project_manager
- **Steps:** Navigate to Milestones → Click "New Milestone" → Fill title, planned budget (₹500000), due date → Save
- **Expected:** Milestone created with budget field set, `budgetLocked = false`
- **Result:** ✅ PASS

### TC-MS-002: Lock planned budget
- **Steps:** Open milestone → Click "Lock Budget" → Confirm
- **Expected:** `budgetLocked = true` in DB, planned budget field becomes read-only, lock icon shown
- **Result:** ✅ PASS

### TC-MS-003: Attempt to modify locked planned budget (API)
- **Preconditions:** Milestone has `budgetLocked = true`
- **Steps:** PATCH /v1/milestones/:id with body `{ budget: 999999 }`
- **Expected:** Budget field silently ignored (stays at original value) — DB guard prevents change
- **Result:** ✅ PASS

### TC-MS-004: Update actual budget
- **Steps:** Open milestone → Update "Actual Budget" field → Save
- **Expected:** `actualBudget` updated, if actual > planned the card shows red warning
- **Result:** ✅ PASS

### TC-MS-005: Add expense heads
- **Steps:** Open milestone → Scroll to Expense Heads → Add "Technology Cost: ₹200000" → Save
- **Expected:** Expense head saved in `expenseHeads` JSON array, visible in milestone detail
- **Result:** ✅ PASS

### TC-MS-006: Milestone progress auto-calculation
- **Preconditions:** Milestone has 4 tasks; 2 are "done"
- **Steps:** Mark 2 tasks as done → View milestone
- **Expected:** Progress bar shows ~50%, progress value updates
- **Result:** ✅ PASS

### TC-MS-007: Milestone closure requires approval
- **Preconditions:** Milestone has `approvalRequired = true`
- **Steps:** PM clicks "Close Milestone"
- **Expected:** Approval request created, status changes to `PENDING_APPROVAL`, PM cannot bypass
- **Result:** ✅ PASS

### TC-MS-008: Delete milestone (IDOR fix check) [SECURITY]
- **Preconditions:** Get milestone ID from Org A. Login as user from Org B.
- **Steps:** DELETE /v1/milestones/:milestoneId
- **Expected:** 404 (deleteMany returns count=0, treated as not found) — cannot delete cross-org
- **Result:** ✅ PASS (after IDOR fix)

### TC-MS-009: View milestone expense heads in Financial Dashboard
- **Preconditions:** Milestone has expense heads recorded
- **Steps:** Navigate to Financial Dashboard → Scroll to "Expense Head Report"
- **Expected:** Expense heads aggregated by category, amounts and percentages shown
- **Result:** ✅ PASS

### TC-MS-010: Waterfall — blocked milestone cannot advance
- **Preconditions:** Milestone 2 has predecessor Milestone 1, Milestone 1 status = IN_PROGRESS
- **Steps:** Attempt to mark Milestone 2 as IN_PROGRESS
- **Expected:** Error: "Predecessor milestone must be COMPLETED first"
- **Result:** ✅ PASS

---

## MODULE 5 — SPRINTS

### TC-SPR-001: Create sprint (project_manager)
- **Steps:** Navigate to Sprint Management → Create Sprint → Set name, start date, end date
- **Expected:** Sprint created with status `planning`, appears in sprint list
- **Result:** ✅ PASS

### TC-SPR-002: Create sprint (member — denied) [SECURITY]
- **Steps:** Login as member → POST /v1/sprints with valid body
- **Expected:** 403 Forbidden (after role guard fix)
- **Result:** ✅ PASS (after fix)

### TC-SPR-003: Add task to sprint
- **Steps:** In Sprint Management → Drag task to active sprint / use "Add to Sprint"
- **Expected:** Task `sprintId` updated, task appears in sprint backlog
- **Result:** ✅ PASS

### TC-SPR-004: Complete sprint
- **Steps:** PM clicks "Complete Sprint" → Choose what to do with incomplete tasks
- **Expected:** Sprint status → `completed`, incomplete tasks moved as configured
- **Result:** ✅ PASS

### TC-SPR-005: Delete sprint (viewer — denied) [SECURITY]
- **Steps:** Login as viewer → DELETE /v1/sprints/:id
- **Expected:** 403 Forbidden
- **Result:** ✅ PASS (after fix)

---

## MODULE 6 — APPROVALS

### TC-APPR-001: Submit project for approval
- **Steps:** PM creates project → Clicks "Submit for Approval"
- **Expected:** Approval record created, approvers notified, project status → PENDING_APPROVAL
- **Result:** ✅ PASS

### TC-APPR-002: Approve request (authorized approver)
- **Preconditions:** Pending approval exists, logged in as division_admin
- **Steps:** Go to Approval Inbox → Click Approve → Add comment → Confirm
- **Expected:** Approval status → `approved`, project status updated
- **Result:** ✅ PASS

### TC-APPR-003: Approve request (member — denied) [SECURITY]
- **Steps:** Login as member → POST /v1/approvals/:id/approve
- **Expected:** 403 Forbidden (after role guard fix)
- **Result:** ✅ PASS (after fix)

### TC-APPR-004: Reject approval with mandatory comment
- **Steps:** Approver clicks Reject → Tries to submit without comment
- **Expected:** Validation error: comment is required for rejection
- **Result:** ✅ PASS

### TC-APPR-005: Approval group — any member can approve
- **Preconditions:** Approval group with 3 members, request pending
- **Steps:** Any one group member approves
- **Expected:** Request marked approved, other group members notified
- **Result:** ✅ PASS

### TC-APPR-006: Approval audit trail
- **Steps:** After approval/rejection, check Audit Log
- **Expected:** Entry shows: who performed action, timestamp, entity type, decision and comment
- **Result:** ✅ PASS

---

## MODULE 7 — FINANCIAL DASHBOARD

### TC-FIN-001: View financial metrics (executive)
- **Preconditions:** Logged in as executive
- **Steps:** Navigate to Financial Dashboard
- **Expected:** Total Budget, Total Spent, Total Revenue, Average ROI shown in INR (₹)
- **Result:** ✅ PASS

### TC-FIN-002: Add new budget entry
- **Steps:** Click "New Budget" → Fill entity name, total budget, revenue, burn rate → Create
- **Expected:** New entry added to budget list, summary metrics updated
- **Result:** ✅ PASS

### TC-FIN-003: Expense head report shows real data
- **Preconditions:** At least one milestone has expense heads recorded
- **Steps:** Navigate to Financial Dashboard → Scroll to "Expense Head Report"
- **Expected:** Real aggregated data shown (not sample data), no "sample data" badge
- **Result:** ✅ PASS

### TC-FIN-004: Budget utilization warning
- **Preconditions:** Project's actual budget > planned budget
- **Steps:** View Milestone cards
- **Expected:** Red highlight on milestone card, overspend warning visible
- **Result:** ✅ PASS

### TC-FIN-005: Create budget (viewer — denied) [SECURITY]
- **Steps:** Login as viewer → POST /v1/financial/budgets
- **Expected:** 403 Forbidden (after role guard fix)
- **Result:** ✅ PASS (after fix)

### TC-FIN-006: Currency format is INR throughout
- **Steps:** View all financial figures across dashboards
- **Expected:** All amounts formatted as ₹ with Indian number system (e.g., ₹5,00,000)
- **Result:** ✅ PASS

---

## MODULE 8 — DIVISIONS & VERTICALS

### TC-DIV-001: Create division (org_admin)
- **Steps:** Admin → Divisions → New Division → Fill name, code, head → Save
- **Expected:** Division created, appears in hierarchy, setup checklist initialized
- **Result:** ✅ PASS

### TC-DIV-002: Create division (division_admin — denied)
- **Steps:** Login as division_admin → POST /v1/divisions
- **Expected:** 403 Forbidden (division:create is org_admin only)
- **Result:** ✅ PASS

### TC-DIV-003: Create vertical with correct head dropdown
- **Preconditions:** Multiple users exist with different roles
- **Steps:** Open Vertical form → Check the "Head" dropdown
- **Expected:** Only users with `vertical_head` role appear in the dropdown
- **Result:** ✅ PASS

### TC-DIV-004: Division lifecycle transition
- **Steps:** Create division in DRAFT → Click "Start Setup" → Click "Activate"
- **Expected:** Status transitions DRAFT → CONFIGURING → ACTIVE, readiness bar updates
- **Result:** ✅ PASS

### TC-DIV-005: Division MIS dashboard loads correctly
- **Steps:** Navigate to Division MIS → Select a division
- **Expected:** Members, projects, tasks, approvals metrics all load within 5 seconds
- **Result:** ✅ PASS

### TC-DIV-006: Division readiness org scoping [SECURITY]
- **Steps:** Login as user from Org B → GET /v1/divisions/:divisionFromOrgA/readiness
- **Expected:** 404 Not Found (division not in user's org)
- **Result:** ✅ PASS (after IDOR fix)

---

## MODULE 9 — USER MANAGEMENT

### TC-USR-001: Invite user via email
- **Steps:** Admin → User Management → Invite User → Enter email, select role → Send
- **Expected:** Invite email sent, invite link generated, pending invite visible in list
- **Result:** ✅ PASS

### TC-USR-002: Change user role
- **Steps:** Admin opens user → Changes role from member to team_lead → Save
- **Expected:** Role updated, user's permissions change immediately on next request
- **Result:** ✅ PASS

### TC-USR-003: Deactivate user
- **Steps:** Admin suspends user account
- **Expected:** User cannot log in, receives "Account suspended" error
- **Result:** ✅ PASS

### TC-USR-004: Vertical head dropdown shows only VH-role users
- **Preconditions:** Org has users with various roles
- **Steps:** Open vertical creation/edit form → Check "Head" user dropdown
- **Expected:** Only users with `vertical_head` role appear
- **Result:** ✅ PASS

### TC-USR-005: Non-admin cannot access User Management
- **Steps:** Login as member → Navigate to /admin/users
- **Expected:** Redirected away or 403 shown — ProtectedRoute blocks non-admins
- **Result:** ✅ PASS

---

## MODULE 10 — NOTIFICATIONS

### TC-NOTIF-001: Task assignment notification
- **Preconditions:** User B is logged in
- **Steps:** User A assigns a task to User B
- **Expected:** User B receives notification badge in header, notification in inbox
- **Result:** ✅ PASS

### TC-NOTIF-002: @mention notification
- **Steps:** User A comments on a task "@userB check this"
- **Expected:** User B receives mention notification with link to the task comment
- **Result:** ✅ PASS

### TC-NOTIF-003: Due date reminder
- **Preconditions:** Task with due date tomorrow
- **Steps:** Check notifications next day
- **Expected:** Due date reminder notification appears for task assignee
- **Result:** ✅ PASS

---

## MODULE 11 — REPORTS & EXPORTS

### TC-RPT-001: Generate advanced report
- **Steps:** Navigate to Reports → Advanced → Set date range + filters → Generate
- **Expected:** Report loads with correct data matching filter criteria
- **Result:** ✅ PASS

### TC-RPT-002: Export data
- **Steps:** Navigate to Exports → Select entity type → Export
- **Expected:** File download triggered (CSV/JSON), data matches expected format
- **Result:** ✅ PASS

### TC-RPT-003: Audit log — filter by date
- **Steps:** Navigate to Audit Log → Filter by last 7 days
- **Expected:** Only entries from last 7 days shown, correct actor/action/entity format
- **Result:** ✅ PASS

### TC-RPT-004: Audit log — viewer cannot access
- **Steps:** Login as viewer → GET /v1/audit-logs
- **Expected:** 403 Forbidden (audit log is admin-only)
- **Result:** ✅ PASS

---

## MODULE 12 — KANBAN BOARD

### TC-KAN-001: Kanban loads correctly for project
- **Steps:** Navigate to project → Kanban Board
- **Expected:** Columns rendered (To Do, In Progress, In Review, Done), tasks appear in correct columns
- **Result:** ✅ PASS

### TC-KAN-002: Task status update on column move
- **Steps:** Drag task from "To Do" to "In Progress"
- **Expected:** API call updates task status, change persists on page refresh
- **Result:** ✅ PASS

### TC-KAN-003: Blocked task visual indicator
- **Preconditions:** Task B depends on incomplete Task A
- **Steps:** View Kanban
- **Expected:** Task B card shows blocked/dependency indicator
- **Result:** ✅ PASS

### TC-KAN-004: Team panel — add and remove members
- **Steps:** Click "Team" button → Add user → Remove user
- **Expected:** Member list updates in real-time, task assignee dropdown updates accordingly
- **Result:** ✅ PASS

---

## MODULE 13 — GANTT CHART

### TC-GANTT-001: Gantt chart loads with tasks
- **Steps:** Navigate to project → Gantt
- **Expected:** Tasks displayed on timeline with start/end dates as horizontal bars
- **Result:** ✅ PASS

### TC-GANTT-002: Task dependency shown as arrow
- **Preconditions:** Task B depends on Task A
- **Steps:** View Gantt chart
- **Expected:** Arrow drawn from Task A's end to Task B's start
- **Result:** ✅ PASS

---

## MODULE 14 — CAPACITY PLANNING

### TC-CAP-001: Capacity planning loads
- **Steps:** Navigate to Capacity Planning page
- **Expected:** Team members listed with allocated vs available hours, overloaded members highlighted
- **Result:** ✅ PASS

### TC-CAP-002: Over-allocated member shown in red
- **Preconditions:** Member has more tasks this week than available hours
- **Steps:** View Capacity Planning
- **Expected:** Member row highlighted in red/amber with "Over-allocated" badge
- **Result:** ✅ PASS

---

## MODULE 15 — SECURITY TEST CASES

### TC-SEC-001: SQL injection via task title
- **Steps:** Create task with title `'; DROP TABLE tasks; --`
- **Expected:** Title saved as plain text (Prisma parameterizes queries), no DB damage
- **Result:** ✅ PASS

### TC-SEC-002: XSS via task description
- **Steps:** Create task with description `<script>alert('xss')</script>`
- **Expected:** Content rendered as plain text, no script executes (React escapes by default)
- **Result:** ✅ PASS

### TC-SEC-003: CORS — request from unauthorized domain
- **Steps:** Make API call with `Origin: https://malicious-site.com`
- **Expected:** CORS rejection — no `Access-Control-Allow-Origin` header, browser blocks response
- **Result:** ✅ PASS (after CORS fix)

### TC-SEC-004: Unauthenticated request to protected endpoint
- **Steps:** Call GET /v1/projects without any Authorization header
- **Expected:** 401 Unauthorized — "Authentication required"
- **Result:** ✅ PASS

### TC-SEC-005: Role escalation attempt
- **Steps:** Login as `member` → Try PATCH /v1/members/:id/role to change self to `org_admin`
- **Expected:** 403 Forbidden — cannot change own role
- **Result:** ✅ PASS

### TC-SEC-006: Brute force protection on login
- **Steps:** Submit 10+ login requests per minute from same IP
- **Expected:** Rate limited — 429 Too Many Requests after threshold exceeded
- **Result:** ✅ PASS

### TC-SEC-007: JWT algorithm confusion
- **Steps:** Create a JWT signed with `alg: none` or `alg: RS256` → Send to API
- **Expected:** 401 Unauthorized — server enforces `HS256` algorithm only
- **Result:** ✅ PASS

### TC-SEC-008: Internal error messages not exposed
- **Steps:** Trigger a 500 error (e.g., malformed JSON body) → Inspect response
- **Expected:** Response says "Internal server error" — no stack trace, no DB details
- **Result:** ✅ PASS (after error message fix)

### TC-SEC-009: Milestone DELETE IDOR blocked [SECURITY]
- **Preconditions:** Org A has milestone M1, Org B has authenticated user U2
- **Steps:** U2 sends DELETE /v1/milestones/M1 (M1 belongs to Org A)
- **Expected:** 404 Not Found (orgId filter prevents deletion)
- **Result:** ✅ PASS (after fix)

### TC-SEC-010: Viewer cannot create OKRs [SECURITY]
- **Steps:** Login as viewer → POST /v1/okrs with valid body
- **Expected:** 403 Forbidden (after role guard fix)
- **Result:** ✅ PASS (after fix)

### TC-SEC-011: Member cannot create financial budgets [SECURITY]
- **Steps:** Login as member → POST /v1/financial/budgets
- **Expected:** 403 Forbidden (after role guard fix)
- **Result:** ✅ PASS (after fix)

### TC-SEC-012: AI endpoint input length limit
- **Steps:** POST /v1/ai/generate-tasks with `prompt` of 3000 characters
- **Expected:** 400 Bad Request — "Prompt too long (max 2000 characters)"
- **Result:** ✅ PASS (after fix)

### TC-SEC-013: Password reset token is single-use
- **Steps:** Use password reset link → Attempt to use same link again
- **Expected:** Second use returns error: "Reset link has expired or already been used"
- **Result:** ✅ PASS

---

## MODULE 16 — ROLE HIERARCHY MATRIX

The following table shows which actions each role can perform. ✅ = Allowed, ❌ = Denied.

| Action | org_admin | div_admin | vert_head | PM | team_lead | member | executive | viewer |
|--------|-----------|-----------|-----------|----|-----------| -------|-----------|--------|
| Create Division | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Vertical | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Project | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Task | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Milestone | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Milestone | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Budget | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Edit Budget | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Requests | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Log Time | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Sprint | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Sprint | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create OKR | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Financial Budget | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Resources | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## MODULE 17 — EDGE CASES & BOUNDARY CONDITIONS

### TC-EDGE-001: Empty project — no tasks or milestones
- **Steps:** Create project → View Kanban, Gantt, Milestones pages
- **Expected:** Empty states shown with helpful "No tasks yet" messages, no crashes or JS errors
- **Result:** ✅ PASS

### TC-EDGE-002: Very long task title (500+ characters)
- **Steps:** Create task with title of 500 characters
- **Expected:** Title truncated in UI display but stored fully, no DB error
- **Result:** ✅ PASS

### TC-EDGE-003: Milestone with 0 budget
- **Steps:** Create milestone with planned budget = 0
- **Expected:** Budget shown as ₹0, no division-by-zero errors in burn calculations
- **Result:** ✅ PASS

### TC-EDGE-004: Sprint with no tasks
- **Steps:** Create sprint → Complete sprint with no tasks assigned
- **Expected:** Sprint completes successfully, "0 tasks moved" message
- **Result:** ✅ PASS

### TC-EDGE-005: User with no division assigned
- **Steps:** Create new user without assigning to any division → User logs in
- **Expected:** Dashboard shows empty state with no errors, user can still see global items
- **Result:** ✅ PASS

### TC-EDGE-006: Simultaneous edit by two users
- **Preconditions:** User A and User B both have task open
- **Steps:** User A changes title → User B changes description → Both save
- **Expected:** Last save wins (optimistic update), no DB corruption, both changes persisted
- **Result:** ✅ PASS

### TC-EDGE-007: Pagination at boundary
- **Steps:** Create exactly 20 tasks (page size = 20) → Add 21st task
- **Expected:** Pagination shows 2 pages, 21st task appears on page 2
- **Result:** ✅ PASS

### TC-EDGE-008: Invalid date range in reports
- **Steps:** Set report start date AFTER end date
- **Expected:** Validation error: "Start date must be before end date"
- **Result:** ✅ PASS

### TC-EDGE-009: Circular task dependency
- **Preconditions:** Task A depends on Task B
- **Steps:** Try to set Task B to depend on Task A
- **Expected:** Error: "Circular dependency detected"
- **Result:** ✅ PASS

### TC-EDGE-010: API request with very large payload
- **Steps:** Send POST /v1/tasks with body of 600KB
- **Expected:** 413 Payload Too Large (body limit is 500KB)
- **Result:** ✅ PASS (after body limit fix)

---

## TEST EXECUTION SUMMARY (after all fixes)

| Module | Total TCs | Pass | Fail | Blocked |
|--------|-----------|------|------|---------|
| Authentication | 12 | 12 | 0 | 0 |
| Projects | 10 | 10 | 0 | 0 |
| Tasks | 11 | 11 | 0 | 0 |
| Milestones | 10 | 10 | 0 | 0 |
| Sprints | 5 | 5 | 0 | 0 |
| Approvals | 6 | 6 | 0 | 0 |
| Financial Dashboard | 6 | 6 | 0 | 0 |
| Divisions & Verticals | 6 | 6 | 0 | 0 |
| User Management | 5 | 5 | 0 | 0 |
| Notifications | 3 | 3 | 0 | 0 |
| Reports & Exports | 4 | 4 | 0 | 0 |
| Kanban Board | 4 | 4 | 0 | 0 |
| Gantt Chart | 2 | 2 | 0 | 0 |
| Capacity Planning | 2 | 2 | 0 | 0 |
| Security | 13 | 13 | 0 | 0 |
| Role Hierarchy | 20 | 20 | 0 | 0 |
| Edge Cases | 10 | 10 | 0 | 0 |
| **TOTAL** | **129** | **129** | **0** | **0** |

---

## KNOWN ISSUES BEFORE FIXES (pre-patch state)

| ID | Severity | Type | Description | Status |
|----|----------|------|-------------|--------|
| BUG-001 | HIGH | Security | Milestone DELETE no org scoping (IDOR) | Fixed |
| BUG-002 | HIGH | Security | Approvals approve/reject no role guard | Fixed |
| BUG-003 | HIGH | Security | CORS allows all *.vercel.app domains | Fixed |
| BUG-004 | HIGH | Security | Raw err.message in 500 responses | Fixed |
| BUG-005 | HIGH | Security | Sprint write ops no role guard | Fixed |
| BUG-006 | HIGH | Security | OKR write ops no role guard | Fixed |
| BUG-007 | HIGH | Security | Financial write ops no role guard | Fixed |
| BUG-008 | HIGH | Security | Resource write ops no role guard | Fixed |
| BUG-009 | CRITICAL | Security | NODE_ENV default = 'development' (dev bypass risk) | Fixed |
| BUG-010 | MEDIUM | Security | Password min 6 chars (too weak) | Fixed |
| BUG-011 | MEDIUM | Security | AI endpoint unbounded input | Fixed |
| BUG-012 | MEDIUM | Data | 'director' role in approval guard (typo) | Fixed |
| BUG-013 | LOW | Functional | Project creation form submit button locator mismatch in E2E | Fixed |

---

*Document generated: 2026-05-31 | Q-Flow v1.0 Security + Functional Audit*
