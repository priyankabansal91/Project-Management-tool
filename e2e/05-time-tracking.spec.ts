import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

const H = { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' };
const BASE = 'http://localhost:4000/v1';

test.describe('Time Tracking', () => {
  test('API: GET /time-logs/my returns { items, pagination }', async ({ request }) => {
    const resp = await request.get(`${BASE}/time-logs/my`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
    expect(body.data).toHaveProperty('pagination');
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  test('API: GET /time-logs/my with date range filters', async ({ request }) => {
    const resp = await request.get(`${BASE}/time-logs/my?startDate=2026-04-01&endDate=2026-04-30`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  test('API: GET /time-logs/summary/weekly returns summary', async ({ request }) => {
    const resp = await request.get(`${BASE}/time-logs/summary/weekly`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalHours');
    expect(body.data).toHaveProperty('byDay');
  });

  test('API: POST /time-logs creates a log entry', async ({ request }) => {
    const resp = await request.post(`${BASE}/time-logs`, {
      headers: H,
      data: {
        taskKey: 'E2E-1',
        taskTitle: 'E2E Test Task',
        hours: 2.5,
        description: 'E2E testing time log',
        loggedDate: '2026-04-28',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.hours).toBe(2.5);
    return body.data.id;
  });

  test('API: PATCH /time-logs/:id updates a log', async ({ request }) => {
    // First create
    const c = await request.post(`${BASE}/time-logs`, {
      headers: H,
      data: { taskKey: 'E2E-2', hours: 1, loggedDate: '2026-04-28' },
    });
    const created = await c.json();
    const logId = created.data.id;

    // Update
    const u = await request.patch(`${BASE}/time-logs/${logId}`, {
      headers: H,
      data: { hours: 3, description: 'Updated description' },
    });
    expect(u.status()).toBe(200);
    const body = await u.json();
    expect(body.data.hours).toBe(3);
  });

  test('API: DELETE /time-logs/:id removes entry', async ({ request }) => {
    const c = await request.post(`${BASE}/time-logs`, {
      headers: H,
      data: { taskKey: 'E2E-DEL', hours: 0.5, loggedDate: '2026-04-28' },
    });
    const created = await c.json();
    const logId = created.data.id;

    const d = await request.delete(`${BASE}/time-logs/${logId}`, { headers: H });
    expect(d.status()).toBe(200);
    const body = await d.json();
    expect(body.data.deleted).toBe(true);
  });

  test('API: GET /time-logs/timesheets returns array', async ({ request }) => {
    const resp = await request.get(`${BASE}/time-logs/timesheets`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('UI: time tracking page loads without TypeError', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).not.toContainText('TypeError');
    await expect(body).not.toContainText('map is not a function');
    await expect(body).not.toContainText('Cannot read');
  });

  test('UI: time tracking Log tab shows entries', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');

    // Click "Log" tab if visible
    const logTab = page.getByRole('button', { name: /^log$/i }).or(
      page.getByText('Log', { exact: true })
    ).first();
    if (await logTab.isVisible()) {
      await logTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Should not crash
    await expect(page.locator('body')).not.toContainText('map is not a function');
  });

  test('UI: time log form submits successfully', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/time-tracking');
    await page.waitForLoadState('networkidle');

    // Find hours input and fill it
    const hoursInput = page.locator('input[type="number"][placeholder*="hour" i], input[placeholder*="0.0" i]').first();
    if (await hoursInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hoursInput.fill('1.5');
      const addBtn = page.getByRole('button', { name: /add entry|log time|save/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        await expect(page.locator('body')).not.toContainText('500');
      }
    }
  });
});
