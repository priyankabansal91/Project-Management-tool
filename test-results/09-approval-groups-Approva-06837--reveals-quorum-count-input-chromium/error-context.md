# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-approval-groups.spec.ts >> Approval Group Configuration >> QUORUM selection reveals quorum count input
- Location: e2e\09-approval-groups.spec.ts:62:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Quorum Count')
Expected: visible
Error: strict mode violation: getByText('Quorum Count') resolved to 2 elements:
    1) <div>…</div> aka getByText('QUORUM logic: Configurable')
    2) <label class="block text-sm font-medium mb-1">Quorum Count (minimum approvals needed)</label> aka getByText('Quorum Count (minimum')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Quorum Count')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: QF
        - generic [ref=e10]:
          - generic [ref=e11]: Q-Flow
          - paragraph [ref=e12]: Quality Council of India
      - navigation [ref=e13]:
        - generic [ref=e14]:
          - paragraph [ref=e15]: Workspace
          - generic [ref=e16]:
            - link "Dashboard" [ref=e17] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e18]
              - generic [ref=e23]: Dashboard
            - link "Projects" [ref=e24] [cursor=pointer]:
              - /url: /projects
              - img [ref=e25]
              - generic [ref=e27]: Projects
            - link "My Tasks" [ref=e28] [cursor=pointer]:
              - /url: /my-tasks
              - img [ref=e29]
              - generic [ref=e32]: My Tasks
            - link "Calendar" [ref=e33] [cursor=pointer]:
              - /url: /calendar
              - img [ref=e34]
              - generic [ref=e36]: Calendar
            - link "Pre-Projects" [ref=e37] [cursor=pointer]:
              - /url: /preproject
              - img [ref=e38]
              - generic [ref=e41]: Pre-Projects
        - generic [ref=e42]:
          - paragraph [ref=e44]: Project Mgmt
          - generic [ref=e45]:
            - link "Sprints" [ref=e46] [cursor=pointer]:
              - /url: /sprints
              - img [ref=e47]
              - generic [ref=e51]: Sprints
            - link "Team" [ref=e52] [cursor=pointer]:
              - /url: /team
              - img [ref=e53]
              - generic [ref=e58]: Team
            - link "Time Tracking" [ref=e59] [cursor=pointer]:
              - /url: /time-tracking
              - img [ref=e60]
              - generic [ref=e63]: Time Tracking
            - link "Reports" [ref=e64] [cursor=pointer]:
              - /url: /reports
              - img [ref=e65]
              - generic [ref=e67]: Reports
            - link "Advanced Reports" [ref=e68] [cursor=pointer]:
              - /url: /reports/advanced
              - img [ref=e69]
              - generic [ref=e72]: Advanced Reports
            - link "Capacity Planning" [ref=e73] [cursor=pointer]:
              - /url: /capacity
              - img [ref=e74]
              - generic [ref=e78]: Capacity Planning
            - link "Project Tracking" [ref=e79] [cursor=pointer]:
              - /url: /project-tracking
              - img [ref=e80]
              - generic [ref=e83]: Project Tracking
            - link "AI Features" [ref=e84] [cursor=pointer]:
              - /url: /ai
              - img [ref=e85]
              - generic [ref=e87]: AI Features
            - link "Gantt Timeline" [ref=e88] [cursor=pointer]:
              - /url: /gantt
              - img [ref=e89]
              - generic [ref=e91]: Gantt Timeline
            - link "Attendance" [ref=e92] [cursor=pointer]:
              - /url: /attendance
              - img [ref=e93]
              - generic [ref=e97]: Attendance
            - link "Workflow Monitor" [ref=e98] [cursor=pointer]:
              - /url: /workflow/monitor
              - img [ref=e99]
              - generic [ref=e102]: Workflow Monitor
            - link "Group Approvals" [ref=e103] [cursor=pointer]:
              - /url: /workflow/group-approvals
              - img [ref=e104]
              - generic [ref=e107]: Group Approvals
        - generic [ref=e108]:
          - paragraph [ref=e110]: Executive
          - generic [ref=e111]:
            - link "Executive View" [ref=e112] [cursor=pointer]:
              - /url: /executive
              - img [ref=e113]
              - generic [ref=e115]: Executive View
            - link "OKR & Goals" [ref=e116] [cursor=pointer]:
              - /url: /executive/okrs
              - img [ref=e117]
              - generic [ref=e121]: OKR & Goals
            - link "Financial Dashboard" [ref=e122] [cursor=pointer]:
              - /url: /executive/financial
              - img [ref=e123]
              - generic [ref=e125]: Financial Dashboard
            - link "Resource Dashboard" [ref=e126] [cursor=pointer]:
              - /url: /executive/resources
              - img [ref=e127]
              - generic [ref=e131]: Resource Dashboard
            - link "Roadmap" [ref=e132] [cursor=pointer]:
              - /url: /roadmap
              - img [ref=e133]
              - generic [ref=e135]: Roadmap
            - link "Status Reports" [ref=e136] [cursor=pointer]:
              - /url: /status-reports
              - img [ref=e137]
              - generic [ref=e141]: Status Reports
            - link "Risk Register" [ref=e142] [cursor=pointer]:
              - /url: /risk-register
              - img [ref=e143]
              - generic [ref=e145]: Risk Register
            - link "Portfolio" [ref=e146] [cursor=pointer]:
              - /url: /portfolio
              - img [ref=e147]
              - generic [ref=e150]: Portfolio
        - generic [ref=e151]:
          - paragraph [ref=e153]: Admin
          - generic [ref=e154]:
            - link "Admin Dashboard" [ref=e155] [cursor=pointer]:
              - /url: /admin/dashboard
              - img [ref=e156]
              - generic [ref=e161]: Admin Dashboard
            - link "Roles & Permissions" [ref=e162] [cursor=pointer]:
              - /url: /admin/roles
              - img [ref=e163]
              - generic [ref=e166]: Roles & Permissions
            - link "Division Config" [ref=e167] [cursor=pointer]:
              - /url: /admin/division-config
              - img [ref=e168]
              - generic [ref=e172]: Division Config
            - link "Division MIS" [ref=e173] [cursor=pointer]:
              - /url: /admin/division-mis
              - img [ref=e174]
              - generic [ref=e175]: Division MIS
            - link "Handoff Panel" [ref=e176] [cursor=pointer]:
              - /url: /admin/handoff
              - img [ref=e177]
              - generic [ref=e181]: Handoff Panel
            - link "User Management" [ref=e182] [cursor=pointer]:
              - /url: /admin/users
              - img [ref=e183]
              - generic [ref=e185]: User Management
            - link "Workflows" [ref=e186] [cursor=pointer]:
              - /url: /admin/workflows
              - img [ref=e187]
              - generic [ref=e191]: Workflows
            - link "Issue Types" [ref=e192] [cursor=pointer]:
              - /url: /admin/issue-types
              - img [ref=e193]
              - generic [ref=e197]: Issue Types
            - link "Task Templates" [ref=e198] [cursor=pointer]:
              - /url: /admin/templates
              - img [ref=e199]
              - generic [ref=e202]: Task Templates
            - link "Custom Fields" [ref=e203] [cursor=pointer]:
              - /url: /admin/custom-fields
              - img [ref=e204]
              - generic [ref=e206]: Custom Fields
            - link "Divisions" [ref=e207] [cursor=pointer]:
              - /url: /admin/divisions
              - img [ref=e208]
              - generic [ref=e212]: Divisions
            - link "External Users" [ref=e213] [cursor=pointer]:
              - /url: /admin/external-users
              - img [ref=e214]
              - generic [ref=e217]: External Users
            - link "Approvals" [ref=e218] [cursor=pointer]:
              - /url: /admin/approvals
              - img [ref=e219]
              - generic [ref=e222]: Approvals
            - link "Forms" [ref=e223] [cursor=pointer]:
              - /url: /admin/forms
              - img [ref=e224]
              - generic [ref=e227]: Forms
            - link "Versioning" [ref=e228] [cursor=pointer]:
              - /url: /admin/versioning
              - img [ref=e229]
              - generic [ref=e233]: Versioning
            - link "Exports" [ref=e234] [cursor=pointer]:
              - /url: /admin/exports
              - img [ref=e235]
              - generic [ref=e238]: Exports
            - link "Audit Log" [ref=e239] [cursor=pointer]:
              - /url: /admin/audit-log
              - img [ref=e240]
              - generic [ref=e242]: Audit Log
            - link "Integrations" [ref=e243] [cursor=pointer]:
              - /url: /settings/integrations
              - img [ref=e244]
              - generic [ref=e246]: Integrations
            - link "Feature Flags" [ref=e247] [cursor=pointer]:
              - /url: /admin/feature-flags
              - img [ref=e248]
              - generic [ref=e250]: Feature Flags
            - link "Onboarding Wizard" [ref=e251] [cursor=pointer]:
              - /url: /admin/onboarding
              - img [ref=e252]
              - generic [ref=e257]: Onboarding Wizard
            - link "Settings" [ref=e258] [cursor=pointer]:
              - /url: /settings
              - img [ref=e259]
              - generic [ref=e262]: Settings
            - link "Approval Groups" [ref=e263] [cursor=pointer]:
              - /url: /admin/approval-groups
              - img [ref=e264]
              - generic [ref=e276]: Approval Groups
            - link "Governance" [ref=e277] [cursor=pointer]:
              - /url: /workflow/governance
              - img [ref=e278]
              - generic [ref=e281]: Governance
            - link "Gov. Dashboard" [ref=e282] [cursor=pointer]:
              - /url: /governance
              - img [ref=e283]
              - generic [ref=e286]: Gov. Dashboard
            - link "Project Closure" [ref=e287] [cursor=pointer]:
              - /url: /governance/closure
              - img [ref=e288]
              - generic [ref=e291]: Project Closure
            - link "Training Guide" [ref=e292] [cursor=pointer]:
              - /url: /workflow/training
              - img [ref=e293]
              - generic [ref=e295]: Training Guide
      - generic [ref=e296]:
        - paragraph [ref=e297]: Priya Sharma
        - paragraph [ref=e298]: org admin
      - button "Collapse sidebar" [ref=e299] [cursor=pointer]:
        - img [ref=e300]
  - generic [ref=e302]:
    - banner [ref=e303]:
      - banner [ref=e304]:
        - button "Search tasks, projects... K" [ref=e307] [cursor=pointer]:
          - img [ref=e308]
          - generic [ref=e311]: Search tasks, projects...
          - generic [ref=e312]:
            - img [ref=e313]
            - text: K
        - generic [ref=e315]:
          - generic [ref=e317]:
            - button "Light" [ref=e318] [cursor=pointer]:
              - img [ref=e319]
              - generic [ref=e325]: Light
            - button "Dark" [ref=e326] [cursor=pointer]:
              - img [ref=e327]
              - generic [ref=e329]: Dark
            - button "System" [ref=e330] [cursor=pointer]:
              - img [ref=e331]
              - generic [ref=e333]: System
          - button "A All Divisions" [ref=e335] [cursor=pointer]:
            - generic [ref=e336]: A
            - generic [ref=e337]: All Divisions
            - img [ref=e338]
          - button "Org Admin" [ref=e341] [cursor=pointer]:
            - img [ref=e342]
            - text: Org Admin
            - img [ref=e347]
          - button "2" [ref=e351] [cursor=pointer]:
            - img [ref=e352]
            - generic [ref=e355]: "2"
          - button "PS Priya Sharma" [ref=e357] [cursor=pointer]:
            - generic [ref=e359]: PS
            - generic [ref=e360]: Priya Sharma
    - main [ref=e361]:
      - generic [ref=e363]:
        - generic [ref=e364]:
          - generic [ref=e365]:
            - heading "Approval Group Configuration" [level=1] [ref=e366]:
              - img [ref=e367]
              - text: Approval Group Configuration
            - paragraph [ref=e369]: Org Admin · Configure groups, approval logic, and workflow pipeline
          - generic [ref=e371]:
            - img [ref=e372]
            - generic [ref=e375]: Workflow Active
        - generic [ref=e376]:
          - generic [ref=e377]:
            - generic [ref=e378]: "3"
            - generic [ref=e379]: Approval Groups
            - generic [ref=e380]: 5 total members
          - generic [ref=e381]:
            - generic [ref=e382]: "2"
            - generic [ref=e383]: Workflow Steps
            - generic [ref=e384]: 2-step approval pipeline
          - generic [ref=e385]:
            - generic [ref=e386]: "3"
            - generic [ref=e387]: Approval Types
            - generic [ref=e388]: ANY · ALL · QUORUM
        - generic [ref=e389]:
          - img [ref=e390]
          - generic [ref=e392]: Changes to groups and steps take effect immediately for new workflow instances. Existing instances continue on the configuration at their start time.
        - generic [ref=e393]:
          - button "Approval Groups" [ref=e394] [cursor=pointer]:
            - img [ref=e395]
            - text: Approval Groups
          - button "Workflow Steps" [ref=e400] [cursor=pointer]:
            - img [ref=e401]
            - text: Workflow Steps
          - button "Config Audit" [ref=e405] [cursor=pointer]:
            - img [ref=e406]
            - text: Config Audit
        - generic [ref=e409]:
          - generic [ref=e410]:
            - paragraph [ref=e411]: 3 approval groups configured
            - button "New Group" [ref=e412] [cursor=pointer]:
              - img [ref=e413]
              - text: New Group
          - generic [ref=e414]:
            - generic [ref=e415]:
              - generic [ref=e416] [cursor=pointer]:
                - generic [ref=e417]:
                  - img [ref=e418]
                  - img [ref=e421]
                  - generic [ref=e426]:
                    - generic [ref=e427]:
                      - generic [ref=e428]: Core Team
                      - generic [ref=e429]: QUORUM
                      - generic [ref=e430]: (2 needed)
                    - paragraph [ref=e431]: Technical + administrative review before CFO escalation
                - generic [ref=e432]:
                  - generic [ref=e433]:
                    - generic [ref=e434]: 3 members
                    - generic [ref=e435]: 48h SLA · 1 step
                  - generic [ref=e436]:
                    - button [ref=e437]:
                      - img [ref=e438]
                    - button [ref=e441]:
                      - img [ref=e442]
              - generic [ref=e445]:
                - generic [ref=e446]:
                  - img [ref=e447]
                  - generic [ref=e449]:
                    - generic [ref=e450]: "QUORUM logic:"
                    - text: Configurable quorum count
                    - generic [ref=e451]:
                      - text: — at least
                      - strong [ref=e452]: "2"
                      - text: of 3 members must approve.
                - generic [ref=e453]:
                  - generic [ref=e454]:
                    - heading "Members (3)" [level=4] [ref=e455]
                    - button "Add Member" [ref=e456] [cursor=pointer]:
                      - img [ref=e457]
                      - text: Add Member
                  - generic [ref=e458]:
                    - generic [ref=e459]:
                      - generic [ref=e460]:
                        - generic [ref=e461]: R
                        - generic [ref=e462]:
                          - generic [ref=e463]: Rajesh Kumar
                          - generic [ref=e464]: Division Head · division_admin
                      - button [ref=e465] [cursor=pointer]:
                        - img [ref=e466]
                    - generic [ref=e469]:
                      - generic [ref=e470]:
                        - generic [ref=e471]: A
                        - generic [ref=e472]:
                          - generic [ref=e473]: Anita Sharma
                          - generic [ref=e474]: Senior Engineer · project_manager
                      - button [ref=e475] [cursor=pointer]:
                        - img [ref=e476]
                    - generic [ref=e479]:
                      - generic [ref=e480]:
                        - generic [ref=e481]: V
                        - generic [ref=e482]:
                          - generic [ref=e483]: Vikram Singh
                          - generic [ref=e484]: Finance Officer · member
                      - button [ref=e485] [cursor=pointer]:
                        - img [ref=e486]
            - generic [ref=e490] [cursor=pointer]:
              - generic [ref=e491]:
                - img [ref=e492]
                - img [ref=e495]
                - generic [ref=e500]:
                  - generic [ref=e501]:
                    - generic [ref=e502]: CFO Group
                    - generic [ref=e503]: ANY
                  - paragraph [ref=e504]: Financial sanction — any one CFO-level executive can approve
              - generic [ref=e505]:
                - generic [ref=e506]:
                  - generic [ref=e507]: 1 members
                  - generic [ref=e508]: 72h SLA · 1 step
                - generic [ref=e509]:
                  - button [ref=e510]:
                    - img [ref=e511]
                  - button [ref=e514]:
                    - img [ref=e515]
            - generic [ref=e519] [cursor=pointer]:
              - generic [ref=e520]:
                - img [ref=e521]
                - img [ref=e524]
                - generic [ref=e529]:
                  - generic [ref=e530]:
                    - generic [ref=e531]: Division Head
                    - generic [ref=e532]: ALL
                  - paragraph [ref=e533]: Unanimous divisional approval required
              - generic [ref=e534]:
                - generic [ref=e535]:
                  - generic [ref=e536]: 1 members
                  - generic [ref=e537]: 36h SLA · 0 steps
                - generic [ref=e538]:
                  - button [ref=e539]:
                    - img [ref=e540]
                  - button [ref=e543]:
                    - img [ref=e544]
          - generic [ref=e548]:
            - generic [ref=e549]:
              - heading "New Approval Group" [level=3] [ref=e550]
              - button [ref=e551] [cursor=pointer]:
                - img [ref=e552]
            - generic [ref=e555]:
              - generic [ref=e556]:
                - generic [ref=e557]: Group Name *
                - textbox "e.g. CFO Group" [ref=e558]
              - generic [ref=e559]:
                - generic [ref=e560]: Description
                - textbox "What does this group review?" [ref=e561]
              - generic [ref=e562]:
                - generic [ref=e563]: Approval Type *
                - generic [ref=e564]:
                  - button "ANY Any 1 member" [ref=e565] [cursor=pointer]:
                    - generic [ref=e566]: ANY
                    - generic [ref=e567]: Any 1 member
                  - button "ALL All must approve" [ref=e568] [cursor=pointer]:
                    - generic [ref=e569]: ALL
                    - generic [ref=e570]: All must approve
                  - button "QUORUM Configurable count" [active] [ref=e571] [cursor=pointer]:
                    - generic [ref=e572]: QUORUM
                    - generic [ref=e573]: Configurable count
              - generic [ref=e574]:
                - generic [ref=e575]: Quorum Count (minimum approvals needed)
                - spinbutton [ref=e576]: "2"
              - generic [ref=e577]:
                - generic [ref=e578]: SLA Hours (decision deadline)
                - generic [ref=e579]:
                  - spinbutton [ref=e580]: "48"
                  - generic [ref=e581]: hours
            - generic [ref=e582]:
              - button "Cancel" [ref=e583] [cursor=pointer]
              - button "Save Group" [disabled] [ref=e584]:
                - img [ref=e585]
                - text: Save Group
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { injectDevAuth } from './helpers';
  3   | 
  4   | // ── Approval Group Configuration (org_admin) ──────────────────────────────────
  5   | 
  6   | test.describe('Approval Group Configuration', () => {
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await injectDevAuth(page, 'dev-org_admin-id');
  10  |   });
  11  | 
  12  |   test('Page loads without crash', async ({ page }) => {
  13  |     await page.goto('/admin/approval-groups');
  14  |     await page.waitForLoadState('networkidle');
  15  |     const body = page.locator('body');
  16  |     await expect(body).not.toContainText('TypeError');
  17  |     await expect(body).not.toContainText('Cannot read properties');
  18  |     await expect(page).not.toHaveURL(/\/login/);
  19  |   });
  20  | 
  21  |   test('Groups tab shows pre-seeded groups', async ({ page }) => {
  22  |     await page.goto('/admin/approval-groups');
  23  |     await page.waitForLoadState('networkidle');
  24  |     await expect(page.getByText('Core Team')).toBeVisible();
  25  |     await expect(page.getByText('CFO Group')).toBeVisible();
  26  |     await expect(page.getByText('Division Head')).toBeVisible();
  27  |   });
  28  | 
  29  |   test('Approval type badges visible (ANY, ALL, QUORUM)', async ({ page }) => {
  30  |     await page.goto('/admin/approval-groups');
  31  |     await page.waitForLoadState('networkidle');
  32  |     await expect(page.getByText('QUORUM').first()).toBeVisible();
  33  |     await expect(page.getByText('ANY').first()).toBeVisible();
  34  |     await expect(page.getByText('ALL').first()).toBeVisible();
  35  |   });
  36  | 
  37  |   test('Expand group shows members', async ({ page }) => {
  38  |     await page.goto('/admin/approval-groups');
  39  |     await page.waitForLoadState('networkidle');
  40  |     // Core Team is expanded by default — members should be visible
  41  |     await expect(page.getByText('Division Head')).toBeVisible();
  42  |     await expect(page.getByText('Senior Engineer')).toBeVisible();
  43  |   });
  44  | 
  45  |   test('"New Group" button opens modal', async ({ page }) => {
  46  |     await page.goto('/admin/approval-groups');
  47  |     await page.waitForLoadState('networkidle');
  48  |     await page.getByRole('button', { name: /new group/i }).click();
  49  |     await expect(page.getByText('New Approval Group')).toBeVisible();
  50  |     await expect(page.getByPlaceholder(/e\.g\. CFO Group/i)).toBeVisible();
  51  |   });
  52  | 
  53  |   test('Approval type selector visible in modal', async ({ page }) => {
  54  |     await page.goto('/admin/approval-groups');
  55  |     await page.waitForLoadState('networkidle');
  56  |     await page.getByRole('button', { name: /new group/i }).click();
  57  |     await expect(page.getByText('ANY')).toBeVisible();
  58  |     await expect(page.getByText('ALL')).toBeVisible();
  59  |     await expect(page.getByText('QUORUM')).toBeVisible();
  60  |   });
  61  | 
  62  |   test('QUORUM selection reveals quorum count input', async ({ page }) => {
  63  |     await page.goto('/admin/approval-groups');
  64  |     await page.waitForLoadState('networkidle');
  65  |     await page.getByRole('button', { name: /new group/i }).click();
  66  |     // Click QUORUM type
  67  |     await page.getByText('QUORUM').last().click();
> 68  |     await expect(page.getByText('Quorum Count')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  69  |   });
  70  | 
  71  |   test('Save disabled when name is empty', async ({ page }) => {
  72  |     await page.goto('/admin/approval-groups');
  73  |     await page.waitForLoadState('networkidle');
  74  |     await page.getByRole('button', { name: /new group/i }).click();
  75  |     const saveBtn = page.getByRole('button', { name: /save group/i });
  76  |     await expect(saveBtn).toBeDisabled();
  77  |   });
  78  | 
  79  |   test('Filling name enables Save and creates group', async ({ page }) => {
  80  |     await page.goto('/admin/approval-groups');
  81  |     await page.waitForLoadState('networkidle');
  82  |     await page.getByRole('button', { name: /new group/i }).click();
  83  |     await page.getByPlaceholder(/e\.g\. CFO Group/i).fill('Legal Review Team');
  84  |     const saveBtn = page.getByRole('button', { name: /save group/i });
  85  |     await expect(saveBtn).toBeEnabled();
  86  |     await saveBtn.click();
  87  |     await expect(page.getByText('Legal Review Team')).toBeVisible();
  88  |   });
  89  | 
  90  |   test('"Add Member" opens member modal', async ({ page }) => {
  91  |     await page.goto('/admin/approval-groups');
  92  |     await page.waitForLoadState('networkidle');
  93  |     // Core Team is already expanded
  94  |     await page.getByRole('button', { name: /add member/i }).first().click();
  95  |     await expect(page.getByText(/add member to/i)).toBeVisible();
  96  |   });
  97  | 
  98  |   test('Delete group blocked when assigned to active steps', async ({ page }) => {
  99  |     await page.goto('/admin/approval-groups');
  100 |     await page.waitForLoadState('networkidle');
  101 |     // No assertion about alert dialog — just test it doesn't crash
  102 |     await expect(page.locator('body')).not.toContainText('TypeError');
  103 |   });
  104 | });
  105 | 
  106 | // ── Workflow Steps Tab ─────────────────────────────────────────────────────────
  107 | 
  108 | test.describe('Workflow Steps Configuration', () => {
  109 | 
  110 |   test.beforeEach(async ({ page }) => {
  111 |     await injectDevAuth(page, 'dev-org_admin-id');
  112 |     await page.goto('/admin/approval-groups');
  113 |     await page.waitForLoadState('networkidle');
  114 |     await page.getByRole('button', { name: /workflow steps/i }).click();
  115 |   });
  116 | 
  117 |   test('Steps tab loads without crash', async ({ page }) => {
  118 |     await expect(page.locator('body')).not.toContainText('TypeError');
  119 |   });
  120 | 
  121 |   test('Shows pipeline visual with step names', async ({ page }) => {
  122 |     await expect(page.getByText('Core Team Review')).toBeVisible();
  123 |     await expect(page.getByText('CFO Final Approval')).toBeVisible();
  124 |   });
  125 | 
  126 |   test('Steps table shows group assignment', async ({ page }) => {
  127 |     await expect(page.getByText('Core Team').first()).toBeVisible();
  128 |     await expect(page.getByText('CFO Group').first()).toBeVisible();
  129 |   });
  130 | 
  131 |   test('Approve/Reject status columns visible', async ({ page }) => {
  132 |     await expect(page.getByText('PENDING_CFO_APPROVAL').first()).toBeVisible();
  133 |     await expect(page.getByText('ACTIVE').first()).toBeVisible();
  134 |   });
  135 | 
  136 |   test('"Add Step" button opens step modal', async ({ page }) => {
  137 |     await page.getByRole('button', { name: /add step/i }).click();
  138 |     await expect(page.getByText('New Workflow Step')).toBeVisible();
  139 |   });
  140 | 
  141 |   test('Step modal requires name and group before saving', async ({ page }) => {
  142 |     await page.getByRole('button', { name: /add step/i }).click();
  143 |     const saveBtn = page.getByRole('button', { name: /save step/i });
  144 |     await expect(saveBtn).toBeDisabled();
  145 |     await page.getByPlaceholder(/e\.g\. CFO Final Approval/i).fill('Legal Check');
  146 |     // still disabled — no group selected
  147 |     await expect(saveBtn).toBeDisabled();
  148 |   });
  149 | 
  150 |   test('Escalation section visible in step modal', async ({ page }) => {
  151 |     await page.getByRole('button', { name: /add step/i }).click();
  152 |     await expect(page.getByText('Escalation')).toBeVisible();
  153 |     await expect(page.getByText('Escalate after')).toBeVisible();
  154 |   });
  155 | });
  156 | 
  157 | // ── Group Approval Dashboard ───────────────────────────────────────────────────
  158 | 
  159 | test.describe('Group Approval Dashboard', () => {
  160 | 
  161 |   test.beforeEach(async ({ page }) => {
  162 |     await injectDevAuth(page, 'dev-org_admin-id');
  163 |     await page.goto('/workflow/group-approvals');
  164 |     await page.waitForLoadState('networkidle');
  165 |   });
  166 | 
  167 |   test('Page loads without crash', async ({ page }) => {
  168 |     await expect(page.locator('body')).not.toContainText('TypeError');
```