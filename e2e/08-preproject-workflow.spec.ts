import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

// ── Pre-Project List ──────────────────────────────────────────────────────────

test.describe('Pre-Project List', () => {
  test('loads without crash and shows stat cards', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('shows pipeline filter tabs', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    // Pipeline tabs exist — use role+name to avoid matching other text
    await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Draft/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Approved/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Converted/ }).first()).toBeVisible();
  });

  test('search box filters results', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Highway');
    await page.waitForTimeout(300);
    // After searching, other unrelated projects should not appear
    await expect(page.getByText('Rural Water Supply Pipeline Extension')).not.toBeVisible();
  });

  test('New Pre-Project button navigates to form', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /new pre-project/i }).click();
    await expect(page).toHaveURL('/preproject/new');
  });

  test('clicking a project card navigates to detail', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    // Click the first project card
    await page.locator('.cursor-pointer').first().click();
    await expect(page).toHaveURL(/\/preproject\//);
  });

  test('status filter shows correct subset', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject');
    await page.waitForLoadState('networkidle');
    // Click "Rejected" filter tab (button that starts with "Rejected")
    const rejectedBtn = page.locator('button').filter({ hasText: /^Rejected/ }).first();
    await rejectedBtn.click();
    await page.waitForTimeout(300);
    // The rejected project's rejection reason should be visible
    await expect(page.getByText('Budget exceeds allocated')).toBeVisible();
  });
});

// ── Pre-Project Form ──────────────────────────────────────────────────────────

test.describe('Pre-Project Form (multi-step)', () => {
  test('loads step 1 without crash', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('Basic Info')).toBeVisible();
    await expect(page.getByText('Budget')).toBeVisible();
    await expect(page.getByText('Documents')).toBeVisible();
    await expect(page.getByText('Review')).toBeVisible();
  });

  test('Next button disabled when required fields empty', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/new');
    await page.waitForLoadState('networkidle');
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('fills step 1 and proceeds to step 2', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="TDR"]').fill('TDR/2026/TEST/001');
    await page.locator('input[placeholder*="Highway"]').fill('Test Project Title');
    await page.locator('input[placeholder*="MPRDC"]').fill('Test Client');
    // select.nth(0)=Priority, nth(1)=Division, nth(2)=AssignedPM
    await page.locator('select').nth(1).selectOption('Infrastructure');
    await page.locator('textarea').first().fill('This is a test project description that is long enough.');

    await expect(page.getByRole('button', { name: /next/i })).toBeEnabled();
    await page.getByRole('button', { name: /next/i }).click();
    // Step 2 shows the budget label
    await expect(page.getByText('Total Estimated Budget').first()).toBeVisible();
  });

  test('back button returns to previous step', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/new');
    await page.waitForLoadState('networkidle');

    // Fill step 1
    await page.locator('input[placeholder*="TDR"]').fill('TDR/2026/TEST/002');
    await page.locator('input[placeholder*="Highway"]').fill('Another Project');
    await page.locator('input[placeholder*="MPRDC"]').fill('Client Name');
    await page.locator('select').nth(1).selectOption('Education');
    await page.locator('textarea').first().fill('Sufficient description text for validation.');
    await page.getByRole('button', { name: /next/i }).click();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByText('Project Title').first()).toBeVisible();
  });

  test('cancel navigates back to list', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/new');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL('/preproject');
  });
});

// ── Pre-Project Detail ────────────────────────────────────────────────────────

test.describe('Pre-Project Detail', () => {
  test('loads without crash', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('shows all tabs', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    for (const tab of ['Overview', 'Workflow', 'Documents', 'Budget', 'Audit Trail']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    }
  });

  test('Workflow tab shows approval stepper', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Workflow' }).click();
    await expect(page.getByText('Approval Pipeline').first()).toBeVisible();
    await expect(page.getByText('Core Review').first()).toBeVisible();
    await expect(page.getByText('CFO Review').first()).toBeVisible();
  });

  test('Documents tab lists files', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Documents/ }).click();
    await expect(page.getByText('Detailed Project Report')).toBeVisible();
    await expect(page.getByText('Environmental Impact Assessment')).toBeVisible();
  });

  test('Budget tab shows breakdown bars', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Budget' }).click();
    await expect(page.getByText('Civil Works')).toBeVisible();
    await expect(page.getByText('Labour')).toBeVisible();
  });

  test('Audit Trail tab shows history', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Audit Trail' }).click();
    await expect(page.getByText('Immutable Audit Trail')).toBeVisible();
    await expect(page.getByText('SUBMITTED')).toBeVisible();
    await expect(page.getByText('APPROVED')).toBeVisible();
  });

  test('back button returns to list', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/pp-001');
    await page.waitForLoadState('networkidle');
    await page.getByText('Back to Pre-Projects').click();
    await expect(page).toHaveURL('/preproject');
  });

  test('shows not found for invalid id', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/preproject/invalid-id-xyz');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('not found')).toBeVisible();
  });
});

// ── Approval Inbox (enhanced) ─────────────────────────────────────────────────

test.describe('Approval Inbox', () => {
  test('loads with tabs', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Scope to <main> to avoid sidebar matches; use longer timeout for slow CPU scenarios
    const main = page.locator('main');
    await expect(main.getByText('My Queue')).toBeVisible({ timeout: 20000 });
    await expect(main.getByText('All Pending')).toBeVisible();
    await expect(main.locator('button').filter({ hasText: /^Overdue/ }).first()).toBeVisible();
    await expect(main.locator('button').filter({ hasText: /^Completed/ }).first()).toBeVisible();
  });

  test('All Pending tab shows all items', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    await page.getByText('All Pending').click();
    await expect(page.getByText('Highway Widening Phase II')).toBeVisible();
    await expect(page.getByText('Bridge Rehabilitation')).toBeVisible();
  });

  test('Overdue tab shows overdue items', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    await page.locator('button').filter({ hasText: /^Overdue/ }).first().click();
    await page.waitForTimeout(200);
    // Body should either show items or empty state
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('approval card shows SLA progress bar', async ({ page }) => {
    await injectDevAuth(page, 'dev-division_admin-id');
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    await page.getByText('All Pending').click();
    await expect(page.locator('.h-1\\.5').first()).toBeVisible();
  });

  test('Completed tab shows audit log link', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    await page.locator('button').filter({ hasText: /^Completed/ }).first().click();
    // Scope to <main> to avoid matching the sidebar "Audit Log" nav item
    await expect(page.locator('main').getByText('Audit Log').first()).toBeVisible();
  });
});

// ── Workflow Monitor ──────────────────────────────────────────────────────────

test.describe('Workflow Monitor', () => {
  test('loads without crash with KPI cards', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/monitor');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('Pending Approvals')).toBeVisible();
    await expect(page.getByText('Overdue').first()).toBeVisible();
    await expect(page.getByText('On-Time Rate')).toBeVisible();
  });

  test('shows instance table with SLA indicators', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/monitor');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Active Instances')).toBeVisible();
    await expect(page.getByText('Highway Widening Phase II')).toBeVisible();
  });

  test('step filter works', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/monitor');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Core Review' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('My Queue button navigates to approvals', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/monitor');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /My Queue/i }).click();
    await expect(page).toHaveURL('/admin/approvals');
  });
});

// ── Workflow Governance ───────────────────────────────────────────────────────

test.describe('Workflow Governance', () => {
  test('loads without crash', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('Workflow Governance')).toBeVisible();
  });

  test('shows all governance tabs', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    for (const tab of ['Overview', 'SLA Policy', 'Escalation Chain', 'Active Delegates', 'Override History']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    }
  });

  test('SLA Policy tab shows editable thresholds', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'SLA Policy' }).click();
    await expect(page.getByText('Core Team Review')).toBeVisible();
    await expect(page.getByText('CFO Approval')).toBeVisible();
    await expect(page.getByText('Warn after (hours)')).toBeVisible();
  });

  test('Escalation Chain tab shows chain', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Escalation Chain' }).click();
    await expect(page.getByText('Division Admin').first()).toBeVisible();
    await expect(page.getByText('Org Admin').first()).toBeVisible();
  });

  test('Override History tab shows past overrides', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Override History' }).click();
    // Tab button + section heading both contain "Override History" — first() is fine
    await expect(page.getByText('Override History').first()).toBeVisible();
  });

  test('Admin Override button visible for org_admin', async ({ page }) => {
    await injectDevAuth(page, 'dev-org_admin-id');
    await page.goto('/workflow/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Admin Override/i })).toBeVisible();
  });
});

// ── Workflow Training Guide ───────────────────────────────────────────────────

test.describe('Workflow Training Guide', () => {
  test('loads without crash', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/training');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('Workflow Training Guide')).toBeVisible();
  });

  test('shows all role selector cards', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/training');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Project Manager')).toBeVisible();
    await expect(page.getByText('Division Head')).toBeVisible();
    await expect(page.getByText('CFO / Executive')).toBeVisible();
    await expect(page.getByText('Org Admin').first()).toBeVisible();
  });

  test('switching roles updates guide content', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/training');
    await page.waitForLoadState('networkidle');
    await page.getByText('Division Head').click();
    await expect(page.getByText("Don't approve without reading").first()).toBeVisible();
  });

  test('FAQ items expand on click', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/workflow/training');
    await page.waitForLoadState('networkidle');
    const firstFaq = page.locator('button').filter({ hasText: /My project was sent back/ }).first();
    await firstFaq.click();
    await expect(page.getByText('Open the project, read the')).toBeVisible();
  });
});

// ── Governance Dashboard ──────────────────────────────────────────────────────

test.describe('Governance Dashboard', () => {
  test('loads without crash with KPIs', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.getByText('Total Planned Budget')).toBeVisible();
    await expect(page.getByText('Budget Alerts')).toBeVisible();
    await expect(page.getByText('Overdue Milestones')).toBeVisible();
  });

  test('Budget Tracker tab shows project cards', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Bridge Rehabilitation')).toBeVisible();
    await expect(page.getByText('Rural Water Supply Pipeline')).toBeVisible();
  });

  test('Milestone Approvals tab works', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Milestone Approvals' }).click();
    await expect(page.locator('body')).not.toContainText('TypeError');
  });

  test('division filter narrows results', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Education' }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Model School Construction')).toBeVisible();
  });

  test('budget breakdown expands on click', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await page.getByText('Show category breakdown').first().click();
    await expect(page.getByText('Civil Works')).toBeVisible();
  });
});

// ── Project Closure ───────────────────────────────────────────────────────────

test.describe('Project Closure', () => {
  test('loads without crash and shows project selector', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance/closure');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    // Use heading role to avoid matching the "Project Closure" sidebar nav item
    await expect(page.getByRole('heading', { name: /Project Closure/i }).first()).toBeVisible();
    await expect(page.getByText('Model School Construction')).toBeVisible();
    await expect(page.getByText('District Court Complex Renovation')).toBeVisible();
  });

  test('Next button disabled until project selected', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance/closure');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Start Closure/i })).toBeDisabled();
  });

  test('selecting project enables Start Closure', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance/closure');
    await page.waitForLoadState('networkidle');
    await page.getByText('Model School Construction').click();
    await expect(page.getByRole('button', { name: /Start Closure/i })).toBeEnabled();
  });

  test('progresses through checklist step', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/governance/closure');
    await page.waitForLoadState('networkidle');
    await page.getByText('Model School Construction').click();
    await page.getByRole('button', { name: /Start Closure/i }).click();
    // Scope checklist items to <main> — sidebar has "Financial Dashboard" which also
    // matches 'Financial' but may be scrolled out of view (not truly visible)
    const main = page.locator('main');
    await expect(main.getByText('Closure Checklist')).toBeVisible({ timeout: 15000 });
    await expect(main.getByText('Technical')).toBeVisible();
    await expect(main.getByText('Financial')).toBeVisible();
    await expect(main.getByText('Administrative')).toBeVisible();
  });
});
