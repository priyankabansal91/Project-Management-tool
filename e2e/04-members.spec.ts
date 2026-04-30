import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

const H = { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' };
const BASE = 'http://localhost:4000/v1';

test.describe('Members / Team Management', () => {
  test('API: list members returns array with pagination', async ({ request }) => {
    const resp = await request.get(`${BASE}/members`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
  });

  test('API: list members with page_size param works', async ({ request }) => {
    const resp = await request.get(`${BASE}/members?page=1&page_size=2`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.items.length).toBeLessThanOrEqual(2);
  });

  test('API: update member role succeeds', async ({ request }) => {
    const resp = await request.patch(`${BASE}/members/dev-member-id/role`, {
      headers: H,
      data: { role: 'project_manager' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.role).toBe('project_manager');

    // Restore original role
    await request.patch(`${BASE}/members/dev-member-id/role`, {
      headers: H,
      data: { role: 'member' },
    });
  });

  test('API: update member status to suspended', async ({ request }) => {
    const resp = await request.patch(`${BASE}/members/dev-viewer-id/status`, {
      headers: H,
      data: { status: 'suspended' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.status).toBe('suspended');

    // Restore
    await request.patch(`${BASE}/members/dev-viewer-id/status`, {
      headers: H,
      data: { status: 'active' },
    });
  });

  test('API: invite member with invalid role returns 400', async ({ request }) => {
    const resp = await request.post(`${BASE}/members/invite`, {
      headers: H,
      data: { email: 'new@test.local', role: 'superadmin' },
    });
    expect(resp.status()).toBe(400);
  });

  test('API: cannot remove self', async ({ request }) => {
    const resp = await request.delete(`${BASE}/members/dev-org_admin-id`, { headers: H });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.success).toBe(false);
  });

  test('UI: Team page loads without crash', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('UI: /admin/users page renders member list', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).not.toContainText('TypeError');
    // Should list at least one member
    await expect(body).toContainText('Sharma', { timeout: 8000 });
  });
});
