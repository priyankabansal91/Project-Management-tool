import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

const H = { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' };
const BASE = 'http://localhost:4000/v1';
const TS = Date.now();

test.describe('Projects CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await injectDevAuth(page);
  });

  // ── API tests ──────────────────────────────────────────────

  test('API: create project without key (auto-generated)', async ({ request }) => {
    const resp = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `AutoKey Project ${TS}`, visibility: 'private', color: '#3B82F6' },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.key).toBeTruthy();
    expect(body.data.id).toBeTruthy();
    // Cleanup
    await request.delete(`${BASE}/projects/${body.data.id}`, { headers: H });
  });

  test('API: create project with explicit key', async ({ request }) => {
    const resp = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `Keyed Project ${TS}`, key: `KP${TS % 9999}`, visibility: 'private', color: '#3B82F6' },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    await request.delete(`${BASE}/projects/${body.data.id}`, { headers: H });
  });

  test('API: list projects returns paginated items', async ({ request }) => {
    const resp = await request.get(`${BASE}/projects`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data).toHaveProperty('pagination');
  });

  test('API: get project by ID returns project', async ({ request }) => {
    const create = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `GetById ${TS}`, visibility: 'private', color: '#3B82F6' },
    });
    const { data: proj } = await create.json();

    const get = await request.get(`${BASE}/projects/${proj.id}`, { headers: H });
    expect(get.status()).toBe(200);
    const body = await get.json();
    expect(body.data.id).toBe(proj.id);
    await request.delete(`${BASE}/projects/${proj.id}`, { headers: H });
  });

  test('API: update project name and color', async ({ request }) => {
    const create = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `Update Me ${TS}`, visibility: 'private', color: '#3B82F6' },
    });
    const { data: proj } = await create.json();

    const update = await request.patch(`${BASE}/projects/${proj.id}`, {
      headers: H,
      data: { name: 'Updated Name', color: '#EF4444' },
    });
    expect(update.status()).toBe(200);
    const body = await update.json();
    expect(body.data.name).toBe('Updated Name');
    expect(body.data.color).toBe('#EF4444');
    await request.delete(`${BASE}/projects/${proj.id}`, { headers: H });
  });

  test('API: delete project returns 204', async ({ request }) => {
    const create = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `Delete Me ${TS}`, key: `DEL${TS % 9999}`, visibility: 'private', color: '#EF4444' },
    });
    const { data: proj } = await create.json();

    const del = await request.delete(`${BASE}/projects/${proj.id}`, { headers: H });
    expect(del.status()).toBe(204);

    // Verify it's gone
    const get = await request.get(`${BASE}/projects/${proj.id}`, { headers: H });
    expect(get.status()).toBe(404);
  });

  test('API: duplicate project key returns 400', async ({ request }) => {
    const create1 = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `DupKey1 ${TS}`, key: `DK${TS % 9000}`, visibility: 'private', color: '#3B82F6' },
    });
    const { data: proj1 } = await create1.json();

    const create2 = await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: `DupKey2 ${TS}`, key: proj1.key, visibility: 'private', color: '#3B82F6' },
    });
    expect(create2.status()).toBe(400);
    await request.delete(`${BASE}/projects/${proj1.id}`, { headers: H });
  });

  test('API: project with division_id and start/due dates', async ({ request }) => {
    const resp = await request.post(`${BASE}/projects`, {
      headers: H,
      data: {
        name: `Dated Project ${TS}`,
        visibility: 'org_wide',
        color: '#10B981',
        start_date: '2026-05-01',
        due_date: '2026-12-31',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.start_date).toBeTruthy();
    expect(body.data.due_date).toBeTruthy();
    await request.delete(`${BASE}/projects/${body.data.id}`, { headers: H });
  });

  // ── UI tests ───────────────────────────────────────────────

  test('UI: project list page loads', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('UI: create project via form fills name AND key', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const newBtn = page.getByRole('button', { name: /new project/i }).or(
      page.getByRole('button', { name: /create project/i })
    ).first();
    await expect(newBtn).toBeVisible({ timeout: 8000 });
    await newBtn.click();

    // Fill project name (modal is open - first text input is the name field)
    const nameInput = page.locator('input[placeholder*="Customer Portal" i], input[placeholder*="project" i]').first();
    const fallbackName = page.locator('input[type="text"]').first();
    const targetName = nameInput.or(fallbackName).first();
    await expect(targetName).toBeVisible({ timeout: 5000 });
    await targetName.fill(`UI Test Project ${TS % 10000}`);

    // Fill key field (label says "Project Code")
    const keyInput = page.locator('input[placeholder*="CPR" i], input[placeholder*="code" i], input[maxlength="10"]').first();
    if (await keyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await keyInput.fill(`UT${TS % 9999}`);
    }

    // Select first available Project Lead (required to pass step 1 validation)
    const leadSelect = page.locator('select').filter({ hasText: /select project lead/i });
    if (await leadSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await leadSelect.locator('option').all();
      // Pick first non-placeholder option (index 1+)
      if (options.length > 1) {
        const firstValue = await options[1].getAttribute('value');
        if (firstValue) await leadSelect.selectOption(firstValue);
      }
    }

    // Advance to step 2 (Next: Add Milestones →)
    const nextBtn = page.getByRole('button', { name: /next.*milestones|next/i });
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Submit — button text is "Create Project" or "Submit for Approval"
    const submitBtn = page.getByRole('button', { name: /create project|submit for approval/i }).last();
    await submitBtn.click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should not show error
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Failed to create');
  });

  test('UI: project kanban board loads for seeded project', async ({ page, request }) => {
    // Use first real (UUID) project
    const resp = await request.get(`${BASE}/projects`, { headers: H });
    const body = await resp.json();
    const project = body.data.items.find((p: any) =>
      p.id.includes('-') && p.id.length > 20
    ) || body.data.items[0];

    await page.goto(`/projects/${project.id}/board`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});
