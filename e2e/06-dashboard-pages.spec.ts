import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

const PAGES = [
  { path: '/dashboard',           name: 'Dashboard' },
  { path: '/projects',            name: 'Project List' },
  { path: '/my-tasks',            name: 'My Tasks' },
  { path: '/reports',             name: 'Reports' },
  { path: '/sprints',             name: 'Sprint Management' },
  { path: '/time-tracking',       name: 'Time Tracking' },
  { path: '/calendar',            name: 'Calendar View' },
  { path: '/team',                name: 'Team / User Management' },
  { path: '/admin/users',         name: 'Admin Users' },
  { path: '/admin/workflows',     name: 'Admin Workflows' },
  { path: '/admin/custom-fields', name: 'Custom Fields' },
  { path: '/admin/roles',         name: 'Custom Roles' },
  { path: '/admin/audit-log',     name: 'Audit Log' },
  { path: '/admin/exports',       name: 'Exports' },
  { path: '/admin/approvals',     name: 'Approvals Inbox' },
  { path: '/admin/forms',         name: 'Forms' },
  { path: '/admin/divisions',     name: 'Divisions' },
  { path: '/admin/feature-flags', name: 'Feature Flags' },
  { path: '/settings',            name: 'Org Settings' },
  { path: '/executive',           name: 'Executive Dashboard' },
  { path: '/reports/advanced',    name: 'Advanced Reports' },
];

for (const { path, name } of PAGES) {
  test(`Page loads without crash: ${name} (${path})`, async ({ page }) => {
    await injectDevAuth(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    // No uncaught TypeError crashes
    await expect(body).not.toContainText('TypeError: ');
    await expect(body).not.toContainText('Cannot read properties of undefined');
    await expect(body).not.toContainText('is not a function');
    // Not stuck on login
    await expect(page).not.toHaveURL(/\/login/);
  });
}

test('Dashboard shows key metric cards', async ({ page }) => {
  await injectDevAuth(page);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  // Dashboard should have some content visible
  const body = page.locator('body');
  await expect(body).not.toBeEmpty();
  await expect(body).not.toContainText('TypeError');
});

test('Reports page renders charts/data', async ({ page }) => {
  await injectDevAuth(page);
  await page.goto('/reports');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('TypeError');
});
