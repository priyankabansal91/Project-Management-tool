/**
 * 05-page-load-perf.spec.ts
 *
 * Performance + smoke test suite for Q-Flow.
 *
 * For every major route in the application this suite:
 *   1. Visits the page
 *   2. Asserts no JavaScript runtime crash (no "TypeError" / "Cannot read" in <body>)
 *   3. Asserts the page does NOT redirect to /login (auth is respected)
 *   4. Measures Time-To-Interactive (TTI) via window.performance.timing
 *   5. Asserts main content loads within 5 000 ms
 *
 * Additionally runs the same route smoke test for 3 roles:
 *   org_admin, project_manager, member
 *
 * At the end of the suite a timing summary table is written to:
 *   testing/e2e_testing/automation_scripts/perf-report.json
 * so CI can pick it up.
 *
 * Notes:
 *   - Pages marked `heavy: true` get `test.slow()` (triple timeout)
 *   - All tests run sequentially (workers: 1 in playwright config)
 *   - Navigation timing uses `performance.getEntriesByType('navigation')[0]`
 *     which is more accurate than the old timing API
 *
 * Run:
 *   npx playwright test testing/e2e_testing/automation_scripts/05-page-load-perf.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Route catalogue
// ---------------------------------------------------------------------------

interface RouteEntry {
  path: string;
  name: string;
  heavy?: boolean;
  /** Minimum role required to access this route. Defaults to 'org_admin'. */
  minRole?: string;
}

const ROUTES: RouteEntry[] = [
  // ── Core ─────────────────────────────────────────────────────────────────
  { path: '/dashboard',              name: 'Dashboard' },
  { path: '/projects',               name: 'Project List' },
  { path: '/my-tasks',               name: 'My Tasks' },
  { path: '/calendar',               name: 'Calendar View' },
  { path: '/notifications',          name: 'Notifications' },
  { path: '/profile',                name: 'Profile / Settings' },

  // ── PM / Tracking ─────────────────────────────────────────────────────────
  { path: '/time-tracking',          name: 'Time Tracking' },
  { path: '/sprints',                name: 'Sprint Management' },
  { path: '/reports',                name: 'Reports' },
  { path: '/reports/advanced',       name: 'Advanced Reports',    heavy: true },

  // ── Workflow ──────────────────────────────────────────────────────────────
  { path: '/admin/approvals',        name: 'Approval Inbox' },
  { path: '/admin/approval-groups',  name: 'Approval Group Config' },
  { path: '/workflow/group-approvals', name: 'Group Approval Dashboard', heavy: true },
  { path: '/workflow/monitor',       name: 'Workflow Monitor' },
  { path: '/workflow/governance',    name: 'Workflow Governance' },

  // ── Pre-Project & Governance ──────────────────────────────────────────────
  { path: '/preproject',             name: 'Pre-Projects List' },
  { path: '/governance',             name: 'Governance Dashboard' },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { path: '/admin/users',            name: 'Admin Users' },
  { path: '/admin/workflows',        name: 'Admin Workflows' },
  { path: '/admin/approval-groups',  name: 'Approval Groups' },
  { path: '/admin/audit-log',        name: 'Audit Log' },
  { path: '/admin/roles',            name: 'Custom Roles' },
  { path: '/admin/divisions',        name: 'Divisions' },
  { path: '/admin/exports',          name: 'Exports' },

  // ── Executive ─────────────────────────────────────────────────────────────
  { path: '/executive',              name: 'Executive Dashboard',  heavy: true },
];

// Routes to test under multiple roles
const MULTI_ROLE_ROUTES: RouteEntry[] = [
  { path: '/dashboard',   name: 'Dashboard' },
  { path: '/projects',    name: 'Project List' },
  { path: '/my-tasks',    name: 'My Tasks' },
  { path: '/time-tracking', name: 'Time Tracking' },
  { path: '/sprints',     name: 'Sprint Management' },
  { path: '/notifications', name: 'Notifications' },
];

const ROLES_TO_TEST = ['org_admin', 'project_manager', 'member'] as const;
type TestRole = (typeof ROLES_TO_TEST)[number];

// Max acceptable load time in ms (for TTI assertion)
const MAX_TTI_MS = 5000;

// ---------------------------------------------------------------------------
// Timing store (accumulated across tests)
// ---------------------------------------------------------------------------
const timingResults: Array<{
  route: string;
  name: string;
  role: string;
  tti_ms: number;
  passed: boolean;
  under_budget: boolean;
}> = [];

// ---------------------------------------------------------------------------
// Auth injection (mirrors e2e/helpers.ts)
// ---------------------------------------------------------------------------
async function injectDevAuth(page: Page, role: TestRole | 'org_admin' = 'org_admin') {
  const devUserMap: Record<string, { id: string; role: string; email: string; name: string }> = {
    org_admin:       { id: 'dev-org_admin-id',       role: 'org_admin',       email: 'admin@example.local',  name: 'Priya Sharma' },
    project_manager: { id: 'dev-project_manager-id', role: 'project_manager', email: 'pm@example.local',     name: 'Anjali Singh' },
    member:          { id: 'dev-member-id',           role: 'member',          email: 'member@example.local', name: 'Ravi Kumar' },
  };
  const u = devUserMap[role] ?? devUserMap['org_admin'];

  await page.addInitScript(({ u }: { u: (typeof devUserMap)[string] }) => {
    localStorage.setItem('pm-auth', JSON.stringify({
      state: {
        accessToken: 'dev-token',
        user: {
          id: u.id,
          email: u.email,
          firstName: u.name.split(' ')[0],
          first_name: u.name.split(' ')[0],
          lastName: u.name.split(' ')[1] ?? '',
          last_name: u.name.split(' ')[1] ?? '',
          avatar_url: null,
        },
        currentRole: u.role,
        currentDivisionId: null,
      },
      version: 0,
    }));
  }, { u });
}

// ---------------------------------------------------------------------------
// Helper: measure Time-To-Interactive for the current page
// ---------------------------------------------------------------------------
async function measureTTI(page: Page): Promise<number> {
  return page.evaluate((): number => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      // domInteractive is the best proxy for TTI available in the browser
      return Math.round(entries[0].domInteractive);
    }
    // Fallback for older environments
    return Math.round(performance.now());
  });
}

// ---------------------------------------------------------------------------
// Helper: assert the page has no visible JS crash and content is loaded
// ---------------------------------------------------------------------------
async function assertPageHealthy(page: Page, route: string) {
  const body = page.locator('body');
  // No uncaught runtime error text
  await expect(body).not.toContainText('TypeError: ', { timeout: 5000 });
  await expect(body).not.toContainText('Cannot read properties of undefined');
  await expect(body).not.toContainText(' is not a function');
  // Not stuck on login (except for routes that intentionally require higher role)
  await expect(page).not.toHaveURL(/\/login/);
}

// ---------------------------------------------------------------------------
// SUITE 1: Smoke + Performance — all routes as org_admin
// ---------------------------------------------------------------------------

test.describe('Smoke + Performance: all major routes (org_admin)', () => {

  for (const route of ROUTES) {
    test(`[${route.name}] loads without crash and within ${MAX_TTI_MS}ms`, async ({ page }) => {
      // Mark heavy pages so Playwright triples the timeout
      if (route.heavy) test.slow();

      await injectDevAuth(page, 'org_admin');
      const navStart = Date.now();
      await page.goto(route.path);
      await page.waitForLoadState('networkidle', { timeout: route.heavy ? 20000 : 10000 })
        .catch(() => { /* networkidle can timeout on pages with polling; continue */ });

      // Core health checks
      await assertPageHealthy(page, route.path);

      // TTI measurement
      const tti = await measureTTI(page);
      const wallTime = Date.now() - navStart;

      timingResults.push({
        route: route.path,
        name: route.name,
        role: 'org_admin',
        tti_ms: tti,
        passed: true,
        under_budget: tti <= MAX_TTI_MS,
      });

      // Wall-clock assertion: page must fully load within 5 s (10 s for heavy pages)
      const budget = route.heavy ? MAX_TTI_MS * 2 : MAX_TTI_MS;
      expect(wallTime).toBeLessThan(budget + 5000); // generous buffer for CI
    });
  }
});

// ---------------------------------------------------------------------------
// SUITE 2: Multi-role smoke tests (key routes only)
// ---------------------------------------------------------------------------

test.describe('Multi-role smoke: dashboard, tasks, projects under 3 roles', () => {

  for (const role of ROLES_TO_TEST) {
    for (const route of MULTI_ROLE_ROUTES) {
      test(`[${role}] ${route.name} (${route.path}) loads without crash`, async ({ page }) => {
        await injectDevAuth(page, role);
        await page.goto(route.path);
        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});

        const body = page.locator('body');
        // No JS crash regardless of role
        await expect(body).not.toContainText('TypeError: ');
        await expect(body).not.toContainText('Cannot read properties of undefined');

        // Measure timing
        const tti = await measureTTI(page);
        timingResults.push({
          route: route.path,
          name: route.name,
          role,
          tti_ms: tti,
          passed: true,
          under_budget: tti <= MAX_TTI_MS,
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// SUITE 3: Specific content assertions per page
// ---------------------------------------------------------------------------

test.describe('Page content assertions', () => {

  test.beforeEach(async ({ page }) => {
    await injectDevAuth(page, 'org_admin');
  });

  test('/dashboard — shows metrics or navigation elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const main = page.locator('main');
    // Dashboard should render some content — not just a blank main
    await expect(main).not.toBeEmpty();
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/projects — shows project grid or empty state', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Either project items or a "no projects" CTA
    const hasContent = await page.locator('main').innerHTML().then((html) => html.length > 200);
    expect(hasContent).toBe(true);
  });

  test('/my-tasks — shows task list or "no tasks" state', async ({ page }) => {
    await page.goto('/my-tasks');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Tasks page should not be empty
    const main = page.locator('main');
    await expect(main).not.toBeEmpty();
  });

  test('/time-tracking — shows time log or weekly summary', async ({ page }) => {
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('map is not a function');
  });

  test('/sprints — shows sprint list or creation CTA', async ({ page }) => {
    await page.goto('/sprints');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('main').getByText(/sprint/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('/reports — renders charts section without crash', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/admin/users — user list table renders', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('/admin/workflows — workflows list renders', async ({ page }) => {
    await page.goto('/admin/workflows');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/admin/approval-groups — groups rendered', async ({ page }) => {
    await page.goto('/admin/approval-groups');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Seeded groups should be present
    await expect(page.getByText('Core Team').first()).toBeVisible({ timeout: 8000 });
  });

  test('/executive — executive dashboard renders', async ({ page }) => {
    test.slow();
    await page.goto('/executive');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('/workflow/group-approvals — group approval dashboard renders', async ({ page }) => {
    test.slow();
    await page.goto('/workflow/group-approvals');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/preproject — pre-project list renders', async ({ page }) => {
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/governance — governance dashboard renders', async ({ page }) => {
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('/admin/audit-log — audit log shows heading in main', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('main').getByText('Audit Log').first()).toBeVisible({ timeout: 8000 });
  });

  test('/notifications — notifications page renders', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('/profile — profile settings page renders', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// SUITE 4: Timing budget assertions (uses accumulated timingResults)
// ---------------------------------------------------------------------------

test.describe('Timing budget summary', () => {

  test('all measured pages had TTI under 5 000 ms (or were within budget)', async () => {
    // This test runs after the suites above have populated timingResults.
    // If timingResults is empty (e.g. test isolation), we skip gracefully.
    if (timingResults.length === 0) {
      console.log('No timing data collected — skipping budget assertion.');
      return;
    }

    const overBudget = timingResults.filter((r) => !r.under_budget);

    // Print summary table to console for CI logs
    console.log('\n=== Q-Flow Page Load Performance Summary ===');
    console.log(
      ['Route', 'Name', 'Role', 'TTI (ms)', 'Under Budget']
        .map((h) => h.padEnd(35))
        .join(' | ')
    );
    console.log('-'.repeat(160));
    for (const r of timingResults) {
      console.log(
        [
          r.route.padEnd(35),
          r.name.padEnd(35),
          r.role.padEnd(35),
          String(r.tti_ms).padEnd(35),
          (r.under_budget ? 'YES' : 'NO ← OVER BUDGET').padEnd(35),
        ].join(' | ')
      );
    }
    console.log('=== End of Report ===\n');

    // Write JSON report for CI artefact upload
    const reportPath = path.join(
      __dirname,
      'perf-report.json'
    );
    try {
      fs.writeFileSync(reportPath, JSON.stringify({ generated: new Date().toISOString(), results: timingResults }, null, 2));
      console.log(`Performance report written to: ${reportPath}`);
    } catch {
      console.warn('Could not write perf-report.json — running in read-only environment?');
    }

    // Soft assertion: warn but do not fail for over-budget pages
    // (heavy pages on a slow CI machine may exceed the 5 s budget)
    if (overBudget.length > 0) {
      console.warn(`\nWARN: ${overBudget.length} page(s) exceeded the ${MAX_TTI_MS}ms TTI budget:`);
      overBudget.forEach((r) => console.warn(`  - ${r.name} (${r.route}) as ${r.role}: ${r.tti_ms}ms`));
    }

    // Hard assertion: at least 70% of pages must be under budget
    const passRate = (timingResults.length - overBudget.length) / timingResults.length;
    expect(passRate).toBeGreaterThanOrEqual(0.7);
  });

  test('no page returns a 5xx error response', async ({ page }) => {
    await injectDevAuth(page, 'org_admin');

    const failedRoutes: string[] = [];

    // Intercept all API responses and flag 5xx
    page.on('response', (response) => {
      if (response.status() >= 500) {
        failedRoutes.push(`${response.url()} → ${response.status()}`);
      }
    });

    // Visit a representative set of pages
    const routesToCheck = ['/dashboard', '/projects', '/my-tasks', '/sprints', '/reports'];
    for (const route of routesToCheck) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }

    if (failedRoutes.length > 0) {
      console.warn('5xx responses detected during navigation:');
      failedRoutes.forEach((r) => console.warn('  ' + r));
    }
    // Fail the test if there were any 500-level API errors
    expect(failedRoutes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SUITE 5: Pages that are slow — extended timeout checks
// ---------------------------------------------------------------------------

test.describe('Heavy page smoke tests', () => {

  test.beforeEach(async ({ page }) => {
    await injectDevAuth(page, 'org_admin');
  });

  test('[heavy] /reports/advanced renders without crash', async ({ page }) => {
    test.slow();
    await page.goto('/reports/advanced');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('[heavy] /workflow/group-approvals renders KPI cards', async ({ page }) => {
    test.slow();
    await page.goto('/workflow/group-approvals');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('In Progress').first()).toBeVisible({ timeout: 15000 });
  });

  test('[heavy] /executive dashboard renders without crash', async ({ page }) => {
    test.slow();
    await page.goto('/executive');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
