# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-preproject-workflow.spec.ts >> Pre-Project Form (multi-step) >> back button returns to previous step
- Location: e2e\08-preproject-workflow.spec.ts:108:7

# Error details

```
Error: locator.fill: Error: strict mode violation: locator('input[placeholder*="MPRDC"]') resolved to 2 elements:
    1) <input value="" placeholder="e.g. MPRDC" class="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"/> aka getByRole('textbox', { name: 'e.g. MPRDC', exact: true })
    2) <input value="" placeholder="e.g. MPRDC/2026/BMP/HWY" class="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"/> aka getByRole('textbox', { name: 'e.g. MPRDC/2026/BMP/HWY' })

Call log:
  - waiting for locator('input[placeholder*="MPRDC"]')

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
          - button "Back" [ref=e365] [cursor=pointer]:
            - img [ref=e366]
            - text: Back
          - heading "New Pre-Project" [level=1] [ref=e368]:
            - img [ref=e369]
            - text: New Pre-Project
          - paragraph [ref=e372]: Register a tender-stage submission for pre-execution approval
        - generic [ref=e373]:
          - generic [ref=e375]:
            - generic [ref=e376]: "1"
            - generic [ref=e377]: Basic Info
          - generic [ref=e380]:
            - generic [ref=e381]: "2"
            - generic [ref=e382]: Budget
          - generic [ref=e385]:
            - generic [ref=e386]: "3"
            - generic [ref=e387]: Documents
          - generic [ref=e390]:
            - generic [ref=e391]: "4"
            - generic [ref=e392]: Review
        - generic [ref=e396]:
          - generic [ref=e397]:
            - generic [ref=e398]: Tender ID *
            - textbox "e.g. TDR/2026/HWY/004" [ref=e399]: TDR/2026/TEST/002
            - paragraph [ref=e400]: "Format: TDR/YEAR/DEPT/SEQ"
          - generic [ref=e401]:
            - generic [ref=e402]: Priority *
            - combobox [ref=e403]:
              - option "LOW"
              - option "MEDIUM"
              - option "HIGH" [selected]
              - option "CRITICAL"
          - generic [ref=e404]:
            - generic [ref=e405]: Project Title *
            - textbox "e.g. NH-46 Highway Widening Phase III" [active] [ref=e406]: Another Project
          - generic [ref=e407]:
            - generic [ref=e408]: Client / Organisation *
            - textbox "e.g. MPRDC" [ref=e409]
          - generic [ref=e410]:
            - generic [ref=e411]: Client Department Code
            - textbox "e.g. MPRDC/2026/BMP/HWY" [ref=e412]
          - generic [ref=e413]:
            - generic [ref=e414]: Division *
            - combobox [ref=e415]:
              - option "Select division…" [selected]
              - option "Infrastructure"
              - option "Water Resources"
              - option "Education"
              - option "Health"
              - option "Energy"
              - option "Transport"
          - generic [ref=e416]:
            - generic [ref=e417]: Assign Project Manager
            - combobox [ref=e418]:
              - option "Select PM…" [selected]
              - option "Bob Kumar"
              - option "Priya Singh"
              - option "Deepak Nair"
              - option "Anita Joshi"
              - option "Suresh Dev"
          - generic [ref=e419]:
            - generic [ref=e420]: Project Description *
            - textbox "Describe the scope, objectives, location, and key activities of this project…" [ref=e421]
        - generic [ref=e422]:
          - button "Cancel" [ref=e423] [cursor=pointer]:
            - img [ref=e424]
            - text: Cancel
          - button "Next" [disabled]:
            - text: Next
            - img
```

# Test source

```ts
  16  |   test('shows pipeline filter tabs', async ({ page }) => {
  17  |     await injectDevAuth(page);
  18  |     await page.goto('/preproject');
  19  |     await page.waitForLoadState('networkidle');
  20  |     // Pipeline tabs exist — use role+name to avoid matching other text
  21  |     await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible();
  22  |     await expect(page.getByRole('button', { name: /^Draft/ }).first()).toBeVisible();
  23  |     await expect(page.getByRole('button', { name: /^Approved/ }).first()).toBeVisible();
  24  |     await expect(page.getByRole('button', { name: /^Converted/ }).first()).toBeVisible();
  25  |   });
  26  | 
  27  |   test('search box filters results', async ({ page }) => {
  28  |     await injectDevAuth(page);
  29  |     await page.goto('/preproject');
  30  |     await page.waitForLoadState('networkidle');
  31  |     const searchInput = page.locator('input[placeholder*="Search"]');
  32  |     await searchInput.fill('Highway');
  33  |     await page.waitForTimeout(300);
  34  |     // After searching, other unrelated projects should not appear
  35  |     await expect(page.getByText('Rural Water Supply Pipeline Extension')).not.toBeVisible();
  36  |   });
  37  | 
  38  |   test('New Pre-Project button navigates to form', async ({ page }) => {
  39  |     await injectDevAuth(page);
  40  |     await page.goto('/preproject');
  41  |     await page.waitForLoadState('networkidle');
  42  |     await page.getByRole('button', { name: /new pre-project/i }).click();
  43  |     await expect(page).toHaveURL('/preproject/new');
  44  |   });
  45  | 
  46  |   test('clicking a project card navigates to detail', async ({ page }) => {
  47  |     await injectDevAuth(page);
  48  |     await page.goto('/preproject');
  49  |     await page.waitForLoadState('networkidle');
  50  |     // Click the first project card
  51  |     await page.locator('.cursor-pointer').first().click();
  52  |     await expect(page).toHaveURL(/\/preproject\//);
  53  |   });
  54  | 
  55  |   test('status filter shows correct subset', async ({ page }) => {
  56  |     await injectDevAuth(page);
  57  |     await page.goto('/preproject');
  58  |     await page.waitForLoadState('networkidle');
  59  |     // Click "Rejected" filter tab (button that starts with "Rejected")
  60  |     const rejectedBtn = page.locator('button').filter({ hasText: /^Rejected/ }).first();
  61  |     await rejectedBtn.click();
  62  |     await page.waitForTimeout(300);
  63  |     // The rejected project's rejection reason should be visible
  64  |     await expect(page.getByText('Budget exceeds allocated')).toBeVisible();
  65  |   });
  66  | });
  67  | 
  68  | // ── Pre-Project Form ──────────────────────────────────────────────────────────
  69  | 
  70  | test.describe('Pre-Project Form (multi-step)', () => {
  71  |   test('loads step 1 without crash', async ({ page }) => {
  72  |     await injectDevAuth(page);
  73  |     await page.goto('/preproject/new');
  74  |     await page.waitForLoadState('networkidle');
  75  |     await expect(page.locator('body')).not.toContainText('TypeError');
  76  |     await expect(page.getByText('Basic Info')).toBeVisible();
  77  |     await expect(page.getByText('Budget')).toBeVisible();
  78  |     await expect(page.getByText('Documents')).toBeVisible();
  79  |     await expect(page.getByText('Review')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('Next button disabled when required fields empty', async ({ page }) => {
  83  |     await injectDevAuth(page);
  84  |     await page.goto('/preproject/new');
  85  |     await page.waitForLoadState('networkidle');
  86  |     const nextBtn = page.getByRole('button', { name: /next/i });
  87  |     await expect(nextBtn).toBeDisabled();
  88  |   });
  89  | 
  90  |   test('fills step 1 and proceeds to step 2', async ({ page }) => {
  91  |     await injectDevAuth(page);
  92  |     await page.goto('/preproject/new');
  93  |     await page.waitForLoadState('networkidle');
  94  | 
  95  |     await page.locator('input[placeholder*="TDR"]').fill('TDR/2026/TEST/001');
  96  |     await page.locator('input[placeholder*="Highway"]').fill('Test Project Title');
  97  |     await page.locator('input[placeholder*="MPRDC"]').fill('Test Client');
  98  |     // select.nth(0)=Priority, nth(1)=Division, nth(2)=AssignedPM
  99  |     await page.locator('select').nth(1).selectOption('Infrastructure');
  100 |     await page.locator('textarea').first().fill('This is a test project description that is long enough.');
  101 | 
  102 |     await expect(page.getByRole('button', { name: /next/i })).toBeEnabled();
  103 |     await page.getByRole('button', { name: /next/i }).click();
  104 |     // Step 2 shows the budget label
  105 |     await expect(page.getByText('Total Estimated Budget').first()).toBeVisible();
  106 |   });
  107 | 
  108 |   test('back button returns to previous step', async ({ page }) => {
  109 |     await injectDevAuth(page);
  110 |     await page.goto('/preproject/new');
  111 |     await page.waitForLoadState('networkidle');
  112 | 
  113 |     // Fill step 1
  114 |     await page.locator('input[placeholder*="TDR"]').fill('TDR/2026/TEST/002');
  115 |     await page.locator('input[placeholder*="Highway"]').fill('Another Project');
> 116 |     await page.locator('input[placeholder*="MPRDC"]').fill('Client Name');
      |                                                       ^ Error: locator.fill: Error: strict mode violation: locator('input[placeholder*="MPRDC"]') resolved to 2 elements:
  117 |     await page.locator('select').nth(1).selectOption('Education');
  118 |     await page.locator('textarea').first().fill('Sufficient description text for validation.');
  119 |     await page.getByRole('button', { name: /next/i }).click();
  120 | 
  121 |     // Go back
  122 |     await page.getByRole('button', { name: /back/i }).click();
  123 |     await expect(page.getByText('Project Title').first()).toBeVisible();
  124 |   });
  125 | 
  126 |   test('cancel navigates back to list', async ({ page }) => {
  127 |     await injectDevAuth(page);
  128 |     await page.goto('/preproject/new');
  129 |     await page.waitForLoadState('networkidle');
  130 |     await page.getByRole('button', { name: /cancel/i }).click();
  131 |     await expect(page).toHaveURL('/preproject');
  132 |   });
  133 | });
  134 | 
  135 | // ── Pre-Project Detail ────────────────────────────────────────────────────────
  136 | 
  137 | test.describe('Pre-Project Detail', () => {
  138 |   test('loads without crash', async ({ page }) => {
  139 |     await injectDevAuth(page);
  140 |     await page.goto('/preproject/pp-001');
  141 |     await page.waitForLoadState('networkidle');
  142 |     await expect(page.locator('body')).not.toContainText('TypeError');
  143 |     await expect(page.locator('body')).not.toContainText('Cannot read properties');
  144 |   });
  145 | 
  146 |   test('shows all tabs', async ({ page }) => {
  147 |     await injectDevAuth(page);
  148 |     await page.goto('/preproject/pp-001');
  149 |     await page.waitForLoadState('networkidle');
  150 |     for (const tab of ['Overview', 'Workflow', 'Documents', 'Budget', 'Audit Trail']) {
  151 |       await expect(page.getByRole('button', { name: tab })).toBeVisible();
  152 |     }
  153 |   });
  154 | 
  155 |   test('Workflow tab shows approval stepper', async ({ page }) => {
  156 |     await injectDevAuth(page);
  157 |     await page.goto('/preproject/pp-001');
  158 |     await page.waitForLoadState('networkidle');
  159 |     await page.getByRole('button', { name: 'Workflow' }).click();
  160 |     await expect(page.getByText('Approval Pipeline').first()).toBeVisible();
  161 |     await expect(page.getByText('Core Review').first()).toBeVisible();
  162 |     await expect(page.getByText('CFO Review').first()).toBeVisible();
  163 |   });
  164 | 
  165 |   test('Documents tab lists files', async ({ page }) => {
  166 |     await injectDevAuth(page);
  167 |     await page.goto('/preproject/pp-001');
  168 |     await page.waitForLoadState('networkidle');
  169 |     await page.getByRole('button', { name: /Documents/ }).click();
  170 |     await expect(page.getByText('Detailed Project Report')).toBeVisible();
  171 |     await expect(page.getByText('Environmental Impact Assessment')).toBeVisible();
  172 |   });
  173 | 
  174 |   test('Budget tab shows breakdown bars', async ({ page }) => {
  175 |     await injectDevAuth(page);
  176 |     await page.goto('/preproject/pp-001');
  177 |     await page.waitForLoadState('networkidle');
  178 |     await page.getByRole('button', { name: 'Budget' }).click();
  179 |     await expect(page.getByText('Civil Works')).toBeVisible();
  180 |     await expect(page.getByText('Labour')).toBeVisible();
  181 |   });
  182 | 
  183 |   test('Audit Trail tab shows history', async ({ page }) => {
  184 |     await injectDevAuth(page);
  185 |     await page.goto('/preproject/pp-001');
  186 |     await page.waitForLoadState('networkidle');
  187 |     await page.getByRole('button', { name: 'Audit Trail' }).click();
  188 |     await expect(page.getByText('Immutable Audit Trail')).toBeVisible();
  189 |     await expect(page.getByText('SUBMITTED')).toBeVisible();
  190 |     await expect(page.getByText('APPROVED')).toBeVisible();
  191 |   });
  192 | 
  193 |   test('back button returns to list', async ({ page }) => {
  194 |     await injectDevAuth(page);
  195 |     await page.goto('/preproject/pp-001');
  196 |     await page.waitForLoadState('networkidle');
  197 |     await page.getByText('Back to Pre-Projects').click();
  198 |     await expect(page).toHaveURL('/preproject');
  199 |   });
  200 | 
  201 |   test('shows not found for invalid id', async ({ page }) => {
  202 |     await injectDevAuth(page);
  203 |     await page.goto('/preproject/invalid-id-xyz');
  204 |     await page.waitForLoadState('networkidle');
  205 |     await expect(page.getByText('not found')).toBeVisible();
  206 |   });
  207 | });
  208 | 
  209 | // ── Approval Inbox (enhanced) ─────────────────────────────────────────────────
  210 | 
  211 | test.describe('Approval Inbox', () => {
  212 |   test('loads with tabs', async ({ page }) => {
  213 |     await injectDevAuth(page);
  214 |     await page.goto('/admin/approvals');
  215 |     await page.waitForLoadState('networkidle');
  216 |     await expect(page.locator('body')).not.toContainText('TypeError');
```