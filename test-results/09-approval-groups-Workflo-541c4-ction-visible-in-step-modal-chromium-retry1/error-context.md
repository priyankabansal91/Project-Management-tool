# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-approval-groups.spec.ts >> Workflow Steps Configuration >> Escalation section visible in step modal
- Location: e2e\09-approval-groups.spec.ts:150:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Escalation')
Expected: visible
Error: strict mode violation: getByText('Escalation') resolved to 2 elements:
    1) <th class="px-4 py-3 text-left">Escalation</th> aka getByRole('columnheader', { name: 'Escalation' })
    2) <h4 class="text-sm font-semibold mb-3 text-gray-700">Escalation (optional)</h4> aka getByRole('heading', { name: 'Escalation (optional)' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Escalation')

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
      - link "Priya Sharma org admin" [ref=e296] [cursor=pointer]:
        - /url: /profile
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
            - paragraph [ref=e411]: "Pipeline: 2 steps in sequence"
            - button "Add Step" [active] [ref=e412] [cursor=pointer]:
              - img [ref=e413]
              - text: Add Step
          - generic [ref=e414]:
            - heading "Approval Pipeline" [level=4] [ref=e415]
            - generic [ref=e416]:
              - generic [ref=e417]:
                - generic [ref=e418]:
                  - generic [ref=e419]: 1. Core Team Review
                  - generic [ref=e420]: Core Team
                  - text: QUORUM
                - generic [ref=e423]: →
              - generic [ref=e426]:
                - generic [ref=e427]: 2. CFO Final Approval
                - generic [ref=e428]: CFO Group
                - text: ANY
              - generic [ref=e429]:
                - generic [ref=e432]: →
                - generic [ref=e433]: ✓ ACTIVE
          - table [ref=e435]:
            - rowgroup [ref=e436]:
              - row "Order Step Name Assigned Group On Approve On Reject SLA Escalation" [ref=e437]:
                - columnheader "Order" [ref=e438]
                - columnheader "Step Name" [ref=e439]
                - columnheader "Assigned Group" [ref=e440]
                - columnheader "On Approve" [ref=e441]
                - columnheader "On Reject" [ref=e442]
                - columnheader "SLA" [ref=e443]
                - columnheader "Escalation" [ref=e444]
                - columnheader [ref=e445]
            - rowgroup [ref=e446]:
              - row "1 Core Team Review Core Team QUORUM PENDING_CFO_APPROVAL DRAFT 48h After 60h → n/a" [ref=e447]:
                - cell "1" [ref=e448]:
                  - generic [ref=e449]: "1"
                - cell "Core Team Review" [ref=e450]
                - cell "Core Team QUORUM" [ref=e451]:
                  - generic [ref=e452]: Core Team
                  - text: QUORUM
                - cell "PENDING_CFO_APPROVAL" [ref=e453]
                - cell "DRAFT" [ref=e454]
                - cell "48h" [ref=e455]
                - cell "After 60h → n/a" [ref=e456]
                - cell [ref=e457]:
                  - generic [ref=e458]:
                    - button [ref=e459] [cursor=pointer]:
                      - img [ref=e460]
                    - button [ref=e463] [cursor=pointer]:
                      - img [ref=e464]
              - row "2 CFO Final Approval CFO Group ANY ACTIVE REJECTED 72h After 84h → Division Head" [ref=e467]:
                - cell "2" [ref=e468]:
                  - generic [ref=e469]: "2"
                - cell "CFO Final Approval" [ref=e470]
                - cell "CFO Group ANY" [ref=e471]:
                  - generic [ref=e472]: CFO Group
                  - text: ANY
                - cell "ACTIVE" [ref=e473]
                - cell "REJECTED" [ref=e474]
                - cell "72h" [ref=e475]
                - cell "After 84h → Division Head" [ref=e476]
                - cell [ref=e477]:
                  - generic [ref=e478]:
                    - button [ref=e479] [cursor=pointer]:
                      - img [ref=e480]
                    - button [ref=e483] [cursor=pointer]:
                      - img [ref=e484]
          - generic [ref=e488]:
            - generic [ref=e489]:
              - heading "New Workflow Step" [level=3] [ref=e490]
              - button [ref=e491] [cursor=pointer]:
                - img [ref=e492]
            - generic [ref=e495]:
              - generic [ref=e496]:
                - generic [ref=e497]:
                  - generic [ref=e498]: Step Name *
                  - textbox "e.g. CFO Final Approval" [ref=e499]
                - generic [ref=e500]:
                  - generic [ref=e501]: Step Order
                  - spinbutton [ref=e502]: "3"
                - generic [ref=e503]:
                  - generic [ref=e504]: SLA Hours
                  - spinbutton [ref=e505]: "48"
              - generic [ref=e506]:
                - generic [ref=e507]: Assigned Group *
                - combobox [ref=e508]:
                  - option "— select group —" [selected]
                  - option "Core Team (QUORUM)"
                  - option "CFO Group (ANY)"
                  - option "Division Head (ALL)"
              - generic [ref=e509]:
                - generic [ref=e510]:
                  - generic [ref=e511]: On Approve → Status
                  - combobox [ref=e512]:
                    - option "DRAFT"
                    - option "PENDING_CORE_REVIEW"
                    - option "CORE_APPROVED"
                    - option "PENDING_CFO_APPROVAL"
                    - option "APPROVED" [selected]
                    - option "ACTIVE"
                    - option "REJECTED"
                - generic [ref=e513]:
                  - generic [ref=e514]: On Reject → Status
                  - combobox [ref=e515]:
                    - option "DRAFT" [selected]
                    - option "PENDING_CORE_REVIEW"
                    - option "CORE_APPROVED"
                    - option "PENDING_CFO_APPROVAL"
                    - option "APPROVED"
                    - option "ACTIVE"
                    - option "REJECTED"
              - generic [ref=e516]:
                - generic [ref=e517]: On Approve → Next Step
                - combobox [ref=e518]:
                  - option "(Final step — no next step)" [selected]
                  - option "Core Team Review"
                  - option "CFO Final Approval"
              - generic [ref=e519]:
                - heading "Escalation (optional)" [level=4] [ref=e520]
                - generic [ref=e521]:
                  - generic [ref=e522]:
                    - generic [ref=e523]: Escalate after (hours)
                    - spinbutton [ref=e524]
                  - generic [ref=e525]:
                    - generic [ref=e526]: Escalate to Group
                    - combobox [ref=e527]:
                      - option "(none)" [selected]
                      - option "Core Team"
                      - option "CFO Group"
                      - option "Division Head"
            - generic [ref=e528]:
              - button "Cancel" [ref=e529] [cursor=pointer]
              - button "Save Step" [disabled] [ref=e530]:
                - img [ref=e531]
                - text: Save Step
```

# Test source

```ts
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
  68  |     await expect(page.getByText('Quorum Count')).toBeVisible();
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
> 152 |     await expect(page.getByText('Escalation')).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
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
  169 |     await expect(page).not.toHaveURL(/\/login/);
  170 |   });
  171 | 
  172 |   test('KPI cards visible', async ({ page }) => {
  173 |     await expect(page.getByText('In Progress')).toBeVisible();
  174 |     await expect(page.getByText('SLA Overdue')).toBeVisible();
  175 |     await expect(page.getByText('Completed')).toBeVisible();
  176 |   });
  177 | 
  178 |   test('Group summary cards visible', async ({ page }) => {
  179 |     await expect(page.getByText('Core Team')).toBeVisible();
  180 |     await expect(page.getByText('CFO Group')).toBeVisible();
  181 |     await expect(page.getByText('Division Head')).toBeVisible();
  182 |   });
  183 | 
  184 |   test('Workflow instances listed', async ({ page }) => {
  185 |     await expect(page.getByText('NH-48 Highway Widening Project')).toBeVisible();
  186 |     await expect(page.getByText('Yamuna Bridge Strengthening Phase II')).toBeVisible();
  187 |   });
  188 | 
  189 |   test('Filter tabs present', async ({ page }) => {
  190 |     await expect(page.getByRole('button', { name: /^all/i })).toBeVisible();
  191 |     await expect(page.getByRole('button', { name: /in progress/i })).toBeVisible();
  192 |     await expect(page.getByRole('button', { name: /completed/i })).toBeVisible();
  193 |   });
  194 | 
  195 |   test('Completed filter shows only completed instances', async ({ page }) => {
  196 |     await page.getByRole('button', { name: /completed/i }).click();
  197 |     await expect(page.getByText('Rural Water Supply Scheme')).toBeVisible();
  198 |     await expect(page.getByText('NH-48 Highway Widening Project')).not.toBeVisible();
  199 |   });
  200 | 
  201 |   test('Expand card reveals step detail with votes', async ({ page }) => {
  202 |     // Click the first card to expand
  203 |     await page.locator('div.border-l-4').first().click();
  204 |     await expect(page.getByText('Core Team Review')).toBeVisible();
  205 |     await expect(page.getByText('Rajesh Kumar')).toBeVisible();
  206 |   });
  207 | 
  208 |   test('Quorum progress bar visible on expanded card', async ({ page }) => {
  209 |     await page.locator('div.border-l-4').first().click();
  210 |     // .h-3 flex-1 are the quorum bars
  211 |     const bars = page.locator('div.h-3');
  212 |     await expect(bars.first()).toBeVisible();
  213 |   });
  214 | 
  215 |   test('Approve / Reject / Send Back buttons visible for active step', async ({ page }) => {
  216 |     await page.locator('div.border-l-4').first().click();
  217 |     await expect(page.getByRole('button', { name: /approve/i }).first()).toBeVisible();
  218 |     await expect(page.getByRole('button', { name: /reject/i }).first()).toBeVisible();
  219 |   });
  220 | 
  221 |   test('SLA overdue indicator visible for overdue instance', async ({ page }) => {
  222 |     // Yamuna Bridge has overdue CFO step
  223 |     await expect(page.getByText('Overdue').first()).toBeVisible();
  224 |   });
  225 | 
  226 |   test('Config Audit tab loads in Approval Groups page', async ({ page }) => {
  227 |     await page.goto('/admin/approval-groups');
  228 |     await page.waitForLoadState('networkidle');
  229 |     await page.getByRole('button', { name: /config audit/i }).click();
  230 |     await expect(page.getByText('GROUP_CREATED')).toBeVisible();
  231 |     await expect(page.getByText('MEMBER_ADDED')).toBeVisible();
  232 |   });
  233 | });
  234 | 
```