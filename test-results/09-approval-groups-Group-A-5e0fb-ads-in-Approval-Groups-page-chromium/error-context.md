# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-approval-groups.spec.ts >> Group Approval Dashboard >> Config Audit tab loads in Approval Groups page
- Location: e2e\09-approval-groups.spec.ts:226:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('GROUP_CREATED')
Expected: visible
Error: strict mode violation: getByText('GROUP_CREATED') resolved to 2 elements:
    1) <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">GROUP_CREATED</span> aka getByText('GROUP_CREATED').first()
    2) <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">GROUP_CREATED</span> aka getByText('GROUP_CREATED').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('GROUP_CREATED')

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
          - button "Config Audit" [active] [ref=e405] [cursor=pointer]:
            - img [ref=e406]
            - text: Config Audit
        - generic [ref=e409]:
          - paragraph [ref=e410]: Configuration changes made by administrators
          - generic [ref=e411]:
            - generic [ref=e412]: P
            - generic [ref=e413]:
              - generic [ref=e414]:
                - generic [ref=e415]: Priyanka Bansal
                - generic [ref=e416]: GROUP_CREATED
                - generic [ref=e417]: Group "Core Team" created
              - generic [ref=e418]: "{\"approvalType\":\"QUORUM\"}"
              - generic [ref=e419]: 15/01/2025
          - generic [ref=e420]:
            - generic [ref=e421]: P
            - generic [ref=e422]:
              - generic [ref=e423]:
                - generic [ref=e424]: Priyanka Bansal
                - generic [ref=e425]: MEMBER_ADDED
              - generic [ref=e426]: "{\"userId\":\"dev-division_admin-id\",\"title\":\"Division Head\"}"
              - generic [ref=e427]: 15/01/2025
          - generic [ref=e428]:
            - generic [ref=e429]: P
            - generic [ref=e430]:
              - generic [ref=e431]:
                - generic [ref=e432]: Priyanka Bansal
                - generic [ref=e433]: GROUP_CREATED
                - generic [ref=e434]: Group "CFO Group" created
              - generic [ref=e435]: "{\"approvalType\":\"ANY\"}"
              - generic [ref=e436]: 15/01/2025
          - generic [ref=e437]:
            - generic [ref=e438]: P
            - generic [ref=e439]:
              - generic [ref=e440]:
                - generic [ref=e441]: Priyanka Bansal
                - generic [ref=e442]: STEP_UPSERTED
              - generic [ref=e443]: "{\"name\":\"Core Team Review\",\"stepOrder\":1}"
              - generic [ref=e444]: 15/01/2025
          - generic [ref=e445]:
            - generic [ref=e446]: P
            - generic [ref=e447]:
              - generic [ref=e448]:
                - generic [ref=e449]: Priyanka Bansal
                - generic [ref=e450]: GROUP_UPDATED
              - generic [ref=e451]: "{\"slaHours\":48}"
              - generic [ref=e452]: 16/01/2025
```

# Test source

```ts
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
> 230 |     await expect(page.getByText('GROUP_CREATED')).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  231 |     await expect(page.getByText('MEMBER_ADDED')).toBeVisible();
  232 |   });
  233 | });
  234 | 
```