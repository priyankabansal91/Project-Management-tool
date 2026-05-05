# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-preproject-workflow.spec.ts >> Workflow Governance >> SLA Policy tab shows editable thresholds
- Location: e2e\08-preproject-workflow.spec.ts:321:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Warn after (hours)')
Expected: visible
Error: strict mode violation: getByText('Warn after (hours)') resolved to 2 elements:
    1) <label class="text-xs text-muted-foreground">Warn after (hours)</label> aka getByText('Warn after (hours)').first()
    2) <label class="text-xs text-muted-foreground">Warn after (hours)</label> aka getByText('Warn after (hours)').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Warn after (hours)')

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
            - heading "Workflow Governance" [level=1] [ref=e366]:
              - img [ref=e367]
              - text: Workflow Governance
            - paragraph [ref=e369]: SLA policies, escalation chains, delegation, and compliance controls
          - button "Admin Override" [ref=e370] [cursor=pointer]:
            - img [ref=e371]
            - text: Admin Override
        - generic [ref=e374]:
          - button "Overview" [ref=e375] [cursor=pointer]:
            - img [ref=e376]
            - text: Overview
          - button "SLA Policy" [active] [ref=e378] [cursor=pointer]:
            - img [ref=e379]
            - text: SLA Policy
          - button "Escalation Chain" [ref=e382] [cursor=pointer]:
            - img [ref=e383]
            - text: Escalation Chain
          - button "Active Delegates" [ref=e387] [cursor=pointer]:
            - img [ref=e388]
            - text: Active Delegates
          - button "Override History" [ref=e393] [cursor=pointer]:
            - img [ref=e394]
            - text: Override History
        - generic [ref=e398]:
          - heading "SLA Policy Configuration" [level=3] [ref=e400]:
            - img [ref=e401]
            - text: SLA Policy Configuration
          - generic [ref=e404]:
            - generic [ref=e405]:
              - paragraph [ref=e406]: Core Team Review
              - generic [ref=e407]:
                - generic [ref=e408]:
                  - text: Warn after (hours)
                  - spinbutton [ref=e409]: "36"
                - generic [ref=e410]:
                  - text: Escalate after (hours)
                  - spinbutton [ref=e411]: "48"
              - generic [ref=e412] [cursor=pointer]:
                - checkbox "Auto-escalate to Org Admin when threshold exceeded" [checked] [ref=e413]
                - text: Auto-escalate to Org Admin when threshold exceeded
            - generic [ref=e414]:
              - paragraph [ref=e415]: CFO Approval
              - generic [ref=e416]:
                - generic [ref=e417]:
                  - text: Warn after (hours)
                  - spinbutton [ref=e418]: "48"
                - generic [ref=e419]:
                  - text: Escalate after (hours)
                  - spinbutton [ref=e420]: "72"
              - generic [ref=e421] [cursor=pointer]:
                - checkbox "Auto-escalate to Org Admin when threshold exceeded" [checked] [ref=e422]
                - text: Auto-escalate to Org Admin when threshold exceeded
            - button "Save SLA Policy" [ref=e424] [cursor=pointer]:
              - img [ref=e425]
              - text: Save SLA Policy
```

# Test source

```ts
  228 |     await page.waitForLoadState('networkidle');
  229 |     await page.getByText('All Pending').click();
  230 |     await expect(page.getByText('Highway Widening Phase II')).toBeVisible();
  231 |     await expect(page.getByText('Bridge Rehabilitation')).toBeVisible();
  232 |   });
  233 | 
  234 |   test('Overdue tab shows overdue items', async ({ page }) => {
  235 |     await injectDevAuth(page);
  236 |     await page.goto('/admin/approvals');
  237 |     await page.waitForLoadState('networkidle');
  238 |     await page.locator('button').filter({ hasText: /^Overdue/ }).first().click();
  239 |     await page.waitForTimeout(200);
  240 |     // Body should either show items or empty state
  241 |     await expect(page.locator('body')).not.toContainText('TypeError');
  242 |   });
  243 | 
  244 |   test('approval card shows SLA progress bar', async ({ page }) => {
  245 |     await injectDevAuth(page, 'dev-division_admin-id');
  246 |     await page.goto('/admin/approvals');
  247 |     await page.waitForLoadState('networkidle');
  248 |     await page.getByText('All Pending').click();
  249 |     await expect(page.locator('.h-1\\.5').first()).toBeVisible();
  250 |   });
  251 | 
  252 |   test('Completed tab shows audit log link', async ({ page }) => {
  253 |     await injectDevAuth(page);
  254 |     await page.goto('/admin/approvals');
  255 |     await page.waitForLoadState('networkidle');
  256 |     await page.locator('button').filter({ hasText: /^Completed/ }).first().click();
  257 |     // Scope to <main> to avoid matching the sidebar "Audit Log" nav item
  258 |     await expect(page.locator('main').getByText('Audit Log').first()).toBeVisible();
  259 |   });
  260 | });
  261 | 
  262 | // ── Workflow Monitor ──────────────────────────────────────────────────────────
  263 | 
  264 | test.describe('Workflow Monitor', () => {
  265 |   test('loads without crash with KPI cards', async ({ page }) => {
  266 |     await injectDevAuth(page);
  267 |     await page.goto('/workflow/monitor');
  268 |     await page.waitForLoadState('networkidle');
  269 |     await expect(page.locator('body')).not.toContainText('TypeError');
  270 |     await expect(page.getByText('Pending Approvals')).toBeVisible();
  271 |     await expect(page.getByText('Overdue').first()).toBeVisible();
  272 |     await expect(page.getByText('On-Time Rate')).toBeVisible();
  273 |   });
  274 | 
  275 |   test('shows instance table with SLA indicators', async ({ page }) => {
  276 |     await injectDevAuth(page);
  277 |     await page.goto('/workflow/monitor');
  278 |     await page.waitForLoadState('networkidle');
  279 |     await expect(page.getByText('Active Instances')).toBeVisible();
  280 |     await expect(page.getByText('Highway Widening Phase II')).toBeVisible();
  281 |   });
  282 | 
  283 |   test('step filter works', async ({ page }) => {
  284 |     await injectDevAuth(page);
  285 |     await page.goto('/workflow/monitor');
  286 |     await page.waitForLoadState('networkidle');
  287 |     await page.getByRole('button', { name: 'Core Review' }).click();
  288 |     await page.waitForTimeout(200);
  289 |     await expect(page.locator('body')).not.toContainText('TypeError');
  290 |   });
  291 | 
  292 |   test('My Queue button navigates to approvals', async ({ page }) => {
  293 |     await injectDevAuth(page);
  294 |     await page.goto('/workflow/monitor');
  295 |     await page.waitForLoadState('networkidle');
  296 |     await page.getByRole('button', { name: /My Queue/i }).click();
  297 |     await expect(page).toHaveURL('/admin/approvals');
  298 |   });
  299 | });
  300 | 
  301 | // ── Workflow Governance ───────────────────────────────────────────────────────
  302 | 
  303 | test.describe('Workflow Governance', () => {
  304 |   test('loads without crash', async ({ page }) => {
  305 |     await injectDevAuth(page);
  306 |     await page.goto('/workflow/governance');
  307 |     await page.waitForLoadState('networkidle');
  308 |     await expect(page.locator('body')).not.toContainText('TypeError');
  309 |     await expect(page.getByText('Workflow Governance')).toBeVisible();
  310 |   });
  311 | 
  312 |   test('shows all governance tabs', async ({ page }) => {
  313 |     await injectDevAuth(page);
  314 |     await page.goto('/workflow/governance');
  315 |     await page.waitForLoadState('networkidle');
  316 |     for (const tab of ['Overview', 'SLA Policy', 'Escalation Chain', 'Active Delegates', 'Override History']) {
  317 |       await expect(page.getByRole('button', { name: tab })).toBeVisible();
  318 |     }
  319 |   });
  320 | 
  321 |   test('SLA Policy tab shows editable thresholds', async ({ page }) => {
  322 |     await injectDevAuth(page);
  323 |     await page.goto('/workflow/governance');
  324 |     await page.waitForLoadState('networkidle');
  325 |     await page.getByRole('button', { name: 'SLA Policy' }).click();
  326 |     await expect(page.getByText('Core Team Review')).toBeVisible();
  327 |     await expect(page.getByText('CFO Approval')).toBeVisible();
> 328 |     await expect(page.getByText('Warn after (hours)')).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  329 |   });
  330 | 
  331 |   test('Escalation Chain tab shows chain', async ({ page }) => {
  332 |     await injectDevAuth(page);
  333 |     await page.goto('/workflow/governance');
  334 |     await page.waitForLoadState('networkidle');
  335 |     await page.getByRole('button', { name: 'Escalation Chain' }).click();
  336 |     await expect(page.getByText('Division Admin').first()).toBeVisible();
  337 |     await expect(page.getByText('Org Admin').first()).toBeVisible();
  338 |   });
  339 | 
  340 |   test('Override History tab shows past overrides', async ({ page }) => {
  341 |     await injectDevAuth(page);
  342 |     await page.goto('/workflow/governance');
  343 |     await page.waitForLoadState('networkidle');
  344 |     await page.getByRole('button', { name: 'Override History' }).click();
  345 |     // Tab button + section heading both contain "Override History" — first() is fine
  346 |     await expect(page.getByText('Override History').first()).toBeVisible();
  347 |   });
  348 | 
  349 |   test('Admin Override button visible for org_admin', async ({ page }) => {
  350 |     await injectDevAuth(page, 'dev-org_admin-id');
  351 |     await page.goto('/workflow/governance');
  352 |     await page.waitForLoadState('networkidle');
  353 |     await expect(page.getByRole('button', { name: /Admin Override/i })).toBeVisible();
  354 |   });
  355 | });
  356 | 
  357 | // ── Workflow Training Guide ───────────────────────────────────────────────────
  358 | 
  359 | test.describe('Workflow Training Guide', () => {
  360 |   test('loads without crash', async ({ page }) => {
  361 |     await injectDevAuth(page);
  362 |     await page.goto('/workflow/training');
  363 |     await page.waitForLoadState('networkidle');
  364 |     await expect(page.locator('body')).not.toContainText('TypeError');
  365 |     await expect(page.getByText('Workflow Training Guide')).toBeVisible();
  366 |   });
  367 | 
  368 |   test('shows all role selector cards', async ({ page }) => {
  369 |     await injectDevAuth(page);
  370 |     await page.goto('/workflow/training');
  371 |     await page.waitForLoadState('networkidle');
  372 |     await expect(page.getByText('Project Manager')).toBeVisible();
  373 |     await expect(page.getByText('Division Head')).toBeVisible();
  374 |     await expect(page.getByText('CFO / Executive')).toBeVisible();
  375 |     await expect(page.getByText('Org Admin').first()).toBeVisible();
  376 |   });
  377 | 
  378 |   test('switching roles updates guide content', async ({ page }) => {
  379 |     await injectDevAuth(page);
  380 |     await page.goto('/workflow/training');
  381 |     await page.waitForLoadState('networkidle');
  382 |     await page.getByText('Division Head').click();
  383 |     await expect(page.getByText("Don't approve without reading").first()).toBeVisible();
  384 |   });
  385 | 
  386 |   test('FAQ items expand on click', async ({ page }) => {
  387 |     await injectDevAuth(page);
  388 |     await page.goto('/workflow/training');
  389 |     await page.waitForLoadState('networkidle');
  390 |     const firstFaq = page.locator('button').filter({ hasText: /My project was sent back/ }).first();
  391 |     await firstFaq.click();
  392 |     await expect(page.getByText('Open the project, read the')).toBeVisible();
  393 |   });
  394 | });
  395 | 
  396 | // ── Governance Dashboard ──────────────────────────────────────────────────────
  397 | 
  398 | test.describe('Governance Dashboard', () => {
  399 |   test('loads without crash with KPIs', async ({ page }) => {
  400 |     await injectDevAuth(page);
  401 |     await page.goto('/governance');
  402 |     await page.waitForLoadState('networkidle');
  403 |     await expect(page.locator('body')).not.toContainText('TypeError');
  404 |     await expect(page.getByText('Total Planned Budget')).toBeVisible();
  405 |     await expect(page.getByText('Budget Alerts')).toBeVisible();
  406 |     await expect(page.getByText('Overdue Milestones')).toBeVisible();
  407 |   });
  408 | 
  409 |   test('Budget Tracker tab shows project cards', async ({ page }) => {
  410 |     await injectDevAuth(page);
  411 |     await page.goto('/governance');
  412 |     await page.waitForLoadState('networkidle');
  413 |     await expect(page.getByText('Bridge Rehabilitation')).toBeVisible();
  414 |     await expect(page.getByText('Rural Water Supply Pipeline')).toBeVisible();
  415 |   });
  416 | 
  417 |   test('Milestone Approvals tab works', async ({ page }) => {
  418 |     await injectDevAuth(page);
  419 |     await page.goto('/governance');
  420 |     await page.waitForLoadState('networkidle');
  421 |     await page.getByRole('button', { name: 'Milestone Approvals' }).click();
  422 |     await expect(page.locator('body')).not.toContainText('TypeError');
  423 |   });
  424 | 
  425 |   test('division filter narrows results', async ({ page }) => {
  426 |     await injectDevAuth(page);
  427 |     await page.goto('/governance');
  428 |     await page.waitForLoadState('networkidle');
```